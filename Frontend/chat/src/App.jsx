import { Routes, Route, Navigate } from "react-router-dom";
import Chat from "./chat.jsx";
import AuthPage from "./LoginSignuPage.jsx";

function App() {
  // check if user is logged in (using token in localStorage)
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Routes>
      {/* Auth Page */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected Chat Page */}
      <Route
        path="/chat"
        element={isAuthenticated ? <Chat/> : <Navigate to="/auth" />}
      />

      {/* Default → redirect to auth */}
      <Route path="*" element={<Navigate to="/auth" />} />
    </Routes>
  );
}

export default App;
