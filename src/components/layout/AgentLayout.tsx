import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { LogOut } from 'lucide-react';

export const AgentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-base)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div className="container flex items-center justify-between" style={{ height: '48px' }}>
          {/* Wordmark */}
          <span style={{
            fontWeight: 700,
            fontSize: '0.9375rem',
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}>
            ClaimPilot
          </span>

          {/* Nav links */}
          <nav className="flex items-center gap-xl" style={{ height: '100%' }}>
            <NavLink
              to="/agent"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/agent/claims"
              className={({ isActive }) => `nav-link ${isActive || location.pathname.startsWith('/agent/claims') ? 'active' : ''}`}
            >
              All Claims
            </NavLink>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-md">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.name}</span>
            <button
              onClick={handleLogout}
              style={{
                color: 'var(--text-secondary)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-md)',
                transition: 'color 0.12s',
              }}
              title="Sign out"
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};


