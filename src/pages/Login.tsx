import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../store/authStore';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  
  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();

  // Utility to check password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: 'Weak', color: 'var(--danger)', width: '33%' };
    if (score === 2 || score === 3) return { label: 'Medium', color: 'var(--warning)', width: '66%' };
    return { label: 'Strong', color: 'var(--success)', width: '100%' };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Email Validation (simple regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password Validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      // Name Validation
      if (!name.trim()) {
        newErrors.name = 'Full name is required';
      }
      
      // DOB Validation
      if (!dob) {
        newErrors.dob = 'Date of birth is required';
      } else {
        const birthDate = new Date(dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge < 18) {
          newErrors.dob = 'You must be 18 or older to register';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Proceed with Mock Auth
    authStore.login(email, name || 'Demo User');
    const role = authStore.getUser()?.role;

    if (role === 'agent') {
      navigate('/agent');
    } else {
      navigate('/customer');
    }
  };
  
  const strength = getPasswordStrength(password);

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
          maxWidth: '380px',
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              marginBottom: '0.375rem',
            }}>
              {isSignUp ? 'Create an account' : 'Sign in to your account'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {isSignUp 
                ? 'Enter your details below to register.' 
                : 'Enter your credentials to access the operations portal.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isSignUp && (
              <>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '0.375rem' }}>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if(errors.name) setErrors({...errors, name: ''}); }}
                    placeholder="John Doe"
                    style={{ borderColor: errors.name ? 'var(--danger)' : undefined }}
                  />
                  {errors.name && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name}</p>}
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '0.375rem' }}>Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => { setDob(e.target.value); if(errors.dob) setErrors({...errors, dob: ''}); }}
                    style={{ borderColor: errors.dob ? 'var(--danger)' : undefined, color: dob ? 'inherit' : 'var(--text-muted)' }}
                  />
                  {errors.dob && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.dob}</p>}
                </div>
              </>
            )}

            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '0.375rem' }}>Email address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''}); }}
                placeholder="agent@claimpilot.ai"
                style={{ borderColor: errors.email ? 'var(--danger)' : undefined }}
              />
              {errors.email && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email}</p>}
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '0.375rem' }}>Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: ''}); }}
                placeholder="••••••••"
                style={{ borderColor: errors.password ? 'var(--danger)' : undefined }}
              />
              {errors.password && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password}</p>}
              
              {isSignUp && password.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Password strength</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: strength.width, 
                      backgroundColor: strength.color, 
                      height: '100%',
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontWeight: 600 }}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px'
                }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {!isSignUp && (
            <div style={{
              marginTop: '2rem',
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
          )}
        </div>
      </div>
    </div>
  );
};
