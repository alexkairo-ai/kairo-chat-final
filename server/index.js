const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const app = express();
const server = http.createServer(app);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const allowedOrigins = [
  'http://localhost:5173',
  'https://alexkairo-ai.github.io'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ==================== REST API ====================

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(400).json({ error: 'Email или username уже заняты' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Требуется авторизация' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
};

app.get('/api/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== Друзья (как ранее) ====================
app.get('/api/users/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await prisma.user.findMany({
      where: {
        username: { contains: q, mode: 'insensitive' },
        NOT: { id: req.userId }
      },
      take: 10,
      select: { id: true, username: true }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/friends/request', authenticate, async (req, res) => {
  try {
    const { username } = req.body;
    const receiver = await prisma.user.findUnique({ where: { username } });
    if (!receiver) return res.status(404).json({ error: 'Пользователь не найден' });

    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { senderId: req.userId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: req.userId }
        ]
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'Запрос уже существует или вы уже друзья' });
    }

    await prisma.friend.create({
      data: {
        senderId: req.userId,
        receiverId: receiver.id,
        status: 'pending'
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/friends', authenticate, async (req, res) => {
  try {
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { senderId: req.userId, status: 'accepted' },
          { receiverId: req.userId, status: 'accepted' }
        ]
      },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } }
      }
    });
    const result = friends.map(f => 
      f.senderId === req.userId ? f.receiver : f.sender
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/friends/requests', authenticate, async (req, res) => {
  try {
    const requests = await prisma.friend.findMany({
      where: { receiverId: req.userId, status: 'pending' },
      include: { sender: { select: { id: true, username: true } } }
    });
    res.json(requests.map(r => r.sender));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/friends/respond/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const senderId = parseInt(req.params.id);
    const friend = await prisma.friend.findFirst({
      where: {
        senderId,
        receiverId: req.userId,
        status: 'pending'
      }
    });
    if (!friend) return res.status(404).json({ error: 'Запрос не найден' });

    await prisma.friend.update({
      where: { id: friend.id },
      data: { status }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== Группы (как ранее) ====================
app.post('/api/groups', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Название обязательно' });
    const existing = await prisma.group.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Группа с таким названием уже существует' });

    const group = await prisma.group.create({
      data: {
        name,
        description,
        ownerId: req.userId,
        members: {
          create: {
            userId: req.userId,
            role: 'owner'
          }
        }
      }
    });
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/groups', authenticate, async (req, res) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.userId },
      include: { group: true }
    });
    const groups = memberships.map(m => m.group);
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/groups/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const groups = await prisma.group.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' }
      },
      take: 10
    });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/groups/:groupId/join', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Группа не найдена' });

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.userId } }
    });
    if (existing) return res.status(400).json({ error: 'Вы уже в группе' });

    await prisma.groupMember.create({
      data: {
        groupId,
        userId: req.userId,
        role: 'member'
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/groups/:groupId/messages', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.userId } }
    });
    if (!membership) return res.status(403).json({ error: 'Вы не в группе' });

    const messages = await prisma.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: { user: { select: { username: true } } }
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== НОВЫЕ ЭНДПОИНТЫ ДЛЯ ЛИЧНЫХ СООБЩЕНИЙ ====================

// Получить список друзей с количеством непрочитанных сообщений
app.get('/api/friends-with-unread', authenticate, async (req, res) => {
  try {
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { senderId: req.userId, status: 'accepted' },
          { receiverId: req.userId, status: 'accepted' }
        ]
      },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } }
      }
    });
    const friendsList = friends.map(f => 
      f.senderId === req.userId ? f.receiver : f.sender
    );

    // Для каждого друга считаем непрочитанные сообщения, где получатель – текущий пользователь
    const friendsWithUnread = await Promise.all(friendsList.map(async (friend) => {
      const unreadCount = await prisma.privateMessage.count({
        where: {
          senderId: friend.id,
          receiverId: req.userId,
          status: { not: 'read' }
        }
      });
      return { ...friend, unreadCount };
    }));
    res.json(friendsWithUnread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить историю личных сообщений с другом
app.get('/api/messages/:friendId', authenticate, async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId);
    const messages = await prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: req.userId, receiverId: friendId },
          { senderId: friendId, receiverId: req.userId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отметить сообщения как прочитанные (когда открыт чат)
app.put('/api/messages/read/:friendId', authenticate, async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId);
    await prisma.privateMessage.updateMany({
      where: {
        senderId: friendId,
        receiverId: req.userId,
        status: { not: 'read' }
      },
      data: { status: 'read', readAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== УДАЛЕНИЕ АККАУНТА ====================
app.delete('/api/user', authenticate, async (req, res) => {
  try {
    // Удаляем все связанные данные (сообщения, дружбу, членство в группах)
    await prisma.privateMessage.deleteMany({
      where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] }
    });
    await prisma.groupMessage.deleteMany({ where: { userId: req.userId } });
    await prisma.groupMember.deleteMany({ where: { userId: req.userId } });
    await prisma.friend.deleteMany({
      where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] }
    });
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== SOCKET.IO ====================
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  console.log('✅ Подключился:', socket.id);
  const user = await prisma.user.findUnique({
    where: { id: socket.userId },
    select: { id: true, username: true },
  });
  if (!user) return socket.disconnect();

  // Присоединяем к комнате пользователя (для личных уведомлений)
  socket.join(`user:${user.id}`);

  // Обработка личных сообщений
  socket.on('private-message', async ({ receiverId, text }) => {
    const message = await prisma.privateMessage.create({
      data: {
        senderId: user.id,
        receiverId,
        text,
        status: 'sent'
      }
    });
    // Отправляем отправителю с временным id и статусом
    socket.emit('private-message', { ...message, tempId: Date.now() });
    // Отправляем получателю, если он онлайн
    io.to(`user:${receiverId}`).emit('private-message', message);
  });

  // Когда сообщение доставлено (клиент получил) – можно обновить статус
  socket.on('message-delivered', async ({ messageId }) => {
    await prisma.privateMessage.update({
      where: { id: messageId },
      data: { status: 'delivered' }
    });
    // Уведомить отправителя об изменении статуса
    const message = await prisma.privateMessage.findUnique({ where: { id: messageId } });
    if (message) {
      io.to(`user:${message.senderId}`).emit('message-status', { id: messageId, status: 'delivered' });
    }
  });

  // Когда сообщение прочитано
  socket.on('message-read', async ({ messageId }) => {
    await prisma.privateMessage.update({
      where: { id: messageId },
      data: { status: 'read', readAt: new Date() }
    });
    const message = await prisma.privateMessage.findUnique({ where: { id: messageId } });
    if (message) {
      io.to(`user:${message.senderId}`).emit('message-status', { id: messageId, status: 'read' });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Сервер работает на порту ${PORT}`);
});
