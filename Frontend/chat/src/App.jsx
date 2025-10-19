import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from 'react';
import Chat from "./chat.jsx";
import AuthPage from "./LoginSignuPage.jsx";
import HomePage from "./HomePage.jsx";
import { useAuth } from "./useAuth.jsx";
import { urlBase64ToUint8Array } from './utils/pushUtils';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Register service worker and subscribe to push notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const registerAndSubscribe = async () => {
      // Check if browser supports service workers and push
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return;
      }

      try {
        // Register service worker
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered');

        // Get VAPID public key from server
        const resp = await fetch('https://brochat2.onrender.com/vapidPublicKey');
        if (!resp.ok) {
          console.error('Failed to fetch VAPID public key');
          return;
        }
        const { publicKey } = await resp.json();

        // Check if already subscribed
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          // Subscribe to push notifications
          const convertedKey = urlBase64ToUint8Array(publicKey);
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
          });
          console.log('Subscribed to push notifications');
        }

        // Send subscription to server
        await fetch('https://brochat2.onrender.com/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({ subscription: sub })
        });
        console.log('Subscription sent to server');

      } catch (err) {
        console.error('Service worker registration or subscription failed:', err);
      }
    };

    registerAndSubscribe();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', color: '#fff', fontSize: '20px' }}>
            Loading ChatRoom...
          </div>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTop: '4px solid #7c4dff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={isAuthenticated ? <Navigate to="/chat" /> : <AuthPage />}
      />

      <Route
        path="/chat"
        element={isAuthenticated ? <Chat /> : <Navigate to="/auth" />}
      />

      <Route path="/home" element={<HomePage />} />

      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="*"
        element={<Navigate to="/" />}
      />
    </Routes>
  );
}

export default App;
