import { Routes, Route, Navigate } from "react-router-dom";
import Chat from "./chat.jsx";
import AuthPage from "./pages/LoginSignuPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import { useAuth } from "./useAuth.jsx";

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
           Loading ChatRoom...
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
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
