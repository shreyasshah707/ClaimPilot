import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { claimsApi } from '../../services/claimsApi';
import type { Claim } from '../../types/claim';
import { Badge } from '../ui/Badge';
import { LogOut, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { TopBar } from './TopBar';

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [claims, setClaims] = useState<Claim[]>([]);

  const isHome = location.pathname === '/customer';
  // If not home, minimize claims list by default
  const [claimsMinimized, setClaimsMinimized] = useState(!isHome);

  // Auto-minimize when navigating away from home
  useEffect(() => {
    setClaimsMinimized(!isHome);
  }, [isHome]);

  useEffect(() => {
    claimsApi.getClaims().then(setClaims);
  }, []);

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: '260px',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          height: '100%',
          overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{
            padding: '1.125rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: 'var(--font-logo)',
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}>
              Dashboard
            </span>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                color: 'var(--text-secondary)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-md)',
                transition: 'color 0.12s',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* New Claim button */}
          <div style={{ padding: '1rem 0.875rem', borderBottom: '1px solid var(--border)' }}>
            <Link
              to="/customer/new-claim"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.5625rem 0.875rem',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                textDecoration: 'none',
                transition: 'background-color 0.12s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--accent-hover)')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--accent)')}
            >
              <Plus size={14} />
              New Claim
            </Link>
          </div>

          {/* Past claims list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 1.25rem 0.375rem',
                cursor: 'pointer'
              }}
              onClick={() => setClaimsMinimized(!claimsMinimized)}
            >
              <p style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}>
                Past Claims
              </p>
              {claimsMinimized ? <ChevronRight size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
            </div>

            {!claimsMinimized && (
              claims.length === 0 ? (
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
                      style={{
                        display: 'block',
                        padding: '0.5625rem 1.25rem',
                        textDecoration: 'none',
                        backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                        transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--bg-hover)';
                      }}
                      onMouseLeave={e => {
                        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6875rem',
                          color: 'var(--text-secondary)',
                          letterSpacing: '0.02em',
                        }}>
                          {claim.id}
                        </span>
                        <Badge variant={getBadgeVariant(claim.status)}>{claim.status}</Badge>
                      </div>
                      <p style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {claim.vehicle}
                      </p>
                      <p style={{
                        fontSize: '0.6875rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.125rem',
                      }}>
                        {new Date(claim.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </Link>
                  );
                })
              ))}
          </div>

          {/* User footer */}
          <div style={{
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-active)',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Personal Account</p>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
          {isHome ? (
            /* Home state — centered CTA like Claude new chat */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              padding: '2rem',
            }}>
              <div style={{ width: '100%', maxWidth: '560px', textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-logo)',
                  fontSize: '3.5rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  letterSpacing: '-0.05em'
                }}>
                  ClaimPilot AI
                </div>
                <h1 style={{
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
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--text-inverse)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    textDecoration: 'none',
                    transition: 'background-color 0.12s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--accent-hover)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--accent)')}
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
                    { label: 'Own Damage', sub: 'Flood, fire, etc.' },
                  ].map(item => (
                    <Link
                    key={item.label}
                    to="/customer/new-claim"
                    style={{
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-xl)',
                      backgroundColor: 'var(--bg-surface)',
                      textAlign: 'left',
                      textDecoration: 'none',
                      boxShadow: 'var(--shadow-md)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.transform = 'translateY(-4px)';
                      el.style.boxShadow = 'var(--shadow-xl)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.transform = 'translateY(0)';
                      el.style.boxShadow = 'var(--shadow-md)';
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
            <div style={{ padding: '2rem 3rem', maxWidth: '900px' }}>
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};


