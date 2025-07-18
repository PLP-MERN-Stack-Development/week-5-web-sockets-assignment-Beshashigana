require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  online: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  content: String,
  room: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});
const Message = mongoose.model('Message', messageSchema);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins
  socket.on('join', async ({ username, room }) => {
    socket.join(room);
    await User.updateOne({ username }, { online: true });
    io.emit('userOnline', username);
    console.log(`${username} joined ${room}`);
  });

  // Handle messages
  socket.on('sendMessage', async ({ sender, receiver, content, room }) => {
    const message = new Message({ sender, receiver, content, room });
    await message.save();
    io.to(room).emit('receiveMessage', message);
  });

  // Typing indicator
  socket.on('typing', ({ room, username }) => {
    socket.to(room).broadcast.emit('typing', username);
  });

  // Mark messages as read
  socket.on('markAsRead', async ({ messageIds, room }) => {
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { read: true } }
    );
    io.to(room).emit('messagesRead', messageIds);
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    // Find user by socket ID and set offline
    // This would require storing socket IDs with users
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));// Add to server.js
const users = new Map();

io.on('connection', (socket) => {
  // User joins
  socket.on('join', ({ username }) => {
    users.set(socket.id, username);
    socket.broadcast.emit('userJoined', username);
    io.emit('onlineUsers', Array.from(users.values()));
  });

  // Handle messages
  socket.on('sendMessage', ({ content }) => {
    const username = users.get(socket.id);
    const message = {
      sender: username,
      content,
      timestamp: new Date().toISOString()
    };
    io.emit('receiveMessage', message);
  });

  // Typing indicator
  socket.on('typing', () => {
    const username = users.get(socket.id);
    socket.broadcast.emit('typing', username);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    if (username) {
      socket.broadcast.emit('userLeft', username);
      io.emit('onlineUsers', Array.from(users.values()));
    }
  });
});
// Add to server.js
socket.on('sendPrivateMessage', ({ to, content }) => {
  const from = users.get(socket.id);
  const message = {
    from,
    to,
    content,
    timestamp: new Date().toISOString()
  };
  
  // Find recipient's socket and emit
  const recipientSocket = [...users.entries()]
    .find(([_, username]) => username === to)?.[0];
  
  if (recipientSocket) {
    io.to(recipientSocket).emit('receivePrivateMessage', message);
  }
  
  // Also send back to sender for their UI
  socket.emit('receivePrivateMessage', message);
});