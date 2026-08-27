import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './pages/Layout';
import OverviewPage from './pages/OverviewPage';
import WorkersPage from './pages/WorkersPage';
import DisputesPage from './pages/DisputesPage';
import ForecastPage from './pages/ForecastPage';
import SetupPage from './pages/SetupPage';
import './styles.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="disputes" element={<DisputesPage />} />
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="setup" element={<SetupPage />} />
      </Route>
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
