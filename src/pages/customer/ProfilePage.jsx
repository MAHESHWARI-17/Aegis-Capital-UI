import React, { useState, useEffect } from 'react';
import { accountAPI } from '../../services/api';
import { DashboardLayout, CustomerSidebar, PageHeader, StatusBadge, Amount, LoadingPage } from '../../components/shared.jsx';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(v || 0);

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountAPI.getProfile().then(r => setProfile(r.data.data)).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout sidebar={<CustomerSidebar />}>
      <PageHeader title="My Profile" subtitle="Your account details" />
      {loading ? <LoadingPage /> : profile && (
        <div className="grid-2">
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3 className="section-title">Personal Details</h3></div>
              <div className="card-body">
                {[
                  ['Customer ID', profile.customerId, true],
                  ['Full Name', profile.fullName],
                  ['Date of Birth', profile.dob],
                  ['PAN Number', profile.panNumber, true],
                  ['Aadhaar', profile.aadhaarMasked, true],
                  ['Phone', profile.phoneNumber],
                  ['Email', profile.email],
                  ['Address', profile.address],
                ].map(([k, v, mono]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--slate-mid)', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, minWidth: 110 }}>{k}</span>
                    <span style={{ fontWeight: 600, fontSize: 14, textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Status</span>
                  <StatusBadge status={profile.status} />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="card">
              <div className="card-header"><h3 className="section-title">Accounts</h3></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {profile.accounts?.map(acc => (
                  <div key={acc.accountNumber} style={{ background: 'var(--slate)', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{acc.accountType}</span>
                      <StatusBadge status={acc.status} />
                    </div>
                    <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{acc.accountNumber}</p>
                    <Amount value={acc.balance} size="lg" />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>PIN {acc.pinSet ? 'configured ✓' : 'not set ✗'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
