const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
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

// CORS для клиента (замените на свой домен GitHub Pages)
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

// ==================== REST API (Аутентификация) ====================

// Регистрация
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
      data: { username, email, passwordHash, name: username },
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

// Вход
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

// Middleware для проверки токена
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

// Получение данных текущего пользователя
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

// ==================== SOCKET.IO (Чат) с поддержкой токена ====================
const socketUsers = new Map(); // socket.id -> { userId, username, room }

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

  // Получаем данные пользователя из БД
  const user = await prisma.user.findUnique({
    where: { id: socket.userId },
    select: { id: true, username: true },
  });
  if (!user) return socket.disconnect();

  socket.on('join', async ({ room }) => {
    socket.join(room);
    socketUsers.set(socket.id, { userId: user.id, username: user.username, room });

    // Загружаем историю сообщений (последние 50)
    const messages = await prisma.message.findMany({
      where: { room },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: { user: { select: { username: true } } },
    });

    socket.emit('history', messages.map(msg => ({
      id: msg.id,
      user: msg.user.username,
      text: msg.text,
      time: msg.createdAt,
    })));

    socket.to(room).emit('user-joined', `${user.username} вошёл в чат`);
  });

  socket.on('message', async (text) => {
    const socketUser = socketUsers.get(socket.id);
    if (!socketUser) return;

    const msg = await prisma.message.create({
      data: {
        room: socketUser.room,
        text,
        userId: socketUser.userId,
      },
      include: { user: { select: { username: true } } },
    });

    io.to(socketUser.room).emit('message', {
      id: msg.id,
      user: msg.user.username,
      text: msg.text,
      time: msg.createdAt,
    });
  });

  socket.on('disconnect', () => {
    const user = socketUsers.get(socket.id);
    if (user) {
      io.to(user.room).emit('user-left', `${user.username} покинул чат`);
      socketUsers.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Сервер работает на порту ${PORT}`);
});
