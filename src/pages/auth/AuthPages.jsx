import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Logo } from '../../components/shared.jsx';
import toast from 'react-hot-toast';

export function Register() {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({
    fullName: '', dob: '', aadhaarNumber: '', panNumber: '',
    email: '', phoneNumber: '', address: '', password: '', accountType: 'SAVINGS',
  });
  const [otp, setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.registerInit(form);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.registerVerifyOtp({ email: form.email, otp });
      toast.success(`Account created! Your Customer ID: ${res.data.data.customerId}`);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally { setLoading(false); }
  };

  const up = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '11px 14px',
    background: '#f7f8fc', border: '1.5px solid #e5e7eb',
    borderRadius: 10, color: '#1a2540', fontSize: 14,
    fontFamily: 'DM Sans, sans-serif', outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 280, background: 'linear-gradient(135deg, #0a1628 0%, #0e2040 100%)', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: 640, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/"><Logo /></Link>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 30, color: 'white', margin: '20px 0 6px' }}>
            {step === 1 ? 'Open your account' : 'Verify your email'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
            {step === 1 ? 'Join AegisCapital' : `OTP sent to ${form.email}`}
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            {['Your Details', 'Verify Email'].map((label, i) => (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: step > i + 1 ? '#00b894' : step === i + 1 ? '#2d8bff' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                  }}>{step > i + 1 ? '✓' : i + 1}</div>
                  <span style={{ color: step === i + 1 ? 'white' : 'rgba(255,255,255,0.4)', fontSize: 13 }}>{label}</span>
                </div>
                {i < 1 && <div style={{ width: 40, height: 1.5, background: step > 1 ? '#00b894' : 'rgba(255,255,255,0.15)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '36px 40px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
        }}>
          {step === 1 ? (
            <form onSubmit={handleInit}>
              {/* Account type selector at top */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Account Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { value: 'SAVINGS', label: 'Savings Account', desc: '1% monthly interest', color: '#2d8bff' },
                    { value: 'CURRENT', label: 'Current Account', desc: 'Unlimited transactions', color: '#00b894' },
                  ].map(t => (
                    <button key={t.value} type="button" onClick={() => up('accountType', t.value)} style={{
                      padding: '14px 16px', borderRadius: 12, border: `2px solid ${form.accountType === t.value ? t.color : '#e5e7eb'}`,
                      background: form.accountType === t.value ? `${t.color}0f` : 'white',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: form.accountType === t.value ? t.color : '#1a2540' }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                {[
                  { label: 'Full Name', key: 'fullName', placeholder: 'Andrew', type: 'text' },
                  { label: 'Date of Birth', key: 'dob', placeholder: '', type: 'date' },
                  { label: 'Aadhaar Number', key: 'aadhaarNumber', placeholder: '12-digit Aadhaar', type: 'text', maxLength: 12 },
                  { label: 'PAN Number', key: 'panNumber', placeholder: 'ABCDE1234F', type: 'text', maxLength: 10, upper: true },
                  { label: 'Email Address', key: 'email', placeholder: 'andrew@gmail.com', type: 'email' },
                  { label: 'Phone Number', key: 'phoneNumber', placeholder: '9876543210', type: 'text', maxLength: 10 },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{f.label}</label>
                    <input
                      style={inputStyle} type={f.type} placeholder={f.placeholder}
                      maxLength={f.maxLength}
                      value={form[f.key]}
                      onChange={e => up(f.key, f.upper ? e.target.value.toUpperCase() : e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Address</label>
                <input style={inputStyle} placeholder="12, MG Road, Bangalore - 560001"
                  value={form.address} onChange={e => up('address', e.target.value)} required />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Password</label>
                <input style={inputStyle} type="password" placeholder="Minimum 8 characters"
                  value={form.password} onChange={e => up('password', e.target.value)} required />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #1a6bcc, #00b894)',
                color: 'white', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
                boxShadow: '0 6px 20px rgba(26,107,204,0.3)',
              }}>
                {loading ? 'Sending OTP...' : 'Send OTP & Continue →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#9ca3af' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#1a6bcc', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <div style={{ textAlign: 'center', padding: '16px 0 28px' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(26,107,204,0.08)', border: '2px solid rgba(26,107,204,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: 30, color: '#1a6bcc',
                }}>✉</div>
                <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
                  Enter the 6-digit OTP sent to<br />
                  <strong style={{ color: '#1a2540' }}>{form.email}</strong>
                </p>
                <input
                  style={{ ...inputStyle, textAlign: 'center', fontSize: 28, letterSpacing: 20, fontFamily: 'monospace', padding: '16px' }}
                  placeholder="------" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value)} required autoFocus
                />
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', marginTop: 24,
                  background: 'linear-gradient(135deg, #1a6bcc, #00b894)',
                  color: 'white', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
                }}>
                  {loading ? 'Verifying...' : 'Verify & Create Account'}
                </button>
                <button type="button" onClick={() => setStep(1)} style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', marginTop: 10,
                  background: 'transparent', color: '#9ca3af',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                }}>← Back to details</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
