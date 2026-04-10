import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// Logo
export function Logo({ size = 'md' }) {
  const sizes = { sm: { icon: 28, text: 16 }, md: { icon: 36, text: 20 }, lg: { icon: 48, text: 26 } };
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: s.icon, height: s.icon,
        background: 'linear-gradient(135deg, #00b894 0%, #2d8bff 100%)',
        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(26,107,204,0.35)',
      }}>
        <svg width={s.icon * 0.55} height={s.icon * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M2 9L12 3L22 9V21H2V9Z" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5"/>
          <rect x="9" y="13" width="6" height="8" rx="1" fill="white"/>
          <path d="M5 21V12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M19 21V12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: s.text, color: '#00b894', fontWeight: 400 }}>
        Aegis<span style={{ color: '#60a5fa' }}>Capital</span>
      </span>
    </div>
  );
}

//Public Navbar
export function PublicNavbar() {
  return (
    <nav style={{
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(26,107,204,0.1)',
      padding: '0 32px', height: 64, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <Logo />
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
        <Link to="/register" className="btn btn-primary btn-sm">Open Account</Link>
      </div>
    </nav>
  );
}

//Customer Sidebar
const customerNav = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/accounts', icon: '◈', label: 'Accounts' },
  { path: '/withdraw', icon: '↑', label: 'Withdraw' },
  { path: '/transfer', icon: '⇄', label: 'Transfer' },
  { path: '/transactions', icon: '≡', label: 'Transaction History' },
  { path: '/profile', icon: '◎', label: 'Profile' },
];

export function CustomerSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    logout(); navigate('/');
  };

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: 'var(--navy)',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0,
      zIndex: 50,
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Logo size="sm" />
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Customer</div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{user?.fullName || 'Customer'}</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: 'monospace' }}>{user?.customerId}</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {customerNav.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              borderRadius: 10, marginBottom: 2, textDecoration: 'none',
              color: active ? 'white' : 'rgba(255,255,255,0.5)',
              background: active ? 'rgba(45,139,255,0.2)' : 'transparent',
              borderLeft: active ? '3px solid #2d8bff' : '3px solid transparent',
              fontWeight: active ? 600 : 400, fontSize: 14,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none',
          background: 'rgba(232,93,117,0.15)', color: '#ff7090',
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>⎋</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

// Admin Sidebar
const adminNav = [
  { path: '/admin/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/admin/officers', icon: '◈', label: 'Compliance Officers' },


];

export function AdminSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside style={{
      width: 240, minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a1628 0%, #112240 100%)',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 50,
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Logo size="sm" />
        <div style={{ marginTop: 16 }}>
          <div style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>
            <span style={{ color: '#c9a84c', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>ADMINISTRATOR</span>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {adminNav.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              borderRadius: 10, marginBottom: 2, textDecoration: 'none',
              color: active ? '#c9a84c' : 'rgba(255,255,255,0.5)',
              background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
              borderLeft: active ? '3px solid #c9a84c' : '3px solid transparent',
              fontWeight: active ? 600 : 400, fontSize: 14, transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none',
          background: 'rgba(232,93,117,0.15)', color: '#ff7090',
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>⎋</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

//Compliance Sidebar
const complianceNav = [
  { path: '/compliance/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/compliance/users', icon: '◉', label: 'Users' },
  { path: '/compliance/deposit', icon: '↓', label: 'Deposit' },
  { path: '/compliance/audit', icon: '≡', label: 'Audit Viewer' },
];

export function ComplianceSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside style={{
      width: 240, minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f2744 0%, #0a1e35 100%)',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 50,
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Logo size="sm" />
        <div style={{ marginTop: 16 }}>
          <div style={{ background: 'rgba(0,184,148,0.15)', border: '1px solid rgba(0,184,148,0.35)', borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>
            <span style={{ color: '#00b894', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>COMPLIANCE</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>{user?.fullName}</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'monospace' }}>{user?.officerId}</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {complianceNav.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              borderRadius: 10, marginBottom: 2, textDecoration: 'none',
              color: active ? '#00d4a8' : 'rgba(255,255,255,0.5)',
              background: active ? 'rgba(0,184,148,0.12)' : 'transparent',
              borderLeft: active ? '3px solid #00d4a8' : '3px solid transparent',
              fontWeight: active ? 600 : 400, fontSize: 14, transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none',
          background: 'rgba(232,93,117,0.15)', color: '#ff7090',
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>⎋</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

// Dashboard Layout
export function DashboardLayout({ sidebar, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {sidebar}
      <main style={{ flex: 1, marginLeft: 240, background: 'var(--slate)', minHeight: '100vh' }}>
        <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

// Page Header
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
      <div>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Amount display
export function Amount({ value, size = 'md', positive, negative }) {
  const [visible, setVisible] = useState(false);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value || 0);

  const sizes = { sm: 14, md: 18, lg: 24, xl: 32 };

  const color = positive
    ? 'var(--mint)'
    : negative
    ? 'var(--rose)'
    : 'var(--text-primary)';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: sizes[size],
          color,
          fontWeight: 400,
          minWidth: 110,
        }}
      >
        {visible
          ? <>
              {positive && '+'}
              {negative && '-'}
              {formatted}
            </>
          : '₹•••••'}
      </span>

      {/* Eye icon */}
      <span
        onClick={() => setVisible(!visible)}
        style={{
          cursor: 'pointer',
          fontSize: 16,
          opacity: 0.7,
          userSelect: 'none',
        }}
        title={visible ? 'Hide balance' : 'Show balance'}
      >
        {visible ? 'hide' : 'show'}
      </span>
    </span>
  );
}


//Status Badge
export function StatusBadge({ status }) {
  const map = {
    ACTIVE: 'badge-success', APPROVED: 'badge-success',
    PENDING: 'badge-warning', PENDING_PIN: 'badge-warning',
    LOCKED: 'badge-danger', FROZEN: 'badge-info', SUSPENDED: 'badge-danger',
    REJECTED: 'badge-danger', CLOSED: 'badge-neutral',
    SUCCESS: 'badge-success', FAILED: 'badge-danger',
    CREDIT: 'badge-success', DEBIT: 'badge-danger',
    DISABLED: 'badge-neutral',
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
}

//Loading spinner page
export function LoadingPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
    </div>
  );
}
