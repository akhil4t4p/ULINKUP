import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

// Page Imports
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AccountSelection from './pages/AccountSelection';
import CustomerDashboard from './pages/CustomerDashboard';
import BusinessDashboard from './pages/BusinessDashboard';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';

export default function App() {
  return (
    <Router>
      <div id="root">
        <Navbar />
        <main className="main-content container-fluid px-4 pb-5">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/select-account" element={<AccountSelection />} />
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/business/dashboard" element={<BusinessDashboard />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/subscriptions" element={<SubscriptionPage />} />
          </Routes>
        </main>
        
        <footer className="py-4 text-center mt-auto text-muted">
          <p className="mb-0">© 2026 ULINKUP. Hyperlocal Network Platform. Powered by Antigravity.</p>
        </footer>
      </div>
    </Router>
  );
}
