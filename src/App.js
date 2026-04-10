import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Landing    from './pages/Landing';
import { Login }  from './pages/auth/UnifiedLogin';
import { Register } from './pages/auth/AuthPages';
import NotFound   from './pages/NotFound';

import { CustomerDashboard, AccountsPage } from './pages/customer/CustomerPages';
import { WithdrawPage, TransferPage } from './pages/customer/TransactionPages';
import TransactionHistoryPage from './pages/customer/TransactionHistory';
import ProfilePage from './pages/customer/ProfilePage';

import {
  AdminDashboard,
  OfficersPage,
} from './pages/admin/AdminPages';

import {
  ComplianceDashboard,
  ComplianceUsersPage,
  ComplianceAuditPage,
  ComplianceDepositPage,
} from './pages/compliance/CompliancePages';

function ProtectedRoute({ children, requiredRole }) {
  const { user, role } = useAuth();
  if (!user) return <NotFound />;
  if (requiredRole && role !== requiredRole) return <NotFound />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Old URLs → unified login */}
      <Route path="/compliance/register" element={<Navigate to="/" replace />} />
      <Route path="/admin/login"         element={<Navigate to="/login" replace />} />
      <Route path="/compliance/login"    element={<Navigate to="/login" replace />} />

      {/* ── Customer ── */}
      <Route path="/dashboard"    element={<ProtectedRoute requiredRole="CUSTOMER"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/accounts"     element={<ProtectedRoute requiredRole="CUSTOMER"><AccountsPage /></ProtectedRoute>} />
      <Route path="/withdraw"     element={<ProtectedRoute requiredRole="CUSTOMER"><WithdrawPage /></ProtectedRoute>} />
      <Route path="/transfer"     element={<ProtectedRoute requiredRole="CUSTOMER"><TransferPage /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute requiredRole="CUSTOMER"><TransactionHistoryPage /></ProtectedRoute>} />
      <Route path="/profile"      element={<ProtectedRoute requiredRole="CUSTOMER"><ProfilePage /></ProtectedRoute>} />

      {/* ── Admin — officers management only ── */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/officers"  element={<ProtectedRoute requiredRole="ADMIN"><OfficersPage /></ProtectedRoute>} />

      {/* ── Compliance ── */}
      <Route path="/compliance/dashboard" element={<ProtectedRoute requiredRole="COMPLIANCE"><ComplianceDashboard /></ProtectedRoute>} />
      <Route path="/compliance/users"     element={<ProtectedRoute requiredRole="COMPLIANCE"><ComplianceUsersPage /></ProtectedRoute>} />
      <Route path="/compliance/deposit"   element={<ProtectedRoute requiredRole="COMPLIANCE"><ComplianceDepositPage /></ProtectedRoute>} />
      <Route path="/compliance/audit"     element={<ProtectedRoute requiredRole="COMPLIANCE"><ComplianceAuditPage /></ProtectedRoute>} />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 12,
              padding: '14px 20px',
              minWidth: 320,
              maxWidth: 480,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            },
            success: {
              style: {
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
              },
              iconTheme: { primary: '#00b894', secondary: 'white' },
            },
            error: {
              style: {
                background: '#fff1f2',
                color: '#9f1239',
                border: '1px solid #fecdd3',
              },
              iconTheme: { primary: '#e85d75', secondary: 'white' },
              duration: 6000,
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
