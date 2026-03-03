import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout    from "./components/layout/Layout";
import Login     from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users     from "./pages/Users";
import Jobs      from "./pages/Jobs";
import Payments  from "./pages/Payments";
import Reviews   from "./pages/Reviews";
import Analytics from "./pages/Analytics";
import "./index.css";

const Protected = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  return admin ? children : <Navigate to="/login" replace />;
};

const Public = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  return admin ? <Navigate to="/" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Public><Login /></Public>} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="users"     element={<Users />} />
        <Route path="jobs"      element={<Jobs />} />
        <Route path="payments"  element={<Payments />} />
        <Route path="reviews"   element={<Reviews />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
