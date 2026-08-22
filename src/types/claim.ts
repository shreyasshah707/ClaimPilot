export type ClaimStatus = 'Pending Review' | 'Under Review' | 'AI Assessment' | 'Agent Review' | 'Decision Pending' | 'Approved' | 'Flagged' | 'Rejected';

export interface Claim {
  id: string;
  customerId: string;
  customerName: string;
  policyNumber: string;
  customerPhone: string;
  vehicle: string;
  claimType: string;
  incidentDate: string;
  location: string;
  description: string;
  engineNumber?: string;
  chassisNumber?: string;
  submittedAt: string;
  status: ClaimStatus;
  images: string[];
  fraudRisk: 'Low' | 'Medium' | 'High';
}
