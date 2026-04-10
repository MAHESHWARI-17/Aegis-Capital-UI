import React, { useState, useEffect } from 'react';
import { accountAPI, txnAPI } from '../../services/api';
import { DashboardLayout, CustomerSidebar, PageHeader, LoadingPage } from '../../components/shared.jsx';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(v || 0);

//Shared fee calculator
const calcFee = (amt) => {
  const a = Number(amt);
  if (!a) return { fee: 0, rate: 0 };
  const rate = a < 10000 ? 2.5 : 5;
  return { fee: +(a * rate / 100).toFixed(2), rate };
};

// Account Picker
function AccountPicker({ accounts, value, onChange, label = 'Select Account' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">-- Choose Account --</option>
        {accounts.filter(a => a.status === 'ACTIVE').map(a => (
          <option key={a.accountNumber} value={a.accountNumber}>
            {a.accountNumber} — {a.accountType}
          </option>
        ))}
      </select>
    </div>
  );
}

//Receipt modal
function Receipt({ data, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-body" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'rgba(0,184,148,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>✓</div>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, color: 'var(--mint)', marginBottom: 8 }}>Transaction Successful</h3>
          <p className="text-muted" style={{ marginBottom: 28 }}>{data.summary}</p>
          <div style={{ background: 'var(--slate)', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 24 }}>
            {[
              ['Reference', data.transactionRef],
              ['Amount', fmt(data.amount)],
              data.feeAmount > 0 && ['Fee', fmt(data.feeAmount)],
              data.feeAmount > 0 && ['Total Debited', fmt(data.totalDebited)],
              ['Balance After', fmt(data.balanceAfter)],
              ['Type', data.transactionType],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--slate-mid)', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 600, fontFamily: k === 'Reference' ? 'monospace' : 'inherit' }}>{v}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-full" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

//Deposit Page
export function WithdrawPage() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm]         = useState({ accountNumber: '', pin: '', amount: '', description: '' });
  const [limitInfo, setLimitInfo] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  useEffect(() => { accountAPI.getProfile().then(r => setAccounts(r.data.data?.accounts || [])); }, []);

  useEffect(() => {
    if (!form.accountNumber) { setLimitInfo(null); return; }

    if (form.accountNumber.startsWith('CA')) {
      setLimitInfo({ unlimited: true, remainingToday: null, dailyLimit: null });
      return;
    }
    txnAPI.getRemaining(form.accountNumber)
      .then(r => {
        const data = r.data.data;

        if (data && data.unlimited === undefined) {
          data.unlimited = form.accountNumber.startsWith('CA');
        }
        setLimitInfo(data);
      })
      .catch(() => {});
  }, [form.accountNumber]);

  const { fee, rate } = calcFee(form.amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accountNumber) return toast.error('Select an account');
    if (!form.pin || form.pin.length !== 4) return toast.error('Enter your 4-digit PIN');
    setLoading(true);
    try {
      const r = await txnAPI.withdraw({ ...form, amount: Number(form.amount) });
      setResult(r.data.data);
      if (form.accountNumber) txnAPI.getRemaining(form.accountNumber).then(lr => setLimitInfo(lr.data.data)).catch(() => {});
    } catch (err) { toast.error(err.response?.data?.message || 'Withdrawal failed'); }
    finally { setLoading(false); }
  };

  const limitReached = limitInfo && !limitInfo.unlimited && limitInfo.remainingToday === 0;

  return (
    <DashboardLayout sidebar={<CustomerSidebar />}>
      <PageHeader title="Withdraw Funds" subtitle="Withdraw from your account" />
      <div style={{ maxWidth: 520 }}>
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <AccountPicker accounts={accounts} value={form.accountNumber} onChange={v => setForm({ ...form, accountNumber: v })} />

              {/* Limit badge — only show for SAVINGS accounts */}
              {limitInfo && !limitInfo.unlimited && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                  background: limitReached ? 'rgba(232,93,117,0.08)' : 'rgba(26,107,204,0.08)',
                  border: `1px solid ${limitReached ? 'rgba(232,93,117,0.25)' : 'rgba(26,107,204,0.2)'}`,
                  borderRadius: 10, padding: '10px 14px',
                }}>

                  <span style={{ fontSize: 13, fontWeight: 600, color: limitReached ? 'var(--rose)' : 'var(--sky)' }}>
                    {limitReached ? 'Daily limit reached — resets at midnight' :
                     `${limitInfo.remainingToday} of ${limitInfo.dailyLimit} transactions remaining today`}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                  <input className="form-input" type="number" min="1" step="0.01" placeholder="0.00"
                    style={{ paddingLeft: 32 }} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>

              {form.amount > 0 && (
                <div style={{ background: 'rgba(26,107,204,0.05)', border: '1px solid rgba(26,107,204,0.15)', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 14 }}>
                  <div className="flex-between"><span className="text-muted">Fee ({rate}%)</span><span className="fw-600">- {fmt(fee)}</span></div>
                  <div className="flex-between" style={{ marginTop: 8 }}><span className="text-muted">Total Debited</span><span className="fw-700" style={{ color: 'var(--rose)' }}>{fmt(Number(form.amount) + fee)}</span></div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">4-Digit PIN</label>
                <input className="form-input" type="password" placeholder="••••" maxLength={4}
                  value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} />
                <span className="form-hint">Required for all withdrawals</span>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="form-input" placeholder="e.g. ATM withdrawal" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || limitReached}>
                {loading ? <span className="spinner" /> : '↑ Withdraw Now'}
              </button>
              {limitReached && <p style={{ textAlign: 'center', color: 'var(--rose)', fontSize: 13, marginTop: 8 }}>Daily limit reached. Try again after midnight.</p>}
            </form>
          </div>
        </div>
      </div>
      {result && <Receipt data={result} onClose={() => { setResult(null); setForm({ accountNumber: '', pin: '', amount: '', description: '' }); setLimitInfo(null); }} />}
    </DashboardLayout>
  );
}

