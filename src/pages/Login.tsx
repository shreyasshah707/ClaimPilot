import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../store/authStore';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    authStore.login(email, 'Demo User');
    const role = authStore.getUser()?.role;

    if (role === 'agent') {
      navigate('/agent');
    } else {
      navigate('/customer');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-base)',
    }}>
      {/* Left Column — Branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '3rem',
        borderRight: '1px solid var(--border)',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              lineHeight: 1,
              marginBottom: '0.75rem',
            }}>
              ClaimPilot
            </h1>
            <p style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              letterSpacing: '-0.01em',
            }}>
              Claims Operations Platform
            </p>
          </div>

          <div style={{
            borderLeft: '1px solid var(--border)',
            paddingLeft: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            {[
              'AI-POWERED DAMAGE ANALYSIS',
              'REAL-TIME FRAUD DETECTION',
              'POLICY LIFECYCLE MANAGEMENT',
            ].map((feature) => (
              <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.06em',
                }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border)',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
            SYSTEM STATUS: <span style={{ color: 'var(--accent)' }}>OPERATIONAL</span>
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-secondary)', opacity: 0.5, marginTop: '0.25rem' }}>
            SECURE CONNECTION ESTABLISHED
          </p>
        </div>
      </div>

      {/* Right Column — Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '360px',
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              marginBottom: '0.375rem',
            }}>
              Sign in to your account
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Enter your credentials to access the operations portal.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@claimpilot.ai"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.625rem' }}
            >
              Sign In
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              color: 'var(--text-secondary)',
              letterSpacing: '0.01em',
              marginBottom: '0.375rem',
            }}>
              DEMO CREDENTIALS
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Agent: <span style={{ color: 'var(--text-primary)' }}>agent@claimpilot.ai</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Customer: <span style={{ color: 'var(--text-primary)' }}>any other email</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


