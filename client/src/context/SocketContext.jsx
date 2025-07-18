import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../socket/socket';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });
    socket.on('typing', (username) => {
      setTypingUsers((prev) => [...prev, username]);
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter(u => u !== username));
      }, 3000);
    });
    socket.on('userOnline', (username) => {
      setOnlineUsers((prev) => [...new Set([...prev, username])]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receiveMessage');
      socket.off('typing');
    };
  }, []);

  const value = {
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    joinRoom: (data) => socket.emit('join', data),
    sendMessage: (data) => socket.emit('sendMessage', data),
    sendTyping: (data) => socket.emit('typing', data),
    markAsRead: (data) => socket.emit('markAsRead', data)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);