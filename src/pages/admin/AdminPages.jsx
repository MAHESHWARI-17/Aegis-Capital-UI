import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { DashboardLayout, AdminSidebar, PageHeader, StatusBadge, LoadingPage } from '../../components/shared.jsx';
import toast from 'react-hot-toast';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

//Admin Dashboard
export function AdminDashboard() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    adminAPI.getAllOfficers()
      .then(r => setOfficers(r.data.data || []))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout sidebar={<AdminSidebar />}><LoadingPage /></DashboardLayout>;

  const active   = officers.filter(o => o.status === 'APPROVED').length;
  const pending  = officers.filter(o => o.firstLogin).length;
  const suspended = officers.filter(o => o.status === 'SUSPENDED').length;

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <PageHeader title="Admin Dashboard" subtitle="Compliance officer management" />

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { label: 'Active Officers',       value: active,    color: '#00b894' },
          { label: 'Awaiting First Login',  value: pending,   color: pending > 0 ? '#c9a84c' : '#00b894' },
          { label: 'Suspended Officers',    value: suspended, color: suspended > 0 ? '#e85d75' : '#6b7280' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <p className="stat-label">{s.label}</p>
            <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, color: s.color, margin: '8px 0' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {pending > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          {pending} officer(s) have not completed first login yet. Go to Compliance Officers to resend OTP if needed.
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="section-title">All Compliance Officers</h3>
          <span className="badge badge-info">{officers.length} total</span>
        </div>
        {officers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◈</div>
            <p>No compliance officers yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Officer ID</th><th>Name</th><th>Email</th><th>Status</th><th>First Login</th><th>Created</th></tr></thead>
              <tbody>
                {officers.map(o => (
                  <tr key={o.email}>
                    <td><span className="font-mono text-sm">{o.officerId}</span></td>
                    <td className="fw-600">{o.fullName}</td>
                    <td className="text-sm">{o.email}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      {o.firstLogin
                        ? <span className="badge badge-warning">Pending</span>
                        : <span className="badge badge-success">Done ✓</span>}
                    </td>
                    <td className="text-muted text-sm">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Officers Management
export function OfficersPage() {
  const [officers, setOfficers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState({ fullName: '', dob: '', email: '' });
  const [addLoading, setAddLoading] = useState(false);

  const load = () => {
    setLoading(true);
    adminAPI.getAllOfficers().then(r => setOfficers(r.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault(); setAddLoading(true);
    try {
      await adminAPI.addOfficer(addForm);
      toast.success('Officer created! Login credentials sent via email.');
      setShowAdd(false); setAddForm({ fullName: '', dob: '', email: '' }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add officer'); }
    finally { setAddLoading(false); }
  };

  const handleSuspend = async (officerId) => {
    if (!window.confirm('Suspend this officer? They will be immediately logged out.')) return;
    try { await adminAPI.removeOfficer(officerId); toast.success('Officer suspended'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReactivate = async (officerId) => {
    try { await adminAPI.reactivateOfficer(officerId); toast.success('Officer reactivated'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleResendOtp = async (officerId) => {
    try { await adminAPI.resendOfficerOtp(officerId); toast.success('OTP resent to officer email'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to resend OTP'); }
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <PageHeader
        title="Compliance Officers"
        subtitle="Add and manage compliance officers"
        action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Officer</button>}
      />

      <div className="card">
        {loading ? <LoadingPage /> : officers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◈</div>
            <p>No compliance officers yet. Click "Add Officer" to create one.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Officer ID</th><th>Name</th><th>Email</th><th>DOB</th>
                  <th>Status</th><th>First Login</th><th>Added On</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.map(o => (
                  <tr key={o.email}>
                    <td><span className="font-mono text-sm">{o.officerId || '—'}</span></td>
                    <td className="fw-600">{o.fullName}</td>
                    <td className="text-sm">{o.email}</td>
                    <td className="text-sm text-muted">{o.dob}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      {o.firstLogin
                        ? <span className="badge badge-warning">Pending</span>
                        : <span className="badge badge-success">Done ✓</span>}
                    </td>
                    <td className="text-muted text-sm">{fmtDate(o.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {o.firstLogin && (
                          <button className="btn btn-sm"
                            style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', fontSize: 12 }}
                            onClick={() => handleResendOtp(o.officerId)}>
                            Resend OTP
                          </button>
                        )}
                        {o.status === 'APPROVED' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleSuspend(o.officerId)}>Suspend</button>
                        )}
                        {o.status === 'SUSPENDED' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleReactivate(o.officerId)}>Reactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Officer Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>Add Compliance Officer</h3>

              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="e.g. Priya Nair"
                    value={addForm.fullName}
                    onChange={e => setAddForm({ ...addForm, fullName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={addForm.dob}
                    onChange={e => setAddForm({ ...addForm, dob: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Email</label>
                  <input className="form-input" type="email" placeholder="officer@company.com"
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })} required />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? <span className="spinner" /> : 'Create Officer & Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