// ── TRANSFER PAGE ─────────────────────────────────────────────────
//
export function TransferPage() {
  const [accounts, setAccounts]     = useState([]);
  const [mode, setMode]             = useState('internal'); // 'internal' | 'interbank'
  const [form, setForm]             = useState({
    fromAccount: '', pin: '', amount: '', description: '',
    // Internal
    toAccount: '',
    recipientName: '', recipientPhone: '',
    // Inter-bank
    beneficiaryName: '', beneficiaryAccount: '', beneficiaryBank: '',
    beneficiaryIFSC: '', transferMode: 'IMPS',
  });
  const [limitInfo, setLimitInfo]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [verifying, setVerifying]   = useState(false);
  const [verified, setVerified]     = useState(false);

  useEffect(() => { accountAPI.getProfile().then(r => setAccounts(r.data.data?.accounts || [])); }, []);

  useEffect(() => {
    if (!form.fromAccount) { setLimitInfo(null); return; }

    if (form.fromAccount.startsWith('CA')) {
      setLimitInfo({ unlimited: true, remainingToday: null, dailyLimit: null });
      return;
    }
    txnAPI.getRemaining(form.fromAccount)
      .then(r => {
        const data = r.data.data;

        if (data && data.unlimited === undefined) {
          data.unlimited = form.fromAccount.startsWith('CA');
        }
        setLimitInfo(data);
      })
      .catch(() => {});
  }, [form.fromAccount]);


  useEffect(() => { setVerified(false); }, [form.toAccount]);

  const { fee, rate } = calcFee(form.amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'internal' && form.fromAccount === form.toAccount) return toast.error('Cannot transfer to same account');
    if (!form.pin || form.pin.length !== 4) return toast.error('Enter your 4-digit PIN');

    if (mode === 'interbank') {
      toast('Inter-bank transfers (NEFT/IMPS/RTGS) are processed within 30 minutes.', { icon: 'ℹ️', duration: 4000 });

      toast.success('Transfer request submitted. Your funds will be processed shortly.');
      setResult({
        transactionRef: 'NEFT' + Date.now(),
        summary: `Inter-bank transfer to ${form.beneficiaryName} via ${form.transferMode}`,
        amount: form.amount, feeAmount: fee, totalDebited: Number(form.amount) + fee,
        balanceAfter: null, transactionType: 'TRANSFER',
      });
      return;
    }

    setLoading(true);
    try {
      const r = await txnAPI.transfer({
        fromAccount: form.fromAccount, toAccount: form.toAccount,
        pin: form.pin, amount: Number(form.amount), description: form.description,
      });
      setResult(r.data.data);
      if (form.fromAccount) txnAPI.getRemaining(form.fromAccount).then(lr => setLimitInfo(lr.data.data)).catch(() => {});
    } catch (err) { toast.error(err.response?.data?.message || 'Transfer failed'); }
    finally { setLoading(false); }
  };

  const limitReached = limitInfo && !limitInfo.unlimited && limitInfo.remainingToday === 0;

  return (
    <DashboardLayout sidebar={<CustomerSidebar />}>
      <PageHeader title="Transfer Funds" subtitle="Send money securely" />
      <div style={{ maxWidth: 560 }}>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--slate)', borderRadius: 12, padding: 4 }}>
          {[
            { id: 'internal', label: 'Within AegisCapital', sub: 'Instant' },
            { id: 'interbank', label: 'Other Bank (NEFT/IMPS)', sub: 'Up to 30 min' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
              background: mode === m.id ? 'white' : 'transparent',
              boxShadow: mode === m.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: mode === m.id ? 'var(--sky)' : 'var(--text-muted)' }}>{m.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.sub}</div>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <AccountPicker accounts={accounts} value={form.fromAccount} label="From Account"
                onChange={v => setForm({ ...form, fromAccount: v })} />

              {/* Limit badge — only for SAVINGS accounts */}
              {limitInfo && !limitInfo.unlimited && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
                  background: limitReached ? 'rgba(232,93,117,0.08)' : 'rgba(26,107,204,0.08)',
                  border: `1px solid ${limitReached ? 'rgba(232,93,117,0.2)' : 'rgba(26,107,204,0.15)'}`,
                  borderRadius: 8, padding: '8px 12px', fontSize: 13,
                }}>

                  <span style={{ fontWeight: 600, color: limitReached ? 'var(--rose)' : 'var(--sky)' }}>
                    {limitReached ? 'Daily limit reached' :
                     `${limitInfo.remainingToday}/${limitInfo.dailyLimit} transactions left today`}
                  </span>
                </div>
              )}

              {/*Internal transfer fields*/}
              {mode === 'internal' && (
                <>
                  <div style={{ background: 'var(--slate)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Recipient Details</p>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Account Number</label>
                      <input className="form-input font-mono" placeholder="e.g. SB100000000001"
                        value={form.toAccount} onChange={e => setForm({ ...form, toAccount: e.target.value })} required />
                      <span className="form-hint">Enter the recipient's AegisCapital account number</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Recipient Name</label>
                        <input className="form-input" placeholder="e.g. Andrew"
                          value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Recipient Phone</label>
                        <input className="form-input" placeholder="e.g. 9876543210"
                          value={form.recipientPhone} onChange={e => setForm({ ...form, recipientPhone: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/*Inter-bank transfer fields*/}
              {mode === 'interbank' && (
                <div style={{ background: 'var(--slate)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Beneficiary Details</p>
                  <div className="form-group">
                    <label className="form-label">Beneficiary Name</label>
                    <input className="form-input" placeholder="Full name as per bank records"
                      value={form.beneficiaryName} onChange={e => setForm({ ...form, beneficiaryName: e.target.value })} required={mode === 'interbank'} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input className="form-input font-mono" placeholder="Beneficiary account number"
                      value={form.beneficiaryAccount} onChange={e => setForm({ ...form, beneficiaryAccount: e.target.value })} required={mode === 'interbank'} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Bank Name</label>
                      <input className="form-input" placeholder="e.g. State Bank of India"
                        value={form.beneficiaryBank} onChange={e => setForm({ ...form, beneficiaryBank: e.target.value })} required={mode === 'interbank'} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">IFSC Code</label>
                      <input className="form-input font-mono" placeholder="e.g. SBIN0001234"
                        value={form.beneficiaryIFSC} onChange={e => setForm({ ...form, beneficiaryIFSC: e.target.value.toUpperCase() })} required={mode === 'interbank'} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                    <label className="form-label">Transfer Mode</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['IMPS', 'NEFT', 'RTGS'].map(m => (
                        <button key={m} type="button" onClick={() => setForm({ ...form, transferMode: m })} style={{
                          flex: 1, padding: '9px', borderRadius: 8, border: `1px solid ${form.transferMode === m ? 'var(--sky)' : 'var(--card-border)'}`,
                          background: form.transferMode === m ? 'rgba(26,107,204,0.1)' : 'white',
                          color: form.transferMode === m ? 'var(--sky)' : 'var(--text-muted)',
                          fontWeight: 600, fontSize: 13, cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif',
                        }}>
                          {m}
                          <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>
                            {m === 'IMPS' ? 'Instant' : m === 'NEFT' ? 'Hourly' : '≥₹2L'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                  <input className="form-input" type="number" min="1" step="0.01" placeholder="0.00"
                    style={{ paddingLeft: 32 }} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>

              {form.amount > 0 && (
                <div style={{ background: 'rgba(26,107,204,0.05)', border: '1px solid rgba(26,107,204,0.15)', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 14 }}>
                  <div className="flex-between"><span className="text-muted">Fee ({rate}%)</span><span className="fw-600">- {fmt(fee)}</span></div>
                  <div className="flex-between" style={{ marginTop: 6 }}><span className="text-muted">Total Debited</span><span className="fw-700" style={{ color: 'var(--rose)' }}>{fmt(Number(form.amount) + fee)}</span></div>
                </div>
              )}

              {/* PIN */}
              <div className="form-group">
                <label className="form-label">4-Digit PIN</label>
                <input className="form-input" type="password" placeholder="••••" maxLength={4}
                  value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="form-input" placeholder="e.g. Rent payment"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || limitReached}>
                {loading ? <span className="spinner" /> : `⇄ ${mode === 'interbank' ? `${form.transferMode} Transfer` : 'Transfer Now'}`}
              </button>
            </form>
          </div>
        </div>

        {mode === 'internal' && (
          <div className="alert alert-warning" style={{ marginTop: 16, fontSize: 13 }}>
            New recipients (accounts created within 24 hrs) have a transfer limit of ₹1,00,000.
          </div>
        )}

      </div>
      {result && <Receipt data={result} onClose={() => { setResult(null); setForm({ fromAccount: '', toAccount: '', pin: '', amount: '', description: '', recipientName: '', recipientPhone: '', beneficiaryName: '', beneficiaryAccount: '', beneficiaryBank: '', beneficiaryIFSC: '', transferMode: 'IMPS' }); setLimitInfo(null); }} />}
    </DashboardLayout>
  );
}
