import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/shared/Dashboard";
import JobsPage from "./pages/shared/JobsPage";
import JobDetail from "./pages/shared/JobDetail";
import ProfilePage from "./pages/shared/ProfilePage";
import CreateJob from "./pages/client/CreateJob";
import MyBids from "./pages/freelancer/MyBids";
import "./index.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user || user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/create" element={<RoleRoute role="client"><CreateJob /></RoleRoute>} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="my-bids" element={<RoleRoute role="freelancer"><MyBids /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
