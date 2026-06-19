import React, { useState, useEffect, useRef, useContext } from 'react';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';

// Using a demo API key for Giphy. In production, use your own key.
const gf = new GiphyFetch('sXpGFDGpz0Dv1VnqiMOPLpPHTaA27kXy');

const GroupChat = ({ group }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showGiphy, setShowGiphy] = useState(false);
  const [searchGiphy, setSearchGiphy] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch History
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/api/community/chat/history/${group.id}/`);
        setMessages(res.data);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };
    fetchHistory();

    // Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend domain, which is usually where API requests go (e.g., localhost:8000)
    // api.defaults.baseURL is usually 'http://localhost:8000'
    const backendUrl = api.defaults.baseURL || 'http://localhost:8000';
    const wsUrl = backendUrl.replace('http', 'ws') + `/ws/chat/${group.id}/`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [group.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = (text, imageUrl = '', gifUrl = '') => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        message: text,
        image_url: imageUrl,
        gif_url: gifUrl,
        user_id: user?.id
      }));
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/api/community/chat/upload_image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      sendMessage('', res.data.image_url, '');
    } catch (err) {
      console.error('Image upload failed', err);
      alert(err.response?.data?.error || 'Failed to upload image.');
    }
  };

  const handleBlockUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to block/unblock ${username} from this group?`)) return;
    try {
      const res = await api.post(`/api/community/communities/${group.id}/block_user/`, { user_id: userId });
      alert(res.data.message);
      // Reload history
      const historyRes = await api.get(`/api/community/chat/history/${group.id}/`);
      setMessages(historyRes.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to block user.");
    }
  };

  const onGifClick = (gif, e) => {
    e.preventDefault();
    sendMessage('', '', gif.images.fixed_height.url);
    setShowGiphy(false);
  };

  return (
    <div className="neo-card p-3 mb-4 d-flex flex-column" style={{ height: '500px', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <h6 className="fw-bold mb-0">
          <i className="bi bi-chat-dots-fill text-primary me-2"></i>
          Live Group Chat
        </h6>
        <span className={`badge ${isConnected ? 'bg-success' : 'bg-danger'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-auto pe-2 d-flex flex-column gap-3 mb-3">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id || idx} className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}>
              <div className="small text-muted mb-1 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem' }}>
                <span>{isMe ? 'You' : msg.sender} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                {group.is_admin && !isMe && (
                  <button 
                    onClick={() => handleBlockUser(msg.sender_id, msg.sender)}
                    className="btn btn-sm btn-link text-danger p-0 ms-2 text-decoration-none"
                    style={{ fontSize: '0.65rem' }}
                    title="Block User"
                  >
                    <i className="bi bi-slash-circle me-1"></i>Block
                  </button>
                )}
              </div>
              <div 
                className={`p-2 px-3 shadow-sm`} 
                style={{ 
                  borderRadius: '15px', 
                  borderBottomRightRadius: isMe ? '0px' : '15px',
                  borderBottomLeftRadius: !isMe ? '0px' : '15px',
                  backgroundColor: isMe ? '#e0f2fe' : '#ffffff',
                  maxWidth: '80%'
                }}
              >
                {msg.message && <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>}
                {msg.image_url && <img src={msg.image_url} alt="upload" className="img-fluid rounded mt-1" style={{ maxHeight: '200px' }} />}
                {msg.gif_url && <img src={msg.gif_url} alt="gif" className="img-fluid rounded mt-1" style={{ maxHeight: '150px' }} />}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Giphy Picker */}
      {showGiphy && (
        <div className="neo-inset p-2 mb-2 bg-white rounded shadow" style={{ height: '250px', overflowY: 'auto' }}>
          <div className="d-flex justify-content-between mb-2">
            <input 
              type="text" 
              className="form-control form-control-sm" 
              placeholder="Search GIFs..." 
              value={searchGiphy}
              onChange={e => setSearchGiphy(e.target.value)}
            />
            <button type="button" className="btn-close ms-2 mt-1" onClick={() => setShowGiphy(false)}></button>
          </div>
          <Grid 
            width={350} 
            columns={3} 
            fetchGifs={(offset) => searchGiphy ? gf.search(searchGiphy, { offset, limit: 10 }) : gf.trending({ offset, limit: 10 })}
            key={searchGiphy}
            onGifClick={onGifClick}
          />
        </div>
      )}

      {/* Input Area */}
      {group.is_member ? (
        <form onSubmit={handleSendText} className="d-flex gap-2 mt-auto pt-2 border-top">
          <button 
            type="button" 
            className="btn btn-light border rounded-circle" 
            onClick={() => setShowGiphy(!showGiphy)}
            title="Send GIF"
          >
            <span className="fw-bold" style={{ fontSize: '0.8rem' }}>GIF</span>
          </button>
          
          {user?.role !== 'CUSTOMER' && (
            <label className="btn btn-light border rounded-circle cursor-pointer mb-0 d-flex align-items-center justify-content-center" title="Upload Image">
              <i className="bi bi-image"></i>
              <input type="file" accept="image/*" className="d-none" onChange={handleImageUpload} />
            </label>
          )}

          <input 
            type="text" 
            className="form-control" 
            placeholder="Type a message..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center">
            <i className="bi bi-send-fill"></i>
          </button>
        </form>
      ) : (
        <div className="mt-auto pt-3 border-top text-center text-muted">
          <i className="bi bi-lock-fill fs-4 d-block mb-1"></i>
          <span className="small fw-semibold">Join this group to participate in the live chat.</span>
        </div>
      )}
    </div>
  );
};

export default GroupChat;
