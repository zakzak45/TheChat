import { useState, useEffect } from "react";
import { MessageSquare, Users, Zap, Shield, LogIn, UserPlus, Moon, Sun, Monitor } from "lucide-react";
import './homepage.css';

const HomePage = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, []);

  const features = [
    {
      icon: <MessageSquare size={32} />,
      title: "Real-time Chat",
      description: "Instant messaging with automatic updates every 2 seconds"
    },
    {
      icon: <Users size={32} />,
      title: "Community",
      description: "Connect with people from around the world"
    },
    {
      icon: <Zap size={32} />,
      title: "Fast & Reliable",
      description: "Built with modern technology for optimal performance"
    },
    {
      icon: <Shield size={32} />,
      title: "Secure",
      description: "Your conversations are safe and protected"
    }
  ];

  return (
    <div className="homepage-container">
      {/* Navbar */}
      <nav className="homepage-navbar">
        <div className="nav-left">
          <div className="logo">💬 ChatRoom</div>
        </div>
        <div className="nav-right">
          <div className="theme-switcher">
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
              title="Light Mode"
            >
              <Sun size={18} />
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
              title="Dark Mode"
            >
              <Moon size={18} />
            </button>
            <button
              className={`theme-btn ${theme === 'auto' ? 'active' : ''}`}
              onClick={() => handleThemeChange('auto')}
              title="Auto"
            >
              <Monitor size={18} />
            </button>
          </div>
          <a href="/auth" className="nav-link">
            <LogIn size={18} />
            Login
          </a>
          <a href="/auth" className="nav-link signup-link">
            <UserPlus size={18} />
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Connect with Anyone, <br />
            <span className="gradient-text">Anywhere</span>
          </h1>
          <p className="hero-description">
            Join our vibrant community and start conversations that matter.
            Real-time messaging made simple and beautiful.
          </p>
          <div className="hero-buttons">
            <a href="/signup" className="btn btn-primary">
              Get Started
              <span className="btn-arrow">→</span>
            </a>
            <a href="/chat" className="btn btn-secondary">
              Try Demo
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="chat-bubble bubble-1">
            <div className="bubble-avatar">👋</div>
            <div className="bubble-content">
              <strong>Zayne</strong>
              <p>Sup!</p>
            </div>
          </div>
          <div className="chat-bubble bubble-2">
            <div className="bubble-avatar">🎉</div>
            <div className="bubble-content">
              <strong>Goat</strong>
              <p>This is cool!</p>
            </div>
          </div>
          <div className="chat-bubble bubble-3">
            <div className="bubble-avatar">✨</div>
            <div className="bubble-content">
              <strong>Mike</strong>
              <p>How you doing bro!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose ChatRoom?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Chatting?</h2>
          <p className="cta-description">
            Join thousands of users already having amazing conversations
          </p>
          <a href="/signup" className="btn btn-large">
            Create Your Account
            <span className="btn-arrow">→</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="logo">💬 ChatRoom</div>
            <p className="footer-text">Making conversations better, one message at a time.</p>
          </div>
          <div className="footer-section">
            <h4 className="footer-title">Product</h4>
            <a href="/features" className="footer-link">Features</a>
            <a href="/pricing" className="footer-link">Pricing</a>
            <a href="/about" className="footer-link">About</a>
          </div>
          <div className="footer-section">
            <h4 className="footer-title">Support</h4>
            <a href="/help" className="footer-link">Help Center</a>
            <a href="/contact" className="footer-link">Contact</a>
            <a href="/privacy" className="footer-link">Privacy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 ChatRoom. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;