import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/shared.jsx';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #112240 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center',
    }}>
      <div style={{ maxWidth: 480 }}>
        <Link to="/"><Logo /></Link>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 120, lineHeight: 1, color: 'rgba(255,255,255,0.05)', marginTop: 32, userSelect: 'none' }}>404</div>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'white', marginTop: -16, marginBottom: 12 }}>Page Not Found</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
          This page doesn't exist or you don't have permission to access it.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '12px 24px' }}>← Go Back</button>
        </div>
      </div>
    </div>
  );
}
