import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import Home         from "./pages/Home";
import AdminLogin   from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Verifies session cookie on protected routes
function ProtectedRoute({ children }) {
  const { user, checked, check } = useAuthStore();
  const location = useLocation();

  useEffect(() => { if (!checked) check(); }, [checked]);

  if (!checked) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#060d06" }}>
      <div style={{ width:32, height:32, border:"2px solid rgba(92,155,92,0.2)", borderTopColor:"#5c9b5c", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  return user
    ? children
    : <Navigate to="/admin/login" state={{ from: location }} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/admin/login"    element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
