import React from 'react';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}> = ({ children, variant = 'neutral', className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};
