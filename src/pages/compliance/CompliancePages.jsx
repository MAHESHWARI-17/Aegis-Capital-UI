import React, { useState, useEffect } from 'react';
import { complianceAPI, auditAPI, txnAPI } from '../../services/api';
import { DashboardLayout, ComplianceSidebar, PageHeader, StatusBadge, LoadingPage } from '../../components/shared.jsx';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(v || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

//Dashboard
export function ComplianceDashboard() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complianceAPI.getAllUsers()
      .then(r => setUsers(r.data.data || []))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const active          = users.filter(u => u.status === 'ACTIVE').length;
  const locked          = users.filter(u => u.status === 'LOCKED').length;
  const frozenAccounts  = users.flatMap(u => u.accounts || []).filter(a => a.status === 'FROZEN').length;

  return (
    <DashboardLayout sidebar={<ComplianceSidebar />}>
      <PageHeader title="Compliance Dashboard" subtitle="Monitor and manage customer accounts" />
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Customers',  value: users.length,    color: 'var(--sky)'  },
          { label: 'Active',           value: active,          color: 'var(--mint)' },
          { label: 'Locked Users',     value: locked,          color: 'var(--rose)' },
          { label: 'Frozen Accounts',  value: frozenAccounts,  color: '#1a6bcc'     },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <p className="stat-label">{s.label}</p>
            <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: s.color, margin: '8px 0' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? <LoadingPage /> : (
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Recent Customers</h3>
            <span className="badge badge-info">{users.length} total</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Customer ID</th><th>Name</th><th>Email</th><th>Status</th><th>Accounts</th></tr></thead>
              <tbody>
                {users.slice(0, 10).map(u => (
                  <tr key={u.customerId}>
                    <td><span className="font-mono text-sm">{u.customerId}</span></td>
                    <td className="fw-600">{u.fullName}</td>
                    <td>{u.email}</td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>{u.accounts?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

//Users Management
export function ComplianceUsersPage() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [freezeForm, setFreezeForm] = useState({ show: false, accountNumber: '', reason: '', action: 'freeze' });

  const load = () => {
    setLoading(true);
    complianceAPI.getAllUsers().then(r => setUsers(r.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleLock = async (customerId, action) => {
    try {
      if (action === 'lock') await complianceAPI.lockUser(customerId);
      else await complianceAPI.unlockUser(customerId);
      toast.success(`User ${action}ed`); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleFreezeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (freezeForm.action === 'freeze')
        await complianceAPI.freezeAccount({ accountNumber: freezeForm.accountNumber, reason: freezeForm.reason });
      else
        await complianceAPI.unfreezeAccount({ accountNumber: freezeForm.accountNumber, reason: freezeForm.reason });
      toast.success(`Account ${freezeForm.action}d`);
      setFreezeForm({ show: false, accountNumber: '', reason: '', action: 'freeze' }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <DashboardLayout sidebar={<ComplianceSidebar />}>
      <PageHeader title="User Management" subtitle="Freeze accounts, lock users" />
      <div className="card">
        {loading ? <LoadingPage /> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Customer ID</th><th>Name</th><th>Email</th><th>Status</th><th>Accounts</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <React.Fragment key={u.customerId}>
                    <tr>
                      <td><span className="font-mono text-sm">{u.customerId}</span></td>
                      <td className="fw-600">{u.fullName}</td>
                      <td className="text-sm">{u.email}</td>
                      <td><StatusBadge status={u.status} /></td>
                      <td>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => setSelected(selected === u.customerId ? null : u.customerId)}>
                          {u.accounts?.length || 0} acct(s) {selected === u.customerId ? '▲' : '▼'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {u.status === 'ACTIVE'  && <button className="btn btn-danger btn-sm"  onClick={() => handleLock(u.customerId, 'lock')}>Lock</button>}
                          {u.status === 'LOCKED'  && <button className="btn btn-success btn-sm" onClick={() => handleLock(u.customerId, 'unlock')}>Unlock</button>}
                        </div>
                      </td>
                    </tr>
                    {selected === u.customerId && u.accounts?.map(acc => (
                      <tr key={acc.accountNumber} style={{ background: 'rgba(0,184,148,0.03)' }}>
                        <td colSpan={2} style={{ paddingLeft: 40 }}>
                          <span className="font-mono text-sm" style={{ color: 'var(--mint)' }}>↳ {acc.accountNumber}</span>
                          <span className="badge badge-neutral" style={{ marginLeft: 8, fontSize: 11 }}>{acc.accountType}</span>
                        </td>
                        <td colSpan={2}><span className="fw-600">{fmt(acc.balance)}</span></td>
                        <td><StatusBadge status={acc.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {acc.status !== 'FROZEN' && acc.status !== 'CLOSED' && (
                              <button className="btn btn-sm"
                                style={{ background: 'rgba(26,107,204,0.1)', color: 'var(--sky)', fontSize: 12 }}
                                onClick={() => setFreezeForm({ show: true, accountNumber: acc.accountNumber, reason: '', action: 'freeze' })}>
                                Freeze
                              </button>
                            )}
                            {acc.status === 'FROZEN' && (
                              <button className="btn btn-sm"
                                style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--mint)', fontSize: 12 }}
                                onClick={() => setFreezeForm({ show: true, accountNumber: acc.accountNumber, reason: '', action: 'unfreeze' })}>
                                Unfreeze
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Freeze/Unfreeze modal */}
      {freezeForm.show && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>
                {freezeForm.action === 'freeze' ? 'Freeze Account' : 'Unfreeze Account'}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setFreezeForm({ ...freezeForm, show: false })}>✕</button>
            </div>
            <form onSubmit={handleFreezeSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input className="form-input font-mono" value={freezeForm.accountNumber} readOnly style={{ background: 'var(--slate)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <input className="form-input" placeholder="State the reason..."
                    value={freezeForm.reason}
                    onChange={e => setFreezeForm({ ...freezeForm, reason: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setFreezeForm({ ...freezeForm, show: false })}>Cancel</button>
                <button type="submit" className={`btn ${freezeForm.action === 'freeze' ? 'btn-danger' : 'btn-success'}`}>
                  {freezeForm.action === 'freeze' ? 'Freeze Account' : 'Unfreeze Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Compliance Deposit Page
export function ComplianceDepositPage() {
  const [form, setForm]     = useState({ accountNumber: '', amount: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accountNumber.trim()) return toast.error('Enter an account number');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
    setLoading(true);
    try {
      const r = await complianceAPI.deposit({
        accountNumber: form.accountNumber.trim(),
        amount: Number(form.amount),
        description: form.description || 'Compliance deposit',
      });
      setResult(r.data.data);
      toast.success('Deposit successful');
      setForm({ accountNumber: '', amount: '', description: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Deposit failed'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout sidebar={<ComplianceSidebar />}>
      <PageHeader title="Deposit Funds" subtitle="Deposit money into a customer account" />
      <div style={{ maxWidth: 520 }}>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input className="form-input font-mono" placeholder="e.g. SB100000000001"
                  value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                  <input className="form-input" type="number" min="1" step="0.01" placeholder="0.00"
                    style={{ paddingLeft: 32 }} value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="form-input" placeholder="e.g. Refund, Credit adjustment"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-success btn-full btn-lg" disabled={loading}>
                {loading ? <span className="spinner" /> : '↓ Deposit Now'}
              </button>
            </form>
          </div>
        </div>

        {result && (
          <div className="card" style={{ marginTop: 20, border: '1px solid rgba(0,184,148,0.3)' }}>
            <div className="card-body">
              <h3 style={{ color: 'var(--mint)', marginBottom: 16, fontFamily: 'DM Serif Display, serif' }}>✓ Deposit Successful</h3>
              {[
                ['Reference',    result.transactionRef],
                ['Account',      result.toAccount],
                ['Amount',       fmt(result.amount)],
                ['Balance After', fmt(result.balanceAfter)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--slate-mid)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600, fontFamily: k === 'Reference' ? 'monospace' : 'inherit' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

//Audit Viewer
export function ComplianceAuditPage() {
  const [mode, setMode]           = useState('account');
  const [form, setForm]           = useState({
    accountNumber: '', customerId: '',
    from: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault(); setLoading(true); setSearched(true);
    try {
      if (mode === 'account') {
        const [t, s] = await Promise.all([
          auditAPI.complianceTransactions(form.accountNumber, form.from, form.to),
          auditAPI.complianceSummary(form.accountNumber, form.from, form.to),
        ]);
        setTransactions(t.data.data || []); setSummary(s.data.data);
      } else {
        const t = await auditAPI.complianceByCustomer(form.customerId, form.from, form.to);
        setTransactions(t.data.data || []); setSummary(null);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Search failed'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout sidebar={<ComplianceSidebar />}>
      <PageHeader title="Audit Viewer" subtitle="Investigate any account's transactions by date range" />

      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab ${mode === 'account' ? 'active' : ''}`}
          onClick={() => { setMode('account'); setSearched(false); }}>By Account Number</button>
        <button className={`tab ${mode === 'customer' ? 'active' : ''}`}
          onClick={() => { setMode('customer'); setSearched(false); }}>By Customer ID</button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {mode === 'account' ? (
              <div className="form-group" style={{ margin: 0, flex: 2, minWidth: 200 }}>
                <label className="form-label">Account Number</label>
                <input className="form-input font-mono" placeholder="e.g. SB100000000001"
                  value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} required />
              </div>
            ) : (
              <div className="form-group" style={{ margin: 0, flex: 2, minWidth: 200 }}>
                <label className="form-label">Customer ID</label>
                <input className="form-input font-mono" placeholder="e.g. 100000000001"
                  value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} required />
              </div>
            )}
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
              <label className="form-label">From</label>
              <input className="form-input" type="date" value={form.from}
                onChange={e => setForm({ ...form, from: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
              <label className="form-label">To</label>
              <input className="form-input" type="date" value={form.to}
                onChange={e => setForm({ ...form, to: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {summary && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total',    value: summary.totalTransactions,  color: 'var(--sky)'  },
            { label: 'Credit',   value: fmt(summary.totalCredit),   color: 'var(--mint)' },
            { label: 'Debit',    value: fmt(summary.totalDebit),    color: 'var(--rose)' },
            { label: 'Net Flow', value: fmt(summary.netFlow),       color: summary.netFlow >= 0 ? 'var(--mint)' : 'var(--rose)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <p className="stat-label">{s.label}</p>
              <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: s.color, margin: '6px 0' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {searched && (
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Results</h3>
            <span className="badge badge-info">{transactions.length} records</span>
          </div>
          {loading ? <LoadingPage /> : transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◉</div>
              <p>No transactions found in this date range</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th><th>Date</th><th>Account</th><th>Customer</th>
                    <th>Type</th><th>Amount</th><th>Fee</th><th>Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.transactionRef}>
                      <td><span className="font-mono text-sm">{t.transactionRef}</span></td>
                      <td className="text-sm text-muted">{fmtDate(t.transactionTime || t.createdAt)}</td>
                      <td><span className="font-mono text-sm">{t.accountNumber || t.fromAccount || '—'}</span></td>
                      <td className="text-sm">{t.customerName || t.customerId || '—'}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                          background: t.flowDirection === 'CREDIT' ? 'rgba(0,184,148,0.1)' : 'rgba(232,93,117,0.1)',
                          color: t.flowDirection === 'CREDIT' ? 'var(--mint)' : 'var(--rose)',
                        }}>
                          {t.flowDirection} {t.transactionType}
                        </span>
                      </td>
                      <td>
                        <span className="fw-600" style={{ color: t.flowDirection === 'CREDIT' ? 'var(--mint)' : 'var(--rose)' }}>
                          {fmt(t.amount)}
                        </span>
                      </td>
                      <td className="text-muted text-sm">{t.feeAmount > 0 ? fmt(t.feeAmount) : '—'}</td>
                      <td className="fw-600">{t.balanceAfter != null ? fmt(t.balanceAfter) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
