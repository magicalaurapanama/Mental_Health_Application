import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * A component to protect routes that require authentication.
 * If the user is authenticated, it renders the child component.
 * Otherwise, it redirects to the login page.
 */
const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

export default ProtectedRoute;
