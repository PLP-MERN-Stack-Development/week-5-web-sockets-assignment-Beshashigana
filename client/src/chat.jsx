import { useState, useEffect, useRef } from 'react';
import { socket } from './socket';

export default function Chat({ username }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('join', { username });

    socket.on('receiveMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('typing', (user) => {
      setTypingUser(`${user} is typing...`);
      setTimeout(() => setTypingUser(''), 3000);
    });

    socket.on('userJoined', (user) => {
      setMessages(prev => [...prev, { 
        sender: 'System', 
        content: `${user} joined the chat` 
      }]);
    });

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('typing');
      socket.off('userJoined');
      socket.off('onlineUsers');
    };
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('sendMessage', { content: message });
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="online-users">
        <h3>Online: {onlineUsers.join(', ')}</h3>
      </div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className="message">
            <strong>{msg.sender}: </strong>{msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="typing-indicator">{typingUser}</div>
      <div className="input-area">
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            socket.emit('typing');
          }}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}