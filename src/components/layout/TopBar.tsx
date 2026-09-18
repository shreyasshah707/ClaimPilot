import React from 'react';
import { Link } from 'react-router-dom';
import { resetClaims } from '../../services/claimsApi';

export const TopBar: React.FC = () => {
  const handleReset = () => {
    resetClaims();
    window.location.reload();
  };

  return (
    <div className="topbar">
      {/* Logo */}
      <span className="topbar-logo" style={{ flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--accent)" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ClaimPilot AI
      </span>

      {/* Home link — centred */}
      <nav style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <Link to="/customer" className="topbar-nav-btn">
          Home
        </Link>
      </nav>

      {/* Reset demo data button */}
      <button
        onClick={handleReset}
        style={{
          flexShrink: 0,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'var(--text-secondary)',
          padding: '0.35rem 0.75rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          cursor: 'pointer',
        }}
      >
        Reset Demo Data
      </button>
    </div>
  );
};
