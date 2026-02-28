import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Spinner for loading state
const Spinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * ProtectedRoute — redirects to /login if no authenticated user.
 * Saves the current location so we can redirect back after login.
 */
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
};

/**
 * RoleRoute — allows only specific roles to access a route.
 * Redirects to dashboard on unauthorized role access.
 */
export const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
