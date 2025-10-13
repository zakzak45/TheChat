import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth.jsx";
import "./LoginSignup.css";   

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isLogin
      ? "https://brochat2.onrender.com/login"
      : "https://brochat2.onrender.com/signup";

    const payload = isLogin
      ? { email, password }
      : { username, email, password };

    try {
      console.log('Sending request to:', url);
      console.log('With payload:', payload);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Response:', data);

      if (data.token) {
        console.log('Authentication successful');
        // Use the new login method from useAuth
        login(data.token, data.user);
        sessionStorage.setItem("chatUser", data.user.username || email);
        console.log('Navigating to chat');
        navigate("/chat", { replace: true });
      } else {
        console.error('Authentication failed:', data.message);
        alert(data.message || "Authentication failed");
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? "Login" : "Signup"}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">
            {isLogin ? "Login" : "Signup"}
          </button>
        </form>

        <p className="switch-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="switch-btn"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Signup here" : "Login here"}
          </button>
        </p>
      </div>
    </div>
  );
}