import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
          backdropFilter: 'blur(2px)'
        }}
        onClick={onClose}
      />
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.5)',
          animation: 'slideIn 0.2s ease-out forwards'
        }}
      >
        <div className="flex justify-between items-center" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-medium" style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};
