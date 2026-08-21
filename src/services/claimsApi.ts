import {  Claim  } from '../types/claim';
import {  mockClaims  } from '../mock/claims';

export const claimsApi = {
  getClaims: async (): Promise<Claim[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockClaims;
  },

  getClaimById: async (id: string): Promise<Claim | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockClaims.find(c => c.id === id);
  },

  createClaim: async (claimData: Partial<Claim>): Promise<Claim> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newClaim: Claim = {
      id: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: 'current-user',
      customerName: 'Current User',
      customerPhone: '',
      policyNumber: '',
      vehicle: claimData.vehicle || '',
      claimType: claimData.claimType || 'Other',
      incidentDate: claimData.incidentDate || new Date().toISOString(),
      location: claimData.location || '',
      description: claimData.description || '',
      submittedAt: new Date().toISOString(),
      status: 'Under Review',
      images: claimData.images || [],
      fraudRisk: 'Low'
    };
    mockClaims.unshift(newClaim);
    return newClaim;
  },
  
  updateClaimStatus: async (id: string, status: Claim['status']): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const claim = mockClaims.find(c => c.id === id);
    if (claim) claim.status = status;
  }
};
