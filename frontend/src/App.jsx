import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Page Imports (Lazy Loaded)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const AccountSelection = lazy(() => import('./pages/AccountSelection'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const BusinessDashboard = lazy(() => import('./pages/BusinessDashboard'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const PublicFeed = lazy(() => import('./pages/PublicFeed'));
const ProfileOptimization = lazy(() => import('./pages/ProfileOptimization'));

// Admin Imports (Lazy Loaded)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBusinesses = lazy(() => import('./pages/admin/AdminBusinesses'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const AdminDatabase = lazy(() => import('./pages/admin/AdminDatabase'));
const AdminAPIKeys = lazy(() => import('./pages/admin/AdminAPIKeys'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminCMS = lazy(() => import('./pages/admin/AdminCMS'));

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`app-wrapper d-flex ${isAdminRoute ? '' : 'flex-column flex-lg-row'}`}>
      {!isAdminRoute && <Navbar />}
      <main className={`main-content ${isAdminRoute ? '' : 'flex-grow-1 container-fluid px-4 pb-5 pb-lg-0'}`} style={{ height: '100vh', overflowY: 'auto' }}>
        <Suspense fallback={<div className="d-flex justify-content-center align-items-center h-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/select-account" element={<AccountSelection />} />
            
            <Route path="/optimize-profile" element={<ProtectedRoute><ProfileOptimization /></ProtectedRoute>} />
            
            {/* Protected Routes */}
            <Route 
              path="/customer/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/business/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['BUSINESS']}>
                  <BusinessDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/subscriptions" element={
              <ProtectedRoute allowedRoles={['BUSINESS']}>
                <SubscriptionPage />
              </ProtectedRoute>
            } />
            
            {/* Shared Protected Routes */}
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/public" element={<ProtectedRoute><PublicFeed /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="businesses" element={<AdminBusinesses />} />
              <Route path="database" element={<AdminDatabase />} />
              <Route path="api-keys" element={<AdminAPIKeys />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="cms" element={<AdminCMS />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="logs" element={<AdminLogs />} />
            </Route>
          </Routes>
        </Suspense>
        
        {/* Global Footer */}
        <footer className={`mt-auto py-3 bg-light text-center text-muted small ${isAdminRoute ? 'd-none' : ''}`}>
          <div className="container">
            <p className="mb-0">© 2026 ULINKUP Hyperlocal Network Platform by S.AKHIL</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
