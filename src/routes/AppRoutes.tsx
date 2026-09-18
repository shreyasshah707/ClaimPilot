import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { useAuth } from '../store/authStore';

import { CustomerLayout } from '../components/layout/CustomerLayout';
import { AgentLayout } from '../components/layout/AgentLayout';

import { CustomerDashboard } from '../pages/customer/CustomerDashboard';
import {  NewClaim  } from '../pages/customer/NewClaim';
import {  ClaimAnalysis  } from '../pages/customer/ClaimAnalysis';
import { MyClaims } from '../pages/customer/MyClaims';
import { ClaimApproved } from '../pages/customer/ClaimApproved';

import { AgentDashboard } from '../pages/agent/AgentDashboard';
import {  AgentClaims  } from '../pages/agent/AgentClaims';
import {  AgentClaimDetails  } from '../pages/agent/AgentClaimDetails';
import { AgentClientResponse } from '../pages/agent/AgentClientResponse';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'customer' | 'agent' }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'agent' ? '/agent' : '/customer'} replace />;
  }
  
  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<Login />} />
        
        {/* Customer Portal */}
        <Route path="/customer" element={
          <ProtectedRoute allowedRole="customer">
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<CustomerDashboard />} />
          <Route path="claims" element={<MyClaims />} />
          <Route path="new-claim" element={<NewClaim />} />
          <Route path="claims/:id" element={<ClaimAnalysis />} />
        </Route>
        
        {/* Agent Portal */}
        <Route path="/agent" element={
          <ProtectedRoute allowedRole="agent">
            <AgentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AgentDashboard />} />
          <Route path="claims" element={<AgentClaims />} />
          <Route path="claims/:id" element={<AgentClaimDetails />} />
          <Route path="claims/:id/response" element={<AgentClientResponse />} />
        </Route>
        
        <Route path="/claim-response/:id" element={<ClaimApproved />} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
