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
  hsrpNumber?: string;
  driverLicenseNumber?: string;
  driverLicensePhoto?: string;
  submittedAt: string;
  status: ClaimStatus;
  images: string[];
  video?: string;
  videos?: string[];
  fraudRisk: 'Low' | 'Medium' | 'High';
  engineerEstimate?: number;
  approvedAmount?: number;
  rejectionReason?: string;
  requestInfoReason?: string;
  reviewedByAgent?: boolean;
  reviewedAt?: string;
  agentAction?: 'Approved' | 'Rejected' | 'More Info Requested';
}
