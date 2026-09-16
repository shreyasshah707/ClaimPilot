import { Claim } from '../types/claim';
import { mockClaims } from '../mock/claims';
import { authStore } from '../store/authStore';

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
    const currentUser = authStore.getUser();
    const newClaim: Claim = {
      id: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: currentUser?.id || 'current-user',
      customerName: currentUser?.name || claimData.customerName || 'Current User',
      customerPhone: currentUser?.phone || claimData.customerPhone || '+91 98765 43210',
      policyNumber: claimData.policyNumber || '',
      vehicle: claimData.vehicle || '',
      claimType: claimData.claimType || 'Other',
      incidentDate: claimData.incidentDate || new Date().toISOString(),
      location: claimData.location || '',
      description: claimData.description || '',
      engineNumber: claimData.engineNumber,
      chassisNumber: claimData.chassisNumber,
      hsrpNumber: claimData.hsrpNumber,
      driverLicenseNumber: claimData.driverLicenseNumber,
      driverLicenseFrontPhoto: claimData.driverLicenseFrontPhoto,
      driverLicenseBackPhoto: claimData.driverLicenseBackPhoto,
      submittedAt: new Date().toISOString(),
      status: 'Under Review',
      images: claimData.images || [],
      video: claimData.video || (claimData.videos && claimData.videos.length > 0 ? claimData.videos[0] : undefined),
      videos: claimData.videos || (claimData.video ? [claimData.video] : []),
      fraudRisk: 'Low'
    };
    mockClaims.unshift(newClaim);
    return newClaim;
  },
  
  updateClaimStatus: async (id: string, status: Claim['status'], additionalData?: Partial<Claim>): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const claim = mockClaims.find(c => c.id === id);
    if (claim) {
      claim.status = status;
      if (additionalData) {
        Object.assign(claim, additionalData);
      }
    }
  }
};
