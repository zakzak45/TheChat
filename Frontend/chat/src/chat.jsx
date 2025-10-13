import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom'
import io from 'socket.io-client';
import {
  User, Settings, Send, Edit, Bell, LogOut, Home,
  Moon, Sun, Monitor, Paperclip, Volume2, VolumeX,
  ArrowDown, Smile, Type, Minimize2
} from "lucide-react";
import { useAuth } from "./useAuth.jsx";
import './chat.css';

const Chat = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [user, setUser] = useState("Loading...");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const socketRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = sessionStorage.getItem("notifications");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [theme, setTheme] = useState(() => sessionStorage.getItem("theme") || "dark");


  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = sessionStorage.getItem("soundEnabled");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoScroll, setAutoScroll] = useState(() => {
    const saved = sessionStorage.getItem("autoScroll");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showEmotions, setShowEmotions] = useState(() => {
    const saved = sessionStorage.getItem("showEmotions");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = sessionStorage.getItem("fontSize");
    return saved || "medium";
  });
  const [compactMode, setCompactMode] = useState(() => {
    const saved = sessionStorage.getItem("compactMode");
    return saved !== null ? JSON.parse(saved) : false;
  });

  const token = sessionStorage.getItem("token");

  const fetchMessages = async () => {
    try {
      const response = await fetch('https://brochat2.onrender.com/messages', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem("token")}`
        }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('https://brochat2.onrender.com/me', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem("token")}`
        }
      });
      const userData = await response.json();
      setUser(userData.username);
      setCurrentUser(userData);
      setCurrentUserId(userData._id);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser("User");
      setCurrentUser(null);
    }
  };

  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('https://brochat2.onrender.com/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem("token")}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);

        fetchMessages();
        alert('Profile picture updated successfully!');
      } else {
        alert(data.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    }
  };
  const sendMessage = async () => {
    if (!message.trim() && !file) return;
    try {
      const formData = new FormData();

      formData.append("message", message);
      if (file) formData.append("file", file);

      await fetch('https://brochat2.onrender.com/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem("token")}`
        },
        body: formData,
      });
      setMessage('');
      setFile(null);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };



  const handleLogout = () => {
    logout(navigate);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    sessionStorage.setItem("theme", newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const handleNotificationToggle = (value) => {
    setNotifications(value);
    sessionStorage.setItem("notifications", JSON.stringify(value));
  };

  const handleSoundToggle = (value) => {
    setSoundEnabled(value);
    sessionStorage.setItem("soundEnabled", JSON.stringify(value));
  };

  const handleAutoScrollToggle = (value) => {
    setAutoScroll(value);
    sessionStorage.setItem("autoScroll", JSON.stringify(value));
  };

  const handleEmotionsToggle = (value) => {
    setShowEmotions(value);
    sessionStorage.setItem("showEmotions", JSON.stringify(value));
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    sessionStorage.setItem("fontSize", size);
    document.body.setAttribute('data-font-size', size);
  };

  const handleCompactModeToggle = (value) => {
    setCompactMode(value);
    sessionStorage.setItem("compactMode", JSON.stringify(value));
    document.body.classList.toggle('compact-mode', value);
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.body.classList.toggle('compact-mode', compactMode);
  }, [compactMode]);

  useEffect(() => {
    fetchCurrentUser();
    fetchMessages();


    socketRef.current = io('https://brochat2.onrender.com');


    socketRef.current.emit('authenticate', token);


    socketRef.current.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });


    socketRef.current.on('notification', (notification) => {
      if (notifications) {

        const isOwnMessage = notification.senderId === currentUserId;
        const enhancedNotification = {
          ...notification,
          isOwnMessage,
          message: isOwnMessage ? 'You sent a message' : notification.message
        };

        setNotificationQueue(prev => [...prev, enhancedNotification]);

        // Auto remove notification after 5 seconds
        setTimeout(() => {
          setNotificationQueue(prev => prev.filter(n => n !== enhancedNotification));
        }, 5000);
      }
    });    // Listen for online users updates
    socketRef.current.on('userCountUpdate', (data) => {
      setOnlineUsers(data.onlineUsers);
    });

    // Handle authentication errors
    socketRef.current.on('authError', (error) => {
      console.error('Socket auth error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, notifications, currentUserId]);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container">
      {showIntro && (
        <div className="intro-overlay">
          <img src="/animeGirl.gif" alt="Waving Anime" className="intro-gif" />
          <h2 className="intro-text">Welcome back, {user}! </h2>
        </div>
      )}


      <div className="notifications-container">
        {notificationQueue.map((notification, index) => (
          <div key={index} className={`notification-toast ${notification.isOwnMessage ? 'own-message' : ''}`}>
            <div className="notification-avatar">
              {notification.profilePicture ? (
                <img src={notification.profilePicture} alt={notification.user} />
              ) : (
                <div className="notification-avatar-placeholder">
                  {notification.user.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="notification-content">
              <div className="notification-message">{notification.message}</div>
              <div className="notification-time">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <button
              className="notification-close"
              onClick={() => setNotificationQueue(prev => prev.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <nav className="navbar">
        <div className="nav-left"><div className="logo">ChatRoom</div></div>
        <div className="nav-right">
          <button className="nav-button" onClick={() => navigate("/home")} title="Home"><Home size={20} /></button>
          <button className="nav-button" onClick={() => setShowProfile(!showProfile)} title="Profile"><User size={20} /></button>
          <button className="nav-button" onClick={() => setShowSettings(!showSettings)} title="Settings"><Settings size={20} /></button>
          <button
            className="nav-button logout-button"
            onClick={handleLogout}
            title="Logout"
            style={{ color: 'red' }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <div className="main-content">
        {showProfile && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="panel-title">Profile</h3>
              <button className="close-button" onClick={() => setShowProfile(false)}>×</button>
            </div>
            <div className="panel-content">
              <div className="form-group">
                <label className="label">Profile Picture</label>
                <div className="profile-picture-section">
                  <div className="current-profile-picture">
                    {currentUser?.profilePicture ? (
                      <img
                        src={currentUser.profilePicture}
                        alt="Profile"
                        className="profile-picture-display"
                      />
                    ) : (
                      <div className="profile-picture-placeholder">
                        {user.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="profile-picture-upload">
                    <input
                      type="file"
                      id="profilePictureInput"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleProfilePictureUpload(e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <button
                      className="upload-button"
                      onClick={() => document.getElementById('profilePictureInput').click()}
                    >
                      Change Picture
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Username</label>
                <div className="user-info">
                  <strong>{user}</strong>
                  <p style={{ margin: '8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Your username is set from your account registration
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="panel settings-panel">
            <div className="panel-header">
              <h3 className="panel-title">Settings</h3>
              <button className="close-button" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="panel-content">
              {/* Notifications */}
              <div className="setting-section">
                <h4 className="setting-section-title">Notifications</h4>
                <div className="setting-item">
                  <div className="setting-label"><Bell size={18} /><span>Show Notifications</span></div>
                  <label className="switch">
                    <input type="checkbox" checked={notifications} onChange={(e) => handleNotificationToggle(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-label">{soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}<span>Sound Effects</span></div>
                  <label className="switch">
                    <input type="checkbox" checked={soundEnabled} onChange={(e) => handleSoundToggle(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Appearance */}
              <div className="setting-section">
                <h4 className="setting-section-title">Appearance</h4>
                <div className="setting-item">
                  <div className="setting-label"><span>Theme</span></div>
                  <div className="theme-buttons">
                    <button className={`theme-button ${theme === 'light' ? 'active' : ''}`} onClick={() => handleThemeChange('light')}><Sun size={18} /></button>
                    <button className={`theme-button ${theme === 'dark' ? 'active' : ''}`} onClick={() => handleThemeChange('dark')}><Moon size={18} /></button>
                    <button className={`theme-button ${theme === 'auto' ? 'active' : ''}`} onClick={() => handleThemeChange('auto')}><Monitor size={18} /></button>
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-label"><Type size={18} /><span>Font Size</span></div>
                  <div className="font-size-buttons">
                    <button className={`font-button ${fontSize === 'small' ? 'active' : ''}`} onClick={() => handleFontSizeChange('small')}>A</button>
                    <button className={`font-button ${fontSize === 'medium' ? 'active' : ''}`} onClick={() => handleFontSizeChange('medium')}>A</button>
                    <button className={`font-button ${fontSize === 'large' ? 'active' : ''}`} onClick={() => handleFontSizeChange('large')}>A</button>
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-label"><Minimize2 size={18} /><span>Compact Mode</span></div>
                  <label className="switch">
                    <input type="checkbox" checked={compactMode} onChange={(e) => handleCompactModeToggle(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Chat Features */}
              <div className="setting-section">
                <h4 className="setting-section-title">Chat Features</h4>
                <div className="setting-item">
                  <div className="setting-label"><ArrowDown size={18} /><span>Auto Scroll</span></div>
                  <label className="switch">
                    <input type="checkbox" checked={autoScroll} onChange={(e) => handleAutoScrollToggle(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-label"><Smile size={18} /><span>Show Emotions</span></div>
                  <label className="switch">
                    <input type="checkbox" checked={showEmotions} onChange={(e) => handleEmotionsToggle(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="chat-container">
          <div className="messages-header">
            <h2 className="chat-title">Messages</h2>
            <div className="header-stats">
              <span className="online-count">👥 {onlineUsers.length} online</span>
              <span className="message-count">💬 {messages.length} messages</span>
            </div>
          </div>

          <ul className="messages-list">
            {messages.map((msg, i) => (
              <li key={msg._id || i} className={`message-item ${msg.user === user ? 'my-message' : 'other-message'}`}>
                <div className="msg-avatar">
                  {msg.userProfilePicture ? (
                    <img
                      src={msg.userProfilePicture}
                      alt={msg.user}
                      className="msg-avatar-image"
                    />
                  ) : (
                    <div className="msg-avatar-placeholder">
                      {msg.user.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="message-body">
                  <div className="message-header">
                    <strong className="message-name">{msg.user}</strong>
                    {msg.emotion && showEmotions && (
                      <span className="emotion-indicator" title={`${msg.emotion.sentiment} (${msg.emotion.score})`}>
                        {msg.emotion.emoji}
                      </span>
                    )}
                  </div>
                  <div className="message-content">
                    {msg.message && <span className="message-text">{msg.message}</span>}
                    {msg.fileUrl && (
                      msg.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img src={msg.fileUrl} alt="upload" className="message-image" />
                      ) : (
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="message-file">
                          📎 {msg.fileName || "File"}
                        </a>
                      )
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="input-container">
            {file && (
              <div className="file-preview">
                <span className="file-name">📎 {file.name}</span>
                <button
                  className="remove-file"
                  onClick={() => setFile(null)}
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            )}
            <div className="input-row">
              <label className="file-label">
                <Paperclip size={18} />
                <input type="file" className="file-input" onChange={(e) => setFile(e.target.files[0])} />
              </label>
              <input
                type="text"
                className="message-input"
                placeholder={file ? "Add a message (optional)..." : "Type a message..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="send-button" onClick={sendMessage} disabled={!message.trim() && !file}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 