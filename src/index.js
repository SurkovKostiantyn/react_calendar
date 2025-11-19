import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Cabinet from './pages/Cabinet';
import Achievements from './pages/Achievements';
import Cocktails from './pages/Cocktails';
import Alcomarkets from './pages/Alcomarkets';
import Games from './pages/Games';
import TestGame from './pages/games/TestGame';
import GameRoom from './pages/games/GameRoom';
import 'normalize.css';
import AppLayout from './components/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PageTitle from './components/PageTitle';
import { Navigate } from 'react-router-dom';

const AppRoutes = () => {
    const { user } = useAuth();

    return (
        <AppLayout>
            <PageTitle />
            <Routes>
                {/* Головна сторінка: якщо авторизований – Home, інакше Login */}
                <Route
                    path="/"
                    element={user ? <Home /> : <Login />}
                />
                {/* Захищені маршрути */}
                <Route
                    path="/cabinet"
                    element={
                        <ProtectedRoute>
                            <Cabinet />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/calendar"
                    element={
                        <ProtectedRoute>
                            <Calendar />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/achievements"
                    element={
                        <ProtectedRoute>
                            <Achievements />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cocktails"
                    element={
                        <ProtectedRoute>
                            <Cocktails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/alcomarkets"
                    element={
                        <ProtectedRoute>
                            <Alcomarkets />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/games"
                    element={
                        <ProtectedRoute>
                            <Games />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/games/testgame"
                    element={
                        <ProtectedRoute>
                            <TestGame />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/games/testgame/:roomId"
                    element={
                        <ProtectedRoute>
                            <GameRoom />
                        </ProtectedRoute>
                    }
                />
                {/* Будь-який інший шлях перенаправляє на головну сторінку */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </AppLayout>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
