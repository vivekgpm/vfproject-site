import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdminRoute = false }) => { // Added isAdminRoute
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
    // Redirect to login, and include the current path in the state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdminRoute && (!user.role || user.role !== 'admin')) { // Check for admin role
    return <div>Unauthorized. You do not have permission to access this page.</div>; // Or redirect
  }

  return children;
};

export default ProtectedRoute;