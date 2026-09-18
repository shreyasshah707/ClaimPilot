import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { claimsApi } from '../../services/claimsApi';
import type { Claim } from '../../types/claim';
import { CheckCircle, XCircle, Edit2, Save, X, Phone, Mail } from 'lucide-react';
import { gsap } from 'gsap';
import './ClaimApproved.css';

export const ClaimApproved = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  // Flow State
  const [modalState, setModalState] = useState<'hidden' | 'loading' | 'success_approve' | 'success_reject' | 'success_contact'>('hidden');

  // Contact State
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [contactError, setContactError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      claimsApi.getClaimById(id).then(data => {
        setClaim(data || null);
        if (data) {
          setEditEmail(data.clientContactEmail || data.customerName.toLowerCase().replace(' ', '.') + '@example.com');
          setEditPhone(data.clientContactPhone || data.customerPhone);
        }
        setLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    if (modalState !== 'hidden' && modalContentRef.current) {
      gsap.fromTo(modalContentRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' }
      );
    }
  }, [modalState]);

  useEffect(() => {
    if ((modalState === 'success_approve' || modalState === 'success_reject' || modalState === 'success_contact') && iconRef.current) {
      gsap.fromTo(iconRef.current,
        { scale: 0, rotation: -90 },
        { scale: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)', delay: 0.1 }
      );

      const timer = setTimeout(() => {
        if (modalContentRef.current) {
          gsap.to(modalContentRef.current, {
            opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in',
            onComplete: () => setModalState('hidden')
          });
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [modalState]);


  const handleApprove = async () => {
    if (!claim) return;
    setModalState('loading');
    await claimsApi.updateClientResponse(claim.id, 'Approved by Client');
    const updated = await claimsApi.getClaimById(claim.id);
    setClaim(updated || null);
    setModalState('success_approve');
  };

  const handleReject = async () => {
    if (!claim) return;
    setModalState('loading');
    await claimsApi.updateClientResponse(claim.id, 'Rejected by Client');
    const updated = await claimsApi.getClaimById(claim.id);
    setClaim(updated || null);
    setModalState('success_reject');
  };

  const handleSaveContact = async () => {
    if (!claim) return;
    if (!editEmail.includes('@') || editPhone.length < 10) {
      setContactError('Please enter a valid email and phone number.');
      return;
    }
    setContactError('');
    setModalState('loading');
    await claimsApi.updateClientResponse(claim.id, claim.clientResponse as 'Approved by Client' | 'Rejected by Client', undefined, {
      email: editEmail,
      phone: editPhone
    });
    const updated = await claimsApi.getClaimById(claim.id);
    setClaim(updated || null);
    setIsEditingContact(false);
    setModalState('success_contact');
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  if (!claim) return <div style={{ padding: '4rem', textAlign: 'center' }}>Claim not found or invalid link.</div>;

  const isResponded = claim.clientResponse === 'Approved by Client' || claim.clientResponse === 'Rejected by Client';
  const showContactEdit = isResponded;

  return (
    <div className="claim-approved-page">
      {/* Header */}
      <header className="ca-header">
        <div className="ca-brand">
          ClaimPilot
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Secure Response Portal
        </div>
      </header>

      {/* Main Content */}
      <main className="ca-content-wrapper">
        <div className="ca-content">

          <div className="ca-title-section">
            <h1 className="ca-title">
              {isResponded ? 'Response Recorded' : claim.status === 'Approved' ? 'Claim Approved' : 'Claim Response'}
            </h1>
            <p className="ca-subtitle">Claim Reference: {claim.id}</p>
          </div>

          {/* Response Banner (if responded) */}
          {isResponded && (
            <div className={`ca-status-banner ${claim.clientResponse === 'Approved by Client' ? 'ca-status-approved' : 'ca-status-rejected'}`}>
              {claim.clientResponse === 'Approved by Client' ? <CheckCircle size={24} /> : <XCircle size={24} />}
              <div>
                <div>{claim.clientResponse}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.8 }}>
                  Recorded on {claim.clientResponseTimestamp ? new Date(claim.clientResponseTimestamp).toLocaleDateString() : 'recently'}
                </div>
              </div>
            </div>
          )}

          {/* Settlement Card (if not rejected) */}
          {(!isResponded || claim.clientResponse === 'Approved by Client') && claim.approvedAmount && (
            <div className="ca-settlement-card">
              <div className="ca-settlement-label">Approved Settlement Amount</div>
              <div className="ca-settlement-amount">₹{claim.approvedAmount.toLocaleString()}</div>
            </div>
          )}

          {/* Action Buttons (if awaiting response) */}
          {!isResponded && claim.status === 'Approved' && (
            <div className="ca-actions">
              <button className="ca-btn-approve" onClick={handleApprove}>
                <CheckCircle size={20} /> Approve Settlement
              </button>
              <button className="ca-btn-reject" onClick={handleReject}>
                <XCircle size={20} /> Reject Settlement
              </button>
            </div>
          )}

          {/* Claim Details */}
          <div className="ca-card">
            <h3 className="ca-section-title">Claim Details</h3>
            <div className="ca-details-grid">
              <div className="ca-detail-item">
                <span className="ca-detail-label">Vehicle</span>
                <span className="ca-detail-value">{claim.vehicle}</span>
              </div>
              <div className="ca-detail-item">
                <span className="ca-detail-label">Incident Date</span>
                <span className="ca-detail-value">{new Date(claim.incidentDate).toLocaleDateString()}</span>
              </div>
              <div className="ca-detail-item">
                <span className="ca-detail-label">Claim Type</span>
                <span className="ca-detail-value">{claim.claimType}</span>
              </div>
              <div className="ca-detail-item">
                <span className="ca-detail-label">Status</span>
                <span className="ca-detail-value">{claim.status}</span>
              </div>
            </div>
          </div>

          {/* Justification */}
          {claim.status === 'Approved' && (
            <div>
              <h3 className="ca-section-title">Reason for approved claim amount</h3>
              <div className="ca-agent-justification">
                {claim.approveReason ? claim.approveReason : 'The settlement amount has been approved based on the AI damage assessment and verified repair estimates.'}
                {claim.engineerEstimate ? ` Engineer estimate: ₹${claim.engineerEstimate.toLocaleString()}.` : ''}
              </div>
            </div>
          )}

          {claim.status === 'Rejected' && claim.rejectionReason && (
            <div>
              <h3 className="ca-section-title" style={{ color: 'var(--danger)' }}>Rejection Reason</h3>
              <div className="ca-agent-justification" style={{ borderLeftColor: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                {claim.rejectionReason}
              </div>
            </div>
          )}

          {/* Contact Details (if responded) */}
          {showContactEdit && (
            <div className="ca-card" style={{ borderColor: claim.clientResponse === 'Rejected by Client' ? 'var(--accent)' : 'var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="ca-section-title" style={{ marginBottom: 0 }}>
                  Your Contact Details for Claim Communication
                </h3>
                {!isEditingContact && (
                  <button className="ca-edit-btn" onClick={() => setIsEditingContact(true)}>
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                These contact details are used for communication regarding this claim only. Updating them does not change your registered account email address or phone number.
              </div>

              <div className="ca-contact-edit">
                <div className="ca-contact-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                    <Mail size={16} /> Email
                  </div>
                  {isEditingContact ? (
                    <input type="email" className="ca-contact-input" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                  ) : (
                    <div style={{ fontWeight: 500 }}>{editEmail}</div>
                  )}
                </div>
                <div className="ca-contact-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                    <Phone size={16} /> Phone
                  </div>
                  {isEditingContact ? (
                    <input type="tel" className="ca-contact-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                  ) : (
                    <div style={{ fontWeight: 500 }}>{editPhone}</div>
                  )}
                </div>
              </div>

              {contactError && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '1rem' }}>{contactError}</div>}

              {isEditingContact && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                  <button className="ca-edit-btn" style={{ color: 'var(--text-secondary)' }} onClick={() => {
                    setIsEditingContact(false);
                    setEditEmail(claim.clientContactEmail || '');
                    setEditPhone(claim.clientContactPhone || claim.customerPhone);
                    setContactError('');
                  }}>
                    <X size={16} /> Cancel
                  </button>
                  <button className="ca-edit-btn" style={{ backgroundColor: 'var(--success)', color: '#fff', padding: '0.5rem 1rem' }} onClick={handleSaveContact}>
                    <Save size={16} /> Save Details
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Assigned Agent Contact (if responded) */}
          {isResponded && (
            <div className="ca-card">
              <h3 className="ca-section-title">Assigned Agent</h3>
              <div className="ca-details-grid">
                <div className="ca-detail-item">
                  <span className="ca-detail-label">Name</span>
                  <span className="ca-detail-value">Aman Verma</span>
                </div>
                <div className="ca-detail-item">
                  <span className="ca-detail-label">Email</span>
                  <span className="ca-detail-value">aman.verma@claimpilot.com</span>
                </div>
                <div className="ca-detail-item">
                  <span className="ca-detail-label">Phone</span>
                  <span className="ca-detail-value">+91 1800 233 4455</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modals */}
      {modalState !== 'hidden' && (
        <div className="ca-modal-overlay" ref={modalRef}>
          <div className="ca-modal" ref={modalContentRef}>
            {modalState === 'loading' && (
              <>
                <div className="ca-spinner"></div>
                <div className="ca-modal-text">
                  Your response is being submitted. Please wait...
                </div>
              </>
            )}
            {modalState === 'success_approve' && (
              <>
                <div className="ca-success-icon" ref={iconRef}>
                  <CheckCircle size={40} />
                </div>
                <div className="ca-modal-text" style={{ fontWeight: 600 }}>
                  Your response has been submitted successfully.
                </div>
                <div className="ca-modal-text" style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                  Thank you for confirming your settlement amount. We will proceed with the next steps in your claim settlement process.
                </div>
              </>
            )}
            {modalState === 'success_reject' && (
              <>
                <div className="ca-success-icon" ref={iconRef}>
                  <CheckCircle size={40} />
                </div>
                <div className="ca-modal-text" style={{ fontWeight: 600 }}>
                  Your response has been submitted successfully.
                </div>
                <div className="ca-modal-text" style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                  Your assigned agent has been notified of your decision.
                </div>
              </>
            )}
            {modalState === 'success_contact' && (
              <>
                <div className="ca-success-icon" ref={iconRef}>
                  <CheckCircle size={40} />
                </div>
                <div className="ca-modal-text" style={{ fontWeight: 600 }}>
                  Your contact details have been updated successfully and shared with your assigned agent.
                </div>
                <div className="ca-modal-text" style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                  Your registered account email address and phone number remain unchanged.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
