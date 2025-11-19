import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Компонент для захисту маршрутів, що вимагають авторизації
 * @param {React.ReactNode} children - компонент для відображення
 * @returns {React.ReactNode} або Navigate до головної сторінки
 */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

