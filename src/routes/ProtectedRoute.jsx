import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { hasAccess } from '../utils/accessControl';

const ProtectedRoute = ({ children, requireModule, requireRoles }) => {
  const { user, loading, refreshUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, [location.pathname, user]);

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.is_approved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (requireModule && !hasAccess(user, requireModule)) {
    return <Navigate to="/403" replace />;
  }

  if (requireRoles && !requireRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;
