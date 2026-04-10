import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI, adminAPI, complianceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/shared.jsx';
import toast from 'react-hot-toast';

export function Login() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { loginUser } = useAuth();

  const [step, setStep]         = useState('login');
  const [form, setForm]         = useState({
    id:       location.state?.id       || '',
    password: location.state?.password || '',
  });
  const [otpForm, setOtpForm]   = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [setupData, setSetupData] = useState(null); //
  const [loading, setLoading]   = useState(false);

  // Detect role from ID prefix
  const detectRole = (id) => {
    if (!id) return null;
    if (id.toUpperCase().startsWith('ADMIN')) return 'ADMIN';
    if (id.toUpperCase().startsWith('CO'))    return 'COMPLIANCE';
    return 'CUSTOMER';
  };

  const detectedRole = detectRole(form.id);

  const roleStyle = {
    ADMIN:      { label: 'Administrator',      color: '#c9a84c', bg: 'rgba(201,168,76,0.1)',  border: 'rgba(201,168,76,0.25)'  },
    COMPLIANCE: { label: 'Compliance Officer', color: '#00b894', bg: 'rgba(0,184,148,0.1)',   border: 'rgba(0,184,148,0.25)'   },
    CUSTOMER:   { label: 'Customer',           color: '#2d8bff', bg: 'rgba(45,139,255,0.1)',  border: 'rgba(45,139,255,0.25)'  },
  };

  // Core login logic
  const doLogin = async (id, password) => {
    const role = detectRole(id);
    setLoading(true);
    try {
      if (role === 'ADMIN') {
        const r = await adminAPI.login({ adminId: id, password });
        const d = r.data.data;
        loginUser({ fullName: d.fullName, officerId: d.officerId }, 'ADMIN', d.accessToken);
        toast.success(`Welcome, ${d.fullName}!`);
        navigate('/admin/dashboard');

      } else if (role === 'COMPLIANCE') {
        try {
          const r = await complianceAPI.login({ officerId: id, password });
          const d = r.data.data;
          loginUser({ fullName: d.fullName, email: d.email, officerId: d.officerId }, 'COMPLIANCE', d.accessToken);
          toast.success(`Welcome, ${d.fullName}!`);
          navigate('/compliance/dashboard');
        } catch (err) {
          const msg = err.response?.data?.message || '';
          // Backend signals: officer must complete first login via OTP
          if (msg.includes('FIRST_LOGIN_REQUIRED')) {
            setForm(f => ({ ...f, id }));
            setStep('otp');
            toast('Check your email for your one-time login OTP', { duration: 5000 });
          } else {
            toast.error(msg || 'Login failed. Please check your credentials.');
          }
        }
      } else {
        // CUSTOMER
        const r = await authAPI.login({ customerId: id, password });
        const d = r.data.data;
        loginUser({ customerId: d.customerId, fullName: d.fullName, accounts: d.accounts }, 'CUSTOMER', d.accessToken);
        toast.success(`Welcome back, ${d.fullName}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  // Auto-login if Landing passed credentials via state
  useEffect(() => {
    if (location.state?.id && location.state?.password) {
      doLogin(location.state.id, location.state.password);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!form.id.trim() || !form.password) return toast.error('Please enter your ID and password');
    doLogin(form.id.trim(), form.password);
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpForm.otp || otpForm.otp.length !== 6) return toast.error('Please enter the 6-digit OTP from your email');
    setLoading(true);
    try {
      await complianceAPI.verifyFirstLoginOtp({ officerId: form.id, otp: otpForm.otp });
      setSetupData({ officerId: form.id, otp: otpForm.otp });
      setStep('set-password');
      toast.success('OTP verified! Now set your permanent password.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect OTP. Please check your email and try again.');
    } finally { setLoading(false); }
  };

  //Set permanent password
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (otpForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    if (otpForm.newPassword !== otpForm.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const r = await complianceAPI.setFirstPassword({
        officerId:       setupData.officerId,
        otp:             setupData.otp,
        newPassword:     otpForm.newPassword,
        confirmPassword: otpForm.confirmPassword,
      });
      const d = r.data.data;
      loginUser({ fullName: d.fullName, email: d.email, officerId: d.officerId }, 'COMPLIANCE', d.accessToken);
      toast.success(`Password set! Welcome, ${d.fullName}!`, { duration: 5000 });
      navigate('/compliance/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password. Please try again.');
    } finally { setLoading(false); }
  };

  //Shared input style
  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, color: 'white', fontSize: 14,
    fontFamily: 'DM Sans, sans-serif', outline: 'none',
  };
  const labelStyle = {
    display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: 12,
    fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  const stepTitles = {
    'login':        { title: 'Welcome back', sub: 'Sign in to your AegisCapital account' },
    'otp':          { title: 'Verify your identity', sub: `Enter the OTP sent to your email for ${form.id}` },
    'set-password': { title: 'Set your password', sub: 'Choose a strong permanent password for your account' },
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #0e2040 50%, #0a2618 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 430, position: 'relative' }}>
        {/* Logo + heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/"><Logo /></Link>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 30, color: 'white', margin: '20px 0 6px' }}>
            {stepTitles[step].title}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.5 }}>
            {stepTitles[step].sub}
          </p>

          {/* Step indicator for compliance OTP flow */}
          {(step === 'otp' || step === 'set-password') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              {[
                { key: 'otp',          label: 'Enter OTP' },
                { key: 'set-password', label: 'Set Password' },
              ].map((s, i) => {
                const done  = (step === 'set-password' && s.key === 'otp');
                const active = step === s.key;
                return (
                  <React.Fragment key={s.key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                        background: done ? '#00b894' : active ? '#2d8bff' : 'rgba(255,255,255,0.15)',
                        color: 'white',
                      }}>{done ? '✓' : i + 1}</div>
                      <span style={{ color: active ? 'white' : 'rgba(255,255,255,0.4)', fontSize: 13 }}>{s.label}</span>
                    </div>
                    {i < 1 && <div style={{ width: 32, height: 1.5, background: done ? '#00b894' : 'rgba(255,255,255,0.15)' }} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, padding: 36,
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}>

          {/* ── STEP: Normal login ── */}
          {step === 'login' && (
            <form onSubmit={handleLogin}>
              {detectedRole && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
                  background: roleStyle[detectedRole].bg,
                  border: `1px solid ${roleStyle[detectedRole].border}`,
                  borderRadius: 8, padding: '8px 14px',
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: roleStyle[detectedRole].color, flexShrink: 0,
                  }} />
                  <span style={{ color: roleStyle[detectedRole].color, fontSize: 13, fontWeight: 600 }}>
                    Signing in as {roleStyle[detectedRole].label}
                  </span>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Your ID</label>
                <input style={inputStyle}
                  placeholder="Enter Your ID"
                  value={form.id} autoFocus
                  onChange={e => setForm({ ...form, id: e.target.value })} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5, display: 'block' }}>

                </span>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Password</label>
                <input style={inputStyle} type="password" placeholder="Enter Your Password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: detectedRole
                  ? `linear-gradient(135deg, ${roleStyle[detectedRole].color}, ${roleStyle[detectedRole].color}bb)`
                  : 'rgba(255,255,255,0.15)',
                color: 'white', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
              }}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>
          )}

          {/* compliance first login */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <div style={{
                textAlign: 'center',
                background: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)',
                borderRadius: 12, padding: '16px', marginBottom: 24,
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✉</div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  Your Officer ID is <strong style={{ color: '#00b894' }}>{form.id}</strong>.<br />
                  Check your email for the <strong>Password</strong> sent when your account was created.
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>One-Time Password (OTP)</label>
                <input
                  style={{ ...inputStyle, textAlign: 'center', fontSize: 28, letterSpacing: 18, fontFamily: 'monospace', padding: '16px' }}
                  placeholder="------" maxLength={6} autoFocus
                  value={otpForm.otp}
                  onChange={e => setOtpForm({ ...otpForm, otp: e.target.value.replace(/\D/g, '') })} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6, display: 'block', textAlign: 'center' }}>
                  OTP expires in 10 minutes
                </span>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #00b894, #00d4a8)',
                color: 'white', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </button>
              <button type="button" onClick={() => setStep('login')} style={{
                width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                cursor: 'pointer', background: 'transparent',
                color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif',
                fontSize: 14, marginTop: 8,
              }}>
                ← Back to login
              </button>
            </form>
          )}

          {/* ── STEP: Set permanent password ── */}
          {step === 'set-password' && (
            <form onSubmit={handleSetPassword}>
              <div style={{
                background: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 20,
              }}>
                <p style={{ color: '#00b894', fontSize: 13, fontWeight: 600, margin: 0 }}>
                  ✓ OTP verified for {setupData?.officerId} — set your permanent password below
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>New Password</label>
                <input style={inputStyle} type="password" placeholder="Minimum 8 characters" autoFocus
                  value={otpForm.newPassword}
                  onChange={e => setOtpForm({ ...otpForm, newPassword: e.target.value })} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Confirm Password</label>
                <input style={inputStyle} type="password" placeholder="Repeat your password"
                  value={otpForm.confirmPassword}
                  onChange={e => setOtpForm({ ...otpForm, confirmPassword: e.target.value })} />
                {otpForm.confirmPassword && otpForm.newPassword !== otpForm.confirmPassword && (
                  <span style={{ color: '#e85d75', fontSize: 12, marginTop: 6, display: 'block' }}>
                    Passwords do not match
                  </span>
                )}
              </div>

              <button type="submit" disabled={loading || (otpForm.confirmPassword && otpForm.newPassword !== otpForm.confirmPassword)} style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #00b894, #00d4a8)',
                color: 'white', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Setting password...' : 'Set Password & Sign In →'}
              </button>
            </form>
          )}
        </div>

        {/* Footer link */}
        {step === 'login' && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/register" style={{ color: 'rgba(45,139,255,0.8)', fontSize: 14, textDecoration: 'none' }}>
              Don't have an account? <strong>Open one free</strong>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
