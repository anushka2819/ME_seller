import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import DashboardLayout from './components/DashboardLayout';
import AuthScreen from './screens/AuthScreen';
import DashboardHome from './screens/DashboardHome';
import InventoryScreen from './screens/InventoryScreen';
import OrdersScreen from './screens/OrdersScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { getSellerSession } from './utils/auth';
import { supabase } from './utils/supabaseClient';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSellerSession();
        setIsLoggedIn(!!session);
      } catch (err) {
        console.error("Session check failed", err);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
    
    // Listen to changes in auth state (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

    const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogoutSuccess = () => {
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Auth Route */}
          <Route 
            path="/auth" 
            element={isLoggedIn ? <Navigate to="/" replace /> : <AuthScreen onLogin={handleLoginSuccess} />} 
          />

          {/* Secure Dashboard Routes */}
          <Route 
            path="/" 
            element={
              <DashboardLayout onLogout={handleLogoutSuccess}>
                <DashboardHome />
              </DashboardLayout>
            } 
          />
          
          <Route 
            path="/products" 
            element={
              <DashboardLayout onLogout={handleLogoutSuccess}>
                <InventoryScreen />
              </DashboardLayout>
            } 
          />
          
          <Route 
            path="/orders" 
            element={
              <DashboardLayout onLogout={handleLogoutSuccess}>
                <OrdersScreen />
              </DashboardLayout>
            } 
          />
          
          <Route 
            path="/analytics" 
            element={
              <DashboardLayout onLogout={handleLogoutSuccess}>
                <AnalyticsScreen />
              </DashboardLayout>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <DashboardLayout onLogout={handleLogoutSuccess}>
                <SettingsScreen />
              </DashboardLayout>
            } 
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
