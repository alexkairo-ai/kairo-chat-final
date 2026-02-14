const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://alexkairo-ai.github.io", "http://localhost:5173"], // замените на свой GitHub Pages URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) console.error('❌ Ошибка БД:', err.message);
  else console.log('✅ База данных подключена');
});

const messages = [];
const users = new Map();

io.on('connection', (socket) => {
  console.log('✅ Подключился:', socket.id);

  socket.on('join', ({ name, room }) => {
    socket.join(room);
    users.set(socket.id, { name, room });
    const roomMessages = messages.filter(m => m.room === room).slice(-50);
    socket.emit('history', roomMessages);
    socket.to(room).emit('user-joined', `${name} вошёл в чат`);
  });

  socket.on('message', (text) => {
    const user = users.get(socket.id);
    if (!user) return;
    const msg = {
      id: Date.now(),
      user: user.name,
      text,
      room: user.room,
      time: new Date().toISOString()
    };
    messages.push(msg);
    io.to(user.room).emit('message', msg);
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      io.to(user.room).emit('user-left', `${user.name} покинул чат`);
      users.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Сервер работает на порту ${PORT}`);
});
