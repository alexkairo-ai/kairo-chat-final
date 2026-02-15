// ==================== РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ СООБЩЕНИЙ ====================

// Редактировать сообщение (только отправитель)
app.put('/api/messages/:messageId', authenticate, async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Текст не может быть пустым' });
    }

    const message = await prisma.privateMessage.findUnique({
      where: { id: messageId }
    });
    if (!message) return res.status(404).json({ error: 'Сообщение не найдено' });
    if (message.senderId !== req.userId) {
      return res.status(403).json({ error: 'Нельзя редактировать чужое сообщение' });
    }

    const updated = await prisma.privateMessage.update({
      where: { id: messageId },
      data: { text, updatedAt: new Date() }
    });
    // Уведомить получателя через сокет
    io.to(`user:${message.receiverId}`).emit('message-updated', updated);
    // Отправить обновление отправителю (если он в другом окне)
    io.to(`user:${req.userId}`).emit('message-updated', updated);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить сообщение (только отправитель)
app.delete('/api/messages/:messageId', authenticate, async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const message = await prisma.privateMessage.findUnique({
      where: { id: messageId }
    });
    if (!message) return res.status(404).json({ error: 'Сообщение не найдено' });
    if (message.senderId !== req.userId) {
      return res.status(403).json({ error: 'Нельзя удалять чужое сообщение' });
    }

    await prisma.privateMessage.delete({ where: { id: messageId } });
    // Уведомить получателя и отправителя
    io.to(`user:${message.receiverId}`).emit('message-deleted', messageId);
    io.to(`user:${req.userId}`).emit('message-deleted', messageId);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
