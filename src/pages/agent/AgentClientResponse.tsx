import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { claimsApi } from '../../services/claimsApi';
import type { Claim } from '../../types/claim';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, IndianRupee, RefreshCcw } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { gsap } from 'gsap';
import './ClientResponses.css';

export const AgentClientResponse = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeSuccess, setFinanceSuccess] = useState(false);
  
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [reviseDecision, setReviseDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviseAmount, setReviseAmount] = useState('');
  const [reviseReason, setReviseReason] = useState('');
  const [reviseLoading, setReviseLoading] = useState(false);
  const [reviseSuccess, setReviseSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const reviseModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      claimsApi.getClaimById(id).then(data => {
        setClaim(data || null);
        if (data?.approvedAmount) {
          setReviseAmount(data.approvedAmount.toString());
        }
        setLoading(false);
      });
    }
  }, [id]);

  // Auto-refresh when client updates claim in another tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'claimpilot_mock_claims' && id) {
        claimsApi.getClaimById(id).then(data => {
          if (data) setClaim({ ...data });
        });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [id]);

  useEffect(() => {
    if (showFinanceModal && modalRef.current) {
      gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.95, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' });
    }
  }, [showFinanceModal]);

  useEffect(() => {
    if (showReviseModal && reviseModalRef.current) {
      gsap.fromTo(reviseModalRef.current, { opacity: 0, scale: 0.95, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.5)' });
    }
  }, [showReviseModal]);

  const handleFinanceProceed = async () => {
    if (!claim) return;
    setFinanceLoading(true);
    await claimsApi.updatePaymentStatus(claim.id, 'Forwarded to Finance');
    const updated = await claimsApi.getClaimById(claim.id);
    setClaim(updated || null);
    setFinanceLoading(false);
    setFinanceSuccess(true);
    setTimeout(() => {
      setFinanceSuccess(false);
      setShowFinanceModal(false);
    }, 3500);
  };

  const handleReviseDecision = async () => {
    if (!claim) return;
    setReviseLoading(true);
    
    // Changing the decision resets the client response state
    await claimsApi.updateClaimStatus(claim.id, reviseDecision, {
      agentAction: reviseDecision,
      approvedAmount: reviseDecision === 'Approved' ? Number(reviseAmount) : undefined,
      rejectionReason: reviseDecision === 'Rejected' ? reviseReason : undefined,
      clientResponse: 'Awaiting Response',
      paymentStatus: 'Not yet authorized'
    });
    
    const updated = await claimsApi.getClaimById(claim.id);
    setClaim(updated || null);
    setReviseLoading(false);
    setReviseSuccess(true);
    setTimeout(() => {
      setReviseSuccess(false);
      setShowReviseModal(false);
    }, 3500);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading workspace...</div>;
  if (!claim) return <div style={{ padding: '4rem', textAlign: 'center' }}>Claim not found.</div>;

  const canProceedToFinance = claim.agentAction === 'Approved' && 
                              claim.clientResponse === 'Approved by Client' && 
                              claim.paymentStatus === 'Not yet authorized';

  return (
    <div className="agent-response-workspace">
      <div className="arw-header">
        <div className="arw-title-area">
          <Link to="/agent/claims" className="btn-secondary btn-sm mt-1">
            <ArrowLeft size={16} />
          </Link>
          <div className="arw-claim-info">
            <h2>{claim.id} <Badge variant={claim.status === 'Approved' ? 'success' : claim.status === 'Rejected' ? 'danger' : 'warning'}>{claim.status}</Badge></h2>
            <p>Customer: {claim.customerName} • Vehicle: {claim.vehicle}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {claim.paymentStatus === 'Not yet authorized' && (
            <button className="btn-secondary" onClick={() => setShowReviseModal(true)}>
              <RefreshCcw size={16} /> Change Decision
            </button>
          )}
          {canProceedToFinance && (
            <button className="btn-success" onClick={() => setShowFinanceModal(true)}>
              OK to Proceed
            </button>
          )}
        </div>
      </div>

      <div className="arw-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="arw-card">
            <h3 className="arw-card-title"><FileText size={16} /> Original Agent Decision</h3>
            <div className="arw-status-box">
              <div className="arw-status-title">
                {claim.agentAction === 'Approved' ? 'Approved Settlement' : claim.agentAction === 'Rejected' ? 'Rejected Claim' : 'More Info Requested'}
              </div>
              {claim.agentAction === 'Approved' && claim.approvedAmount && (
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  ₹{claim.approvedAmount.toLocaleString()}
                </div>
              )}
              {claim.agentAction === 'Rejected' && claim.rejectionReason && (
                <div style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>
                  Reason: {claim.rejectionReason}
                </div>
              )}
              {claim.engineerEstimate && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Engineer Estimate: ₹{claim.engineerEstimate.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="arw-card">
            <h3 className="arw-card-title">Client Response</h3>
            
            <div className="arw-client-response" style={{ 
              borderColor: claim.clientResponse === 'Approved by Client' ? 'var(--success)' : 
                           claim.clientResponse === 'Rejected by Client' ? 'var(--danger)' : 'var(--border)' 
            }}>
              <div className="arw-cr-header">
                {claim.clientResponse === 'Approved by Client' && <CheckCircle color="var(--success)" />}
                {claim.clientResponse === 'Rejected by Client' && <XCircle color="var(--danger)" />}
                {claim.clientResponse === 'Awaiting Response' && <Clock color="var(--warning)" />}
                <span className="arw-cr-title" style={{ 
                  color: claim.clientResponse === 'Approved by Client' ? 'var(--success)' : 
                         claim.clientResponse === 'Rejected by Client' ? 'var(--danger)' : 'var(--warning)' 
                }}>
                  {claim.clientResponse || 'N/A'}
                </span>
                {claim.clientResponseTimestamp && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {new Date(claim.clientResponseTimestamp).toLocaleString()}
                  </span>
                )}
              </div>
              
              {claim.clientResponseExplanation && (
                <div className="arw-cr-content">
                  <strong>Client Explanation:</strong><br/>
                  {claim.clientResponseExplanation}
                </div>
              )}

              {(claim.clientContactEmail || claim.clientContactPhone) && (
                <div className="arw-contact-update">
                  <strong>Updated Contact Details Provided:</strong>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                    {claim.clientContactEmail && <div>Email: {claim.clientContactEmail}</div>}
                    {claim.clientContactPhone && <div>Phone: {claim.clientContactPhone}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="arw-card">
            <h3 className="arw-card-title"><IndianRupee size={16} /> Finance Status</h3>
            <div className="arw-details-list">
              <div className="arw-detail-row">
                <span className="arw-detail-label">Status</span>
                <Badge variant={
                  claim.paymentStatus === 'Forwarded to Finance' || claim.paymentStatus === 'Payment Processing' ? 'success' : 'neutral'
                }>
                  {claim.paymentStatus || 'Not applicable'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="arw-card">
            <h3 className="arw-card-title">Quick Links</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to={`/agent/claims/${claim.id}`} className="btn-secondary" style={{ justifyContent: 'center' }}>
                Open Full Claim Workspace
              </Link>
              <a href={`/claim-response/${claim.id}`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ justifyContent: 'center', border: '1px solid var(--border)' }}>
                View Client Portal (Demo)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Finance Authorization Modal */}
      {showFinanceModal && (
        <div className="arw-modal-overlay">
          <div className="arw-modal" ref={modalRef}>
            {!financeLoading && !financeSuccess && (
              <>
                <h3 className="arw-modal-title">Authorize Payment</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
                  You are about to forward claim <strong>{claim.id}</strong> to the finance department for payment processing.
                </p>
                <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Approved Amount:</span>
                  <strong style={{ color: 'var(--success)' }}>₹{claim.approvedAmount?.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowFinanceModal(false)}>Cancel</button>
                  <button className="btn-success" onClick={handleFinanceProceed}>Confirm & Proceed</button>
                </div>
              </>
            )}
            {financeLoading && (
              <div style={{ padding: '2rem 0' }}>
                <div className="ca-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                <p>Submitting to Finance...</p>
              </div>
            )}
            {financeSuccess && (
              <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', color: 'var(--success)', fontWeight: 'bold' }}>
                  <CheckCircle size={32} /> Successfully Forwarded to Finance
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revise Decision Modal */}
      {showReviseModal && (
        <div className="arw-modal-overlay">
          <div className="arw-modal" ref={reviseModalRef} style={{ textAlign: 'left', width: '500px' }}>
            {!reviseLoading && !reviseSuccess && (
              <>
                <h3 className="arw-modal-title" style={{ textAlign: 'center' }}>Change Decision</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  Changing your decision will invalidate the client's previous response and notify them to review the updated claim status.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>New Decision</label>
                  <select 
                    className="form-input" 
                    value={reviseDecision} 
                    onChange={(e) => setReviseDecision(e.target.value as 'Approved' | 'Rejected')}
                    style={{ width: '100%', padding: '0.5rem' }}
                  >
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {reviseDecision === 'Approved' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Revised Approved Amount (₹)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      className="form-input" 
                      value={reviseAmount} 
                      onChange={(e) => {
                        // Only allow positive digits
                        const val = e.target.value.replace(/\D/g, '');
                        setReviseAmount(val);
                      }}
                      style={{ width: '100%', padding: '0.5rem' }}
                    />
                  </div>
                )}

                {reviseDecision === 'Rejected' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Rejection Reason</label>
                    <textarea 
                      className="form-input" 
                      value={reviseReason} 
                      onChange={(e) => setReviseReason(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowReviseModal(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleReviseDecision} disabled={reviseDecision === 'Approved' && !reviseAmount}>
                    Update Decision
                  </button>
                </div>
              </>
            )}
            {reviseLoading && (
              <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                <div className="ca-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                <p>Updating decision...</p>
              </div>
            )}
            {reviseSuccess && (
              <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--success)', fontWeight: 'bold' }}>
                  <CheckCircle size={32} /> Decision Updated Successfully
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  The client has been notified of the revised decision.
                </p>
                <div className="arw-email-preview" style={{ textAlign: 'left', marginTop: '1rem' }}>
                  <strong>Subject: Update on Your Claim Status ({claim.id})</strong><br/><br/>
                  Dear {claim.customerName},<br/><br/>
                  Your assigned agent has updated the decision on your recent claim.<br/>
                  Please visit your secure portal to review the updated details and provide your response.<br/><br/>
                  <a href={`/claim-response/${claim.id}`}>Review Updated Claim</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
