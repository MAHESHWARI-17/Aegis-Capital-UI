import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, adminAPI, complianceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/shared.jsx';
import toast from 'react-hot-toast';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fc', fontFamily: 'DM Sans, sans-serif' }}>

      {/*Sticky Navbar*/}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 68,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px',
        transition: 'all 0.3s ease',
      }}>
        <Logo />
      </nav>

      {/*Hero*/}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #0e2040 40%, #0d2d3a 70%, #0a2618 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '100px 48px 80px',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div style={{ position: 'absolute', top: '15%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,139,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,184,148,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          {/* Left */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,184,148,0.12)', border: '1px solid rgba(0,184,148,0.25)',
              borderRadius: 100, padding: '5px 16px', marginBottom: 32,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00b894', display: 'inline-block' }} />
              <span style={{ color: '#00d4a8', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>Banking that moves at your speed.</span>
            </div>
            <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 62, lineHeight: 1.08, color: 'white', margin: '0 0 24px' }}>
              Smart banking<br />
              <span style={{ background: 'linear-gradient(90deg, #2d8bff, #00b894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                for everyone
              </span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, lineHeight: 1.75, marginBottom: 40, maxWidth: 480 }}>
              Open a savings or current account in minutes. Secure transfers, real-time balance updates, and complete transaction history — all in one place.
            </p>
          </div>

          {/* Right — login card */}
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24, padding: 36,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
            }}>
              <QuickLoginForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '96px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ color: '#1a6bcc', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Why AegisCapital</p>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 44, color: '#0a1628', margin: 0 }}>Everything you need to<br />manage your money</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { icon: '⟳', color: '#1a6bcc', bg: 'rgba(26,107,204,0.08)', title: 'Instant Transfers', desc: 'Send money to any account in seconds. Real-time balance updates with complete transaction records.' },
            { icon: '◈', color: '#00b894', bg: 'rgba(0,184,148,0.08)', title: 'PIN-Secured', desc: 'Every withdrawal and transfer requires your 4-digit PIN for maximum security.' },
            { icon: '≡', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', title: 'Transaction History', desc: 'View complete transaction history. Download bank statements as PDF anytime.' },
            { icon: '◉', color: '#c9a84c', bg: 'rgba(201,168,76,0.08)', title: 'Compliance Ready', desc: 'Built-in compliance monitoring with account freeze and investigation capabilities.' },
            { icon: '↗', color: '#e85d75', bg: 'rgba(232,93,117,0.08)', title: 'Savings Interest', desc: '1% monthly interest automatically credited to your savings account.' },
            { icon: '⊡', color: '#059669', bg: 'rgba(5,150,105,0.08)', title: 'Multi-Account', desc: 'Open both savings and current accounts. Manage them all from one dashboard.' },
          ].map(f => (
            <div key={f.title} style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: f.color, marginBottom: 20 }}>{f.icon}</div>
              <h4 style={{ fontWeight: 700, fontSize: 17, color: '#0a1628', margin: '0 0 10px' }}>{f.title}</h4>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/*Accounts*/}
      <section style={{ background: '#0a1628', padding: '96px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 44, color: 'white', margin: '0 0 16px' }}>You can choose your account type</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>Both accounts come with full access to all features</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800, margin: '0 auto' }}>
            {[
              { type: 'Savings Account', prefix: 'SB', color: '#2d8bff', border: 'rgba(45,139,255,0.3)', features: ['1% monthly interest', '16 transactions/day', 'Free deposits', 'PIN security', 'Transaction history'] },
              { type: 'Current Account', prefix: 'CA', color: '#00b894', border: 'rgba(0,184,148,0.3)', features: ['Unlimited transactions', 'Business-friendly', 'Free deposits', 'PIN security', 'Transaction history'] },
            ].map(a => (
              <div key={a.type} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${a.border}`, borderRadius: 20, padding: 36 }}>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ background: `${a.color}22`, border: `1px solid ${a.color}44`, borderRadius: 6, padding: '4px 12px', color: a.color, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{a.prefix}XXXXXXXXXX</span>
                </div>
                <h3 style={{ fontFamily: 'DM Serif Display, serif', color: 'white', fontSize: 26, margin: '0 0 20px' }}>{a.type}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {a.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                      <span style={{ color: a.color, fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#060e1c', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Logo size="sm" />
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: 0 }}>© 2026 AegisCapital. All rights reserved.</p>

      </footer>
    </div>
  );
}

function QuickLoginForm() {
  const [step, setStep]           = useState('login');
  const [form, setForm]           = useState({ id: '', password: '' });
  const [pwdForm, setPwdForm]     = useState({ newPassword: '', confirmPassword: '' });
  const [officerData, setOfficerData] = useState(null); //
  const [loading, setLoading]     = useState(false);
  const navigate                  = useNavigate();
  const { loginUser }             = useAuth();

  const detectRole = (id) => {
    if (!id) return null;
    if (id.toUpperCase().startsWith('ADMIN')) return 'ADMIN';
    if (id.toUpperCase().startsWith('CO'))    return 'COMPLIANCE';
    return 'CUSTOMER';
  };

  const roleInfo = {
    ADMIN:      { label: 'Administrator',      color: '#c9a84c' },
    COMPLIANCE: { label: 'Compliance Officer', color: '#00b894' },
    CUSTOMER:   { label: 'Customer',           color: '#2d8bff' },
  };

  const role = detectRole(form.id);

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: 'white', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
  };
  const labelStyle = {
    display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12,
    fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase',
  };

  // ── Step 1: Login ─────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.id || !form.password) return toast.error('Please enter your ID and Password');
    const detectedRole = detectRole(form.id);
    setLoading(true);
    try {
      if (detectedRole === 'ADMIN') {
        const r = await adminAPI.login({ adminId: form.id, password: form.password });
        const d = r.data.data;
        loginUser({ fullName: d.fullName, officerId: d.officerId }, 'ADMIN', d.accessToken);
        toast.success('Welcome, Administrator!');
        navigate('/admin/dashboard');

      } else if (detectedRole === 'COMPLIANCE') {
        const r = await complianceAPI.login({ officerId: form.id, password: form.password });
        const d = r.data.data;

        if (d.role === 'COMPLIANCE_SETUP') {

          setOfficerData({ officerId: d.officerId, fullName: d.fullName, email: d.email, accessToken: d.accessToken });
          setStep('set-password');
          toast('Please set your permanent password to continue.');
        } else {

          loginUser({ fullName: d.fullName, email: d.email, officerId: d.officerId }, 'COMPLIANCE', d.accessToken);
          toast.success(`Welcome, ${d.fullName}!`);
          navigate('/compliance/dashboard');
        }

      } else {
        const r = await authAPI.login({ customerId: form.id, password: form.password });
        const d = r.data.data;
        loginUser({ customerId: d.customerId, fullName: d.fullName, accounts: d.accounts }, 'CUSTOMER', d.accessToken);
        toast.success(`Welcome back, ${d.fullName}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };


  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword)
      return toast.error('Passwords do not match');
    if (pwdForm.newPassword.length < 8)
      return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const r = await complianceAPI.setFirstPassword({
        officerId: officerData.officerId,
        newPassword: pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword,
      });
      const d = r.data.data;
      loginUser({ fullName: d.fullName, email: d.email, officerId: d.officerId }, 'COMPLIANCE', d.accessToken);
      toast.success(`Password set! Welcome, ${d.fullName}!`);
      navigate('/compliance/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password. Please try again.');
    } finally { setLoading(false); }
  };

  //normal login
  if (step === 'login') return (
    <form onSubmit={handleLogin}>
      <h3 style={{ fontFamily: 'DM Serif Display, serif', color: 'white', fontSize: 24, margin: '0 0 8px' }}>Sign in to your account</h3>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px' }}>Enter your ID to access your portal</p>

      {role && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          background: `${roleInfo[role].color}15`, border: `1px solid ${roleInfo[role].color}30`,
          borderRadius: 8, padding: '7px 12px',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: roleInfo[role].color, display: 'inline-block' }} />
          <span style={{ color: roleInfo[role].color, fontSize: 12, fontWeight: 600 }}>
            Signing in as {roleInfo[role].label}
          </span>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Your ID</label>
        <input style={inputStyle}
          placeholder="Enter Your ID"
          value={form.id}
          onChange={e => setForm({ ...form, id: e.target.value })} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Password</label>
        <input style={inputStyle} type="password" placeholder="Enter Your Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} />
      </div>
      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: role
          ? `linear-gradient(135deg, ${roleInfo[role].color}, ${roleInfo[role].color}bb)`
          : 'rgba(255,255,255,0.15)',
        color: 'white', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
        transition: 'all 0.2s',
      }}>
        {loading ? '...' : 'Sign In →'}
      </button>
      <p style={{ textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        New customer?{' '}
        <Link to="/register" style={{ color: '#2d8bff', fontWeight: 600, textDecoration: 'none' }}>Open an account</Link>
      </p>
    </form>
  );

  //set permanent password
  return (
    <form onSubmit={handleSetPassword}>
      <h3 style={{ fontFamily: 'DM Serif Display, serif', color: 'white', fontSize: 22, margin: '0 0 8px' }}>Set your password</h3>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 20px' }}>
        Welcome, <strong style={{ color: 'white' }}>{officerData?.fullName}</strong>. Create a permanent password to access your account.
      </p>

      <div style={{
        background: 'rgba(0,184,148,0.1)', border: '1px solid rgba(0,184,148,0.25)',
        borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13,
        color: '#00d4a8',
      }}>
        Your Officer ID: <strong style={{ fontFamily: 'monospace', fontSize: 15 }}>{officerData?.officerId}</strong>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>New Password</label>
        <input style={inputStyle} type="password" placeholder="Minimum 8 characters" autoFocus
          value={pwdForm.newPassword}
          onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Confirm Password</label>
        <input style={inputStyle} type="password" placeholder="Repeat your password"
          value={pwdForm.confirmPassword}
          onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} />
      </div>

      {pwdForm.newPassword && pwdForm.confirmPassword && (
        <div style={{
          marginBottom: 16, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: pwdForm.newPassword === pwdForm.confirmPassword
            ? 'rgba(0,184,148,0.1)' : 'rgba(232,93,117,0.1)',
          color: pwdForm.newPassword === pwdForm.confirmPassword ? '#00b894' : '#e85d75',
        }}>
          {pwdForm.newPassword === pwdForm.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
        </div>
      )}

      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #00b894, #00d4a8)',
        color: 'white', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
      }}>
        {loading ? '...' : 'Set Password & Go to Dashboard →'}
      </button>
    </form>
  );
}
