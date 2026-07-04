import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import DashboardLayout from './components/DashboardLayout';
import AuthScreen from './screens/AuthScreen';
import DashboardHome from './screens/DashboardHome';
import InventoryScreen from './screens/InventoryScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailsScreen from './screens/OrderDetailsScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AdminCommunitiesLayout from './components/AdminCommunitiesLayout';
import CommunitiesScreen from './screens/CommunitiesScreen';
import CommunityDetailsScreen from './screens/CommunityDetailsScreen';
import AdminRevenueScreen from './screens/AdminRevenueScreen';
import AdminPayoutsScreen from './screens/AdminPayoutsScreen';
import AdminOrdersScreen from './screens/AdminOrdersScreen';
import AdminTransactionsScreen from './screens/AdminTransactionsScreen';
import AdminSettingsScreen from './screens/AdminSettingsScreen';
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
            path="/orders/:orderId" 
            element={
              <DashboardLayout onLogout={handleLogoutSuccess}>
                <OrderDetailsScreen />
              </DashboardLayout>
            } 
          />

          <Route 
            path="/transactions" 
            element={
              <DashboardLayout onLogout={handleLogoutSuccess}>
                <TransactionsScreen />
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

          {/* Admin Communities Routes */}
          <Route 
            path="/admin/communities" 
            element={
              <AdminCommunitiesLayout onLogout={handleLogoutSuccess}>
                <CommunitiesScreen />
              </AdminCommunitiesLayout>
            } 
          />
          <Route 
            path="/admin/communities/transactions" 
            element={
              <AdminCommunitiesLayout onLogout={handleLogoutSuccess}>
                <AdminTransactionsScreen />
              </AdminCommunitiesLayout>
            } 
          />
          <Route 
            path="/admin/communities/revenue" 
            element={
              <AdminCommunitiesLayout onLogout={handleLogoutSuccess}>
                <AdminRevenueScreen />
              </AdminCommunitiesLayout>
            } 
          />
          <Route 
            path="/admin/communities/payouts" 
            element={
              <AdminCommunitiesLayout onLogout={handleLogoutSuccess}>
                <AdminPayoutsScreen />
              </AdminCommunitiesLayout>
            } 
          />
          <Route 
            path="/admin/communities/orders" 
            element={
              <AdminCommunitiesLayout onLogout={handleLogoutSuccess}>
                <AdminOrdersScreen />
              </AdminCommunitiesLayout>
            } 
          />
          <Route 
            path="/admin/communities/settings" 
            element={
              <AdminCommunitiesLayout onLogout={handleLogoutSuccess}>
                <AdminSettingsScreen />
              </AdminCommunitiesLayout>
            } 
          />

          {/* Dynamic route must be AFTER specific nested routes */}
          <Route 
            path="/admin/communities/:communityId" 
            element={
              <AdminCommunitiesLayout onLogout={handleLogoutSuccess}>
                <CommunityDetailsScreen />
              </AdminCommunitiesLayout>
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
