import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';
import { LogOut, Sun, Moon, RotateCcw } from 'lucide-react';
import { resetClaims } from '../../services/claimsApi';
import '../../agent.css';

export const AgentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReset = () => {
    resetClaims();
    window.location.reload();
  };

  return (
    <div className="agent-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)' }}>
      <header className="app-header">
        <div className="container flex items-center justify-between app-header-inner">
          {/* Wordmark */}
          <span className="app-wordmark">
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
            <span className="text-sm text-muted">{user?.name}</span>
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              className="btn-ghost"
              style={{ padding: '0.25rem', display: 'flex', alignItems: 'center' }}
            >
              {theme === 'dark'
                ? <Sun size={15} style={{ color: 'var(--text-secondary)' }} />
                : <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
              }
            </button>
            <button
              onClick={handleReset}
              className="btn-ghost"
              style={{ padding: '0.25rem', display: 'flex', alignItems: 'center' }}
              title="Reset demo data"
            >
              <RotateCcw size={15} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <button
              onClick={handleLogout}
              className="btn-ghost"
              style={{ padding: '0.25rem' }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};


