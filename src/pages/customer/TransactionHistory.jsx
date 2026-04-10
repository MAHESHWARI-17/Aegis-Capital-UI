import React, { useState, useEffect, useRef } from 'react';
import { accountAPI, auditAPI } from '../../services/api';
import { DashboardLayout, CustomerSidebar, PageHeader, StatusBadge, LoadingPage } from '../../components/shared.jsx';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(v || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10); };
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => addDays(new Date(), -n);

const QUICK_FILTERS = [
  { label: 'Last 5 days', from: () => daysAgo(5), to: today },
  { label: 'Last 15 days', from: () => daysAgo(15), to: today },
  { label: 'Last 30 days', from: () => daysAgo(30), to: today },
  { label: 'This month', from: () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }, to: today },
  { label: 'Last 3 months', from: () => daysAgo(90), to: today },
];

export default function TransactionHistoryPage() {
  const [accounts, setAccounts]         = useState([]);
  const [activeFilter, setActiveFilter] = useState(0);
  const [form, setForm]                 = useState({ accountNumber: '', from: daysAgo(5), to: today() });
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [autoLoaded, setAutoLoaded]     = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    accountAPI.getProfile().then(r => {
      const acc = r.data.data?.accounts || [];
      setAccounts(acc);
      if (acc[0]) {
        const updated = { accountNumber: acc[0].accountNumber, from: daysAgo(5), to: today() };
        setForm(updated);
        fetchData(acc[0].accountNumber, updated.from, updated.to);
      }
    });
  }, []);

  const fetchData = async (accountNumber, from, to) => {
    if (!accountNumber) return;
    setLoading(true);
    try {
      const [txnRes, sumRes] = await Promise.all([
        auditAPI.myTransactions(accountNumber, from, to),
        auditAPI.mySummary(accountNumber, from, to),
      ]);
      setTransactions(txnRes.data.data || []);
      setSummary(sumRes.data.data);
      setAutoLoaded(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch transactions');
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(form.accountNumber, form.from, form.to);
  };

  const applyQuickFilter = (idx) => {
    const f = QUICK_FILTERS[idx];
    const newForm = { ...form, from: f.from(), to: f.to() };
    setForm(newForm);
    setActiveFilter(idx);
    fetchData(form.accountNumber, newForm.from, newForm.to);
  };

  //PDF Bank Statement
  const downloadStatement = () => {
    const account = accounts.find(a => a.accountNumber === form.accountNumber);
    const html = `
      <!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #1a2540; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #1a6bcc; padding-bottom: 24px; }
        .logo { font-size: 28px; font-weight: bold; color: #1a6bcc; }
        .logo span { color: #00b894; }
        .title { font-size: 22px; font-weight: bold; margin: 0 0 8px; }
        .meta { font-size: 13px; color: #6b7280; line-height: 1.8; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .sum-card { background: #f7f8fc; border-radius: 8px; padding: 14px; }
        .sum-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .sum-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #1a6bcc; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
        .credit { color: #059669; font-weight: 600; }
        .debit  { color: #dc2626; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div>
          <div class="logo">Aegis<span>Capital</span></div>
          <div class="meta" style="margin-top:8px">Official Bank Statement</div>
        </div>
        <div style="text-align:right">
          <div class="title">Account Statement</div>
          <div class="meta">
            Account: <strong>${form.accountNumber}</strong><br>
            Type: <strong>${account?.accountType || ''} Account</strong><br>
            Period: <strong>${form.from}</strong> to <strong>${form.to}</strong><br>
            Generated: <strong>${new Date().toLocaleDateString('en-IN')}</strong>
          </div>
        </div>
      </div>
      ${summary ? `
      <div class="summary">
        <div class="sum-card"><div class="sum-label">Total Transactions</div><div class="sum-val">${summary.totalTransactions}</div></div>
        <div class="sum-card"><div class="sum-label">Total Credit</div><div class="sum-val credit">${fmt(summary.totalCredit)}</div></div>
        <div class="sum-card"><div class="sum-label">Total Debit</div><div class="sum-val debit">${fmt(summary.totalDebit)}</div></div>
      </div>` : ''}
      <table>
        <thead><tr>
          <th>Reference</th><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Fee</th><th>Balance After</th>
        </tr></thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td style="font-family:monospace;font-size:11px">${t.transactionRef}</td>
              <td>${fmtDate(t.transactionTime || t.createdAt)}</td>
              <td>${t.transactionType}</td>
              <td>${t.description || '—'}</td>
              <td class="${t.flowDirection === 'CREDIT' || t.transactionType === 'DEPOSIT' ? 'credit' : 'debit'}">
                ${t.flowDirection === 'CREDIT' || t.transactionType === 'DEPOSIT' ? '+' : '-'}${fmt(t.amount)}
              </td>
              <td>${t.feeAmount > 0 ? fmt(t.feeAmount) : '—'}</td>
              <td style="font-weight:600">${t.balanceAfter != null ? fmt(t.balanceAfter) : '—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">
        This is a computer-generated statement and does not require a signature. AegisCapital © 2026
      </div>
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); };
  };

  return (
    <DashboardLayout sidebar={<CustomerSidebar />}>
      <PageHeader
        title="Transaction History"
        subtitle="View and download your transaction records"
        action={
          autoLoaded && transactions.length > 0 && (
            <button onClick={downloadStatement}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px',
                background: 'linear-gradient(135deg, #1a6bcc, #00b894)',
                color: 'white', border: 'none', borderRadius: 10,
                fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
              ↓ Download Statement (PDF)
            </button>
          )
        }
      />

      {/* Account + date filter */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: 2, minWidth: 200 }}>
              <label className="form-label">Account</label>
              <select className="form-select" value={form.accountNumber}
                onChange={e => { setForm({ ...form, accountNumber: e.target.value }); setAutoLoaded(false); }}>
                {accounts.filter(a => a.status === 'ACTIVE').map(a => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.accountNumber} — {a.accountType}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
              <label className="form-label">From</label>
              <input className="form-input" type="date" value={form.from}
                onChange={e => { setForm({ ...form, from: e.target.value }); setActiveFilter(-1); }} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
              <label className="form-label">To</label>
              <input className="form-input" type="date" value={form.to}
                onChange={e => { setForm({ ...form, to: e.target.value }); setActiveFilter(-1); }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Search'}
            </button>
          </form>

          {/* Quick filters */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {QUICK_FILTERS.map((f, i) => (
              <button key={f.label} onClick={() => applyQuickFilter(i)} style={{
                padding: '5px 14px', borderRadius: 100, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                background: activeFilter === i ? 'var(--sky)' : 'var(--slate)',
                color: activeFilter === i ? 'white' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>{f.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: 'Transactions', value: summary.totalTransactions, color: 'var(--sky)', sub: 'in this period' },
            { label: 'Total Credit', value: fmt(summary.totalCredit), color: 'var(--mint)', sub: `${summary.creditCount} credit(s)` },
            { label: 'Total Debit', value: fmt(summary.totalDebit), color: 'var(--rose)', sub: `${summary.debitCount} debit(s)` },

          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <p className="stat-label">{s.label}</p>
              <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: s.color, margin: '6px 0 2px' }}>{s.value}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Transactions table */}
      <div className="card" ref={printRef}>
        <div className="card-header">
          <h3 className="section-title">Transactions</h3>
          {transactions.length > 0 && (
            <span className="badge badge-info">{transactions.length} records</span>
          )}
        </div>
        {loading ? <LoadingPage /> : !autoLoaded ? (
          <div className="empty-state">
            <div className="empty-state-icon">≡</div>
            <p>Select an account and date range to view transactions</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◉</div>
            <p>No transactions found in this date range</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => {
                  const isCredit = t.flowDirection === 'CREDIT' || t.transactionType === 'DEPOSIT';
                  return (
                    <tr key={t.transactionRef}>
                      <td><span className="font-mono text-sm">{t.transactionRef}</span></td>
                      <td className="text-sm text-muted">{fmtDate(t.transactionTime || t.createdAt)}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                          background: isCredit ? 'rgba(0,184,148,0.1)' : 'rgba(232,93,117,0.1)',
                          color: isCredit ? 'var(--mint)' : 'var(--rose)',
                        }}>
                          {isCredit ? '↓' : '↑'} {t.transactionType}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{t.description || '—'}</td>
                      <td>
                        <span className="fw-600" style={{ color: isCredit ? 'var(--mint)' : 'var(--rose)' }}>
                          {isCredit ? '+' : '-'}{fmt(t.amount)}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{t.feeAmount > 0 ? fmt(t.feeAmount) : '—'}</td>
                      <td className="fw-600">{t.balanceAfter != null ? fmt(t.balanceAfter) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
