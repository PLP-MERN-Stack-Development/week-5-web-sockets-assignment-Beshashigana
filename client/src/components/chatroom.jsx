import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Box, TextField, Button, List, ListItem, ListItemText, Typography } from '@mui/material';

const ChatRoom = ({ username, room }) => {
  const { messages, sendMessage, typingUsers, sendTyping, onlineUsers } = useSocket();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage({
        sender: username,
        room,
        content: message
      });
      setMessage('');
    }
  };

  const handleTyping = () => {
    sendTyping({ room, username });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6">Room: {room} | Online: {onlineUsers.join(', ')}</Typography>
      
      <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
        <List>
          {messages.filter(m => m.room === room).map((msg, i) => (
            <ListItem key={i}>
              <ListItemText 
                primary={`${msg.sender}: ${msg.content}`}
                secondary={new Date(msg.timestamp).toLocaleTimeString()}
              />
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
        {typingUsers.length > 0 && (
          <Typography variant="caption">
            {typingUsers.join(', ')} is typing...
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message"
        />
        <Button variant="contained" onClick={handleSend}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatRoom;