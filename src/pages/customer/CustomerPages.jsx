import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { accountAPI, txnAPI } from '../../services/api';
import { DashboardLayout, CustomerSidebar, PageHeader, StatusBadge, Amount, LoadingPage } from '../../components/shared.jsx';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(v || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Dashboard ─────────────────────────────────────────────────────
export function CustomerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await accountAPI.getProfile();
        setProfile(res.data.data);
        // Load recent transactions separately — never block dashboard if this fails
        if (res.data.data.accounts?.length) {
          const acc = res.data.data.accounts.find(a => a.status === 'ACTIVE')
                   || res.data.data.accounts[0];
          if (acc) {
            try {
              const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                .toISOString().slice(0, 10);
              const todayStr = new Date().toISOString().slice(0, 10);
              const h = await txnAPI.getStatement(acc.accountNumber, sevenDaysAgo, todayStr);
              setHistory(h.data.data || []);
            } catch {
              setHistory([]); // silent — dashboard still works
            }
          }
        }
      } catch {
        toast.error('Failed to load profile');
      } finally { setLoading(false); }
    })();
  }, []);

  const [showBalance, setShowBalance] = React.useState(false);

  if (loading) return <DashboardLayout sidebar={<CustomerSidebar />}><LoadingPage /></DashboardLayout>;

  const totalBalance = profile?.accounts?.reduce((s, a) => s + (a.balance || 0), 0) || 0;
  const activeAccounts = profile?.accounts?.filter(a => a.status === 'ACTIVE') || [];

  return (
    <DashboardLayout sidebar={<CustomerSidebar />}>
      <PageHeader
        title={`Good morning, ${profile?.fullName?.split(' ')[0] || 'Customer'}`}
        subtitle="Here's your Account Dashboard"
      />

      {/* Balance cards */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)', borderRadius: 20, padding: 28, color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Total Balance</p>
            <button onClick={() => setShowBalance(s => !s)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '4px 10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{showBalance ? 'Hide' : 'Show'}</button>
          </div>
          <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 34, margin: '4px 0' }}>{showBalance ? fmt(totalBalance) : '₹ ••••••'}</p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{profile?.accounts?.length || 0} account(s)</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Customer ID</p>
          <p style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: 'var(--sky)', margin: '8px 0 4px' }}>{profile?.customerId}</p>
          <StatusBadge status={profile?.status} />
        </div>
        <div className="stat-card">
          <p className="stat-label">Active Accounts</p>
          <p className="stat-value">{activeAccounts.length}</p>
          <p style={{ color: 'var(--mint)', fontSize: 13, fontWeight: 600 }}>✓ All systems operational</p>
        </div>
      </div>

      {/* Accounts */}
      <div style={{ marginBottom: 28 }}>

        <div className="grid-2">
          {profile?.accounts?.map(acc => (
            <div key={acc.accountNumber} style={{
              background: 'white', borderRadius: 16, padding: 24,
              border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)',
              borderLeft: `4px solid ${acc.status === 'ACTIVE' ? 'var(--mint)' : 'var(--slate-dark)'}`,
            }}>
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{acc.accountType} Account</p>
                  <p style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{acc.accountNumber}</p>
                </div>
                <StatusBadge status={acc.status} />
              </div>
              <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'var(--text-primary)' }}>{showBalance ? fmt(acc.balance) : '₹ ••••••'}</p>
              {!acc.pinSet && (
                <div className="alert alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
                   PIN not set — <a href="/accounts" style={{ color: 'inherit', fontWeight: 600 }}>Set PIN to activate</a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>



      {/* Recent transactions */}
      {history.length > 0 && (
        <div>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 className="section-title">Recent Transactions</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/transactions')}>View all →</button>
          </div>
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>Reference</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Date</th>
                </tr></thead>
                <tbody>
                  {history.map(t => (
                    <tr key={t.transactionRef}>
                      <td><span className="font-mono text-sm">{t.transactionRef}</span></td>
                      <td><StatusBadge status={t.transactionType} /></td>
                      <td><Amount value={t.amount} size="sm" positive={t.transactionType === 'DEPOSIT'} negative={t.transactionType === 'WITHDRAWAL'} /></td>
                      <td className="fw-600">{fmt(t.balanceAfter)}</td>
                      <td className="text-muted text-sm">{fmtDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

//Accounts Page
export function AccountsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPin, setShowPin] = useState(null);
  const [pinStep, setPinStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [accountType, setAccountType] = useState('SAVINGS');
  const [btnLoading, setBtnLoading] = useState(false);

  const loadProfile = async () => {
    try { const r = await accountAPI.getProfile(); setProfile(r.data.data); }
    catch { toast.error('Failed to load profile'); } finally { setLoading(false); }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleAddAccount = async (e) => {
    e.preventDefault(); setBtnLoading(true);
    try {
      await accountAPI.addAccount({ accountType });
      toast.success('Account added! Set your PIN to activate it.');
      setShowAdd(false); loadProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add account'); }
    finally { setBtnLoading(false); }
  };

  const handleRequestPinOtp = async (accountNumber) => {
    setBtnLoading(true);
    try {
      await accountAPI.requestPinOtp({ accountNumber });
      toast.success('OTP sent to your email');
      setShowPin(accountNumber); setPinStep(2);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send OTP'); }
    finally { setBtnLoading(false); }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (pin !== confirmPin) return toast.error('PINs do not match');
    setBtnLoading(true);
    try {
      await accountAPI.setPin({ accountNumber: showPin, otp, pin, confirmPin });
      toast.success('PIN set! Account is now ACTIVE ✓');
      setShowPin(null); setPinStep(1); setOtp(''); setPin(''); setConfirmPin('');
      loadProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to set PIN'); }
    finally { setBtnLoading(false); }
  };

  return (
    <DashboardLayout sidebar={<CustomerSidebar />}>
      <PageHeader title="My Accounts" subtitle="Manage all your bank accounts"
        action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Account</button>} />

      {loading ? <LoadingPage /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {profile?.accounts?.map(acc => (
            <div key={acc.accountNumber} className="card">
              <div className="card-body">
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                      <p className="text-muted text-sm">Account Number</p>
                      <p className="font-mono fw-700" style={{ fontSize: 18, marginTop: 4 }}>{acc.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted text-sm">Type</p>
                      <p className="fw-600" style={{ marginTop: 4 }}>{acc.accountType}</p>
                    </div>
                    <div>
                      <p className="text-muted text-sm">Balance</p>
                      <Amount value={acc.balance} size="lg" />
                    </div>
                    <div>
                      <p className="text-muted text-sm">Status</p>
                      <div style={{ marginTop: 4 }}><StatusBadge status={acc.status} /></div>
                    </div>
                  </div>
                  {acc.status === 'PENDING_PIN' && (
                    <button className="btn btn-primary btn-sm" onClick={() => { setShowPin(acc.accountNumber); setPinStep(1); }}>
                      Set PIN to Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>Add New Account</h3>
                <p className="text-muted text-sm" style={{ marginTop: 4 }}>Select the type of account to open</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAddAccount}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <select className="form-select" value={accountType} onChange={e => setAccountType(e.target.value)}>
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CURRENT">Current Account</option>
                  </select>
                </div>
                <div className="alert alert-info">
                  ️ Maximum 2 accounts per type allowed. New account starts as PENDING_PIN.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={btnLoading}>
                  {btnLoading ? <span className="spinner" /> : 'Open Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set PIN Modal */}
      {showPin && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>
                  {pinStep === 1 ? 'Activate Account' : 'Set Your PIN'}
                </h3>
                <p className="text-muted text-sm font-mono" style={{ marginTop: 4 }}>{showPin}</p>
              </div>
            </div>
            {pinStep === 1 ? (
              <div className="modal-body">
                <div className="alert alert-info"> We'll send an OTP to your registered email to verify your identity.</div>
                <div className="modal-footer" style={{ padding: '20px 0 0', border: 'none' }}>
                  <button className="btn btn-secondary" onClick={() => { setShowPin(null); setPinStep(1); }}>Cancel</button>
                  <button className="btn btn-primary" disabled={btnLoading} onClick={() => handleRequestPinOtp(showPin)}>
                    {btnLoading ? <span className="spinner" /> : 'Send OTP'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSetPin}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Email OTP</label>
                    <input className="form-input" placeholder="6-digit OTP" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">4-Digit PIN</label>
                      <input className="form-input" type="password" placeholder="••••" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm PIN</label>
                      <input className="form-input" type="password" placeholder="••••" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value)} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setPinStep(1)}>← Back</button>
                  <button type="submit" className="btn btn-success" disabled={btnLoading}>
                    {btnLoading ? <span className="spinner" /> : 'Activate Account ✓'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
