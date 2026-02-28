import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-xl font-bold text-blue-600">
            FreeLance<span className="text-gray-800">Hub</span>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <Link to="/jobs" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
                Jobs
              </Link>
              {user.role === "client" && (
                <Link to="/jobs/create" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
                  Post a Job
                </Link>
              )}
              {user.role === "freelancer" && (
                <Link to="/my-bids" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
                  My Bids
                </Link>
              )}
              <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
                Dashboard
              </Link>
              <div className="flex items-center gap-2 border-l pl-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
