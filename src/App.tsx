import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Predictions from './pages/Predictions';
import Suppliers from './pages/Suppliers';
import Warehouse from './pages/Warehouse';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';
import Orders from './pages/Orders';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="orders" element={<Orders />} />
              <Route path="predictions" element={<Predictions />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="warehouse" element={<Warehouse />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
        <Chatbot />
      </BrowserRouter>
    </AuthProvider>
  );
}
