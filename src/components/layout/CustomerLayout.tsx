import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';
import { claimsApi } from '../../services/claimsApi';
import type { Claim } from '../../types/claim';
import { Badge } from '../ui/Badge';
import { LogOut, Plus, ChevronDown, ChevronRight, Sun, Moon } from 'lucide-react';
import { TopBar } from './TopBar';
import { useGSAP, animateFadeIn, animateStagger } from '../../lib/gsap';

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [claims, setClaims] = useState<Claim[]>([]);
  const homeRef = useRef<HTMLDivElement>(null);

  const isHome = location.pathname === '/customer';
  const [claimsMinimized, setClaimsMinimized] = useState(false);

  useEffect(() => {
    claimsApi.getClaims().then(setClaims);
  }, []);

  useGSAP(() => {
    if (isHome) {
      animateFadeIn('.customer-home-brand', { y: 12, duration: 0.4 });
      animateFadeIn('.customer-home-title', { y: 10, delay: 0.05 });
      animateStagger('.customer-quick-card', { stagger: 0.06, y: 10, delay: 0.1 });
    }
  }, { scope: homeRef, dependencies: [isHome] });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (status === 'Approved') return 'success';
    if (status === 'Flagged' || status === 'Rejected') return 'danger';
    return 'warning';
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 72px)', overflow: 'hidden', position: 'relative' }}>
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="sidebar-header">
            <span className="sidebar-title">
              Dashboard
            </span>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="btn-ghost"
              style={{ padding: '0.25rem', display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* New Claim button */}
          <div className="sidebar-actions">
            <Link to="/customer/new-claim" className="sidebar-nav-btn">
              <Plus size={14} />
              New Claim
            </Link>
          </div>

          {/* Past claims list */}
          <div className="sidebar-claims">
            <div
              className="sidebar-section-header"
              onClick={() => setClaimsMinimized(!claimsMinimized)}
            >
              <p className="sidebar-section-label">
                Past Claims
              </p>
              {claimsMinimized ? <ChevronRight size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
            </div>

            {!claimsMinimized && (
              <div className="sidebar-claims-list">
                {claims.length === 0 ? (
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    padding: '0.5rem 1.25rem',
                  }}>
                    No claims yet.
                  </p>
                ) : (
                  claims.map(claim => {
                    const isActive = location.pathname === `/customer/claims/${claim.id}`;
                    return (
                      <Link
                        key={claim.id}
                        to={`/customer/claims/${claim.id}`}
                        className={`sidebar-claim-link ${isActive ? 'active' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span className="sidebar-claim-id">
                            {claim.id}
                          </span>
                          <Badge variant={getBadgeVariant(claim.status)}>{claim.status}</Badge>
                        </div>
                        <p className="sidebar-claim-vehicle">
                          {claim.vehicle}
                        </p>
                        <p className="sidebar-claim-date">
                          {new Date(claim.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* User footer */}
          <div className="sidebar-footer">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p className="sidebar-user-name">
                {user?.name}
              </p>
              <p className="sidebar-user-role">Personal Account</p>
            </div>
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              className="btn-ghost"
              style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              {theme === 'dark'
                ? <Sun size={15} style={{ color: 'var(--text-secondary)' }} />
                : <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
              }
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflowY: 'auto', height: '100%', minWidth: 0 }}>
          {isHome ? (
            /* Home state — centered CTA like Claude new chat */
            <div ref={homeRef} className="customer-home">
              <div className="customer-home-inner">
                <div className="customer-home-brand">
                  ClaimPilot AI
                </div>
                <h1 className="customer-home-title" style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                }}>
                  How can we help?
                </h1>
                <p style={{
                  fontSize: '0.9375rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '2.5rem',
                  lineHeight: 1.6,
                }}>
                  File a new insurance claim or select one from the sidebar to check its status.
                </p>

                <Link
                  to="/customer/new-claim"
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9375rem',
                  }}
                >
                  <Plus size={16} />
                  File a New Claim
                </Link>

                {/* Quick feature list */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.75rem',
                  marginTop: '3rem',
                }}>
                  {[
                    { label: 'Collision', sub: 'Accident damage' },
                    { label: 'Theft', sub: 'Vehicle theft' },
                    { label: 'Natural Event', sub: 'Flood, fire, etc.' },
                  ].map(item => (
                    <Link
                      key={item.label}
                      to="/customer/new-claim"
                      className="interactive-card customer-quick-card"
                      style={{
                        padding: '1.5rem',
                        textAlign: 'left',
                        textDecoration: 'none',
                      }}
                    >
                      <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.sub}</p>
                    </Link>
                  ))}
                </div>

              </div>
            </div>
          ) : (
            <div className="customer-content">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};


