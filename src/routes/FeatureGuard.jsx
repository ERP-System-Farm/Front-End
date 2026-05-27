import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatures } from '@/contexts/FeatureToggleContext';

export default function FeatureGuard({ featureKey, children }) {
  const { config } = useFeatures();
  
  if (!config || !config.features || !config.features[featureKey]) {
    // If feature is disabled, redirect to dashboard silently without breaking
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}
