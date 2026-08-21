import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { claimsApi } from '../../services/claimsApi';
import { analysisApi } from '../../services/analysisApi';
import type { Claim } from '../../types/claim';
import type { DamageAnalysis, FraudAnalysis, DamageArea } from '../../types/analysis';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DamageViewer } from '../../components/ui/DamageViewer';
import { ArrowLeft, User, Phone, CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export const AgentClaimDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [damageAnalysis, setDamageAnalysis] = useState<DamageAnalysis | null>(null);
  const [fraudAnalysis, setFraudAnalysis] = useState<FraudAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'damage' | 'fraud'>('overview');
  const [selectedDamage, setSelectedDamage] = useState<DamageArea | null>(null);
  const [mainImage, setMainImage] = useState<string>('');

  useEffect(() => {
    if (id) {
      Promise.all([
        claimsApi.getClaimById(id),
        analysisApi.getDamageAnalysis(id),
        analysisApi.getFraudAnalysis(id)
      ]).then(([claimData, damageData, fraudData]) => {
        setClaim(claimData || null);
        setDamageAnalysis(damageData);
        setFraudAnalysis(fraudData);
        if (damageData?.imageUrl) {
          setMainImage(damageData.imageUrl);
        } else if (claimData?.images?.[0]) {
          setMainImage(claimData.images[0]);
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleAction = async (status: Claim['status']) => {
    if (!claim) return;
    setLoading(true);
    await claimsApi.updateClaimStatus(claim.id, status);
    setLoading(false);
    navigate('/agent/claims');
  };

  if (loading) return <div className="text-muted p-xl text-center">Loading workspace...</div>;
  if (!claim) return <div className="text-muted p-xl text-center">Claim not found.</div>;

  return (
    <div className="flex flex-col gap-lg" style={{ paddingBottom: '4rem' }}>
      {/* Header Panel */}
      <div className="flex justify-between items-start page-header" style={{ marginBottom: 0, paddingBottom: '1.5rem' }}>
        <div className="flex items-start gap-md">
          <Link to="/agent/claims" className="btn-secondary btn-sm mt-1">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-sm">
              <h2 className="text-2xl m-0">{claim.id}</h2>
              <Badge variant={claim.status === 'Approved' ? 'success' : claim.status === 'Flagged' || claim.status === 'Rejected' ? 'danger' : 'warning'}>{claim.status}</Badge>
            </div>
            <p className="text-muted text-sm mt-1">{claim.vehicle} • Submitted {new Date(claim.submittedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-sm">
          <button className="btn-secondary" onClick={() => handleAction('Under Review')}>
            Request Info
          </button>
          <button className="btn-danger" onClick={() => handleAction('Rejected')}>
            <XCircle size={16} /> Reject
          </button>
          <button className="btn-accent" onClick={() => handleAction('Approved')} style={{ backgroundColor: 'var(--success)' }}>
            <CheckCircle size={16} /> Approve
          </button>
        </div>
      </div>

      <div className="flex gap-xl">
        {/* Main Workspace */}
        <div style={{ flex: '3', minWidth: '0' }} className="flex flex-col">
          {/* Tabs */}
          <div className="flex gap-md" style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <button 
              className={`btn-ghost pb-2 px-1 ${activeTab === 'overview' ? 'text-primary' : ''}`} 
              style={{ borderRadius: 0, borderBottom: activeTab === 'overview' ? '2px solid var(--accent-primary)' : '2px solid transparent' }}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`btn-ghost pb-2 px-1 ${activeTab === 'damage' ? 'text-primary' : ''}`} 
              style={{ borderRadius: 0, borderBottom: activeTab === 'damage' ? '2px solid var(--accent-primary)' : '2px solid transparent' }}
              onClick={() => setActiveTab('damage')}
            >
              Evidence & Damage
            </button>
            <button 
              className={`btn-ghost pb-2 px-1 flex items-center gap-sm ${activeTab === 'fraud' ? 'text-danger font-bold' : ''}`} 
              style={{ borderRadius: 0, borderBottom: activeTab === 'fraud' ? '2px solid var(--danger)' : '2px solid transparent' }}
              onClick={() => setActiveTab('fraud')}
            >
              <AlertTriangle size={14} /> Fraud Analysis
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <Card style={{ flex: 1, minWidth: '250px' }}>
                  <h3 className="text-sm text-muted uppercase font-bold flex items-center gap-sm mb-4"><User size={14} /> Customer</h3>
                  <div className="flex flex-col gap-sm text-sm">
                    <div>
                      <span className="text-muted block text-xs">Name</span>
                      <span className="font-bold">{claim.customerName}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Policy</span>
                      <span>{claim.policyNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Contact</span>
                      <span className="flex items-center gap-xs"><Phone size={12} /> {claim.customerPhone}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Vehicle</span>
                      <span>{claim.vehicle}</span>
                    </div>
                  </div>
                </Card>

                <Card style={{ flex: 1, minWidth: '250px' }}>
                  <h3 className="text-sm text-muted uppercase font-bold mb-4">Incident</h3>
                  <div className="flex flex-col gap-sm text-sm">
                    <div>
                      <span className="text-muted block text-xs">Date</span>
                      <span>{claim.incidentDate}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Location</span>
                      <span>{claim.location}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Type</span>
                      <span>{claim.claimType}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted block text-xs mb-1">Customer Description</span>
                      <p style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        {claim.description}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card style={{ flex: 1, minWidth: '250px' }}>
                  <h3 className="text-sm text-muted uppercase font-bold flex items-center gap-sm mb-4"><ShieldCheck size={14} /> AI Summary</h3>
                  {damageAnalysis ? (
                    <div className="flex flex-col gap-sm text-sm">
                       <div>
                        <span className="text-muted block text-xs">Damage Areas</span>
                        <span className="font-bold">{damageAnalysis.damages.length} detected</span>
                      </div>
                      <div>
                        <span className="text-muted block text-xs">Highest Severity</span>
                        <Badge variant={damageAnalysis.damages.some(d => d.severity === 'Severe') ? 'danger' : 'warning'}>
                          {damageAnalysis.damages.some(d => d.severity === 'Severe') ? 'Severe' : 'Moderate'}
                        </Badge>
                      </div>
                      <div className="mt-2 p-3" style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <span className="text-muted block text-xs mb-1">Estimated Repair Cost</span>
                        <span className="text-xl font-bold">₹{damageAnalysis.totalEstimatedCost.min.toLocaleString()} – ₹{damageAnalysis.totalEstimatedCost.max.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-md h-full justify-center">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 2s infinite' }} />
                        <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>AI is analyzing evidence...</span>
                      </div>
                      <div style={{ height: '24px', width: '100%', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', border: '1px solid var(--border)' }} />
                      <div style={{ height: '24px', width: '70%', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'damage' && (
              <div className="flex gap-lg">
                <div style={{ flex: 2 }}>
                  <Card style={{ padding: '0.5rem' }}>
                    {damageAnalysis ? (
                      <DamageViewer 
                        analysis={{...damageAnalysis, imageUrl: mainImage}} 
                        selectedDamageId={selectedDamage?.id}
                        onSelectDamage={setSelectedDamage}
                      />
                    ) : (
                      <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--bg-hover)' }}>
                        <img src={mainImage} alt="Evidence" style={{ width: '100%', opacity: 0.5, filter: 'grayscale(50%) blur(2px)' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 2s infinite', marginBottom: '0.75rem' }} />
                          <p style={{ fontWeight: 600, color: 'var(--text-primary)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>AI Evidence Extraction Running</p>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Detecting damage boundaries...</p>
                        </div>
                      </div>
                    )}
                  </Card>
                  
                  {/* Thumbnail Gallery */}
                  <div className="flex gap-sm mt-4">
                    {claim.images.map((img, i) => (
                      <img 
                        key={i} 
                        src={img} 
                        alt="thumbnail" 
                        onClick={() => setMainImage(img)}
                        style={{ 
                          width: '80px', height: '60px', objectFit: 'cover', 
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          border: mainImage === img ? '2px solid var(--accent-primary)' : '2px solid transparent',
                          opacity: mainImage === img ? 1 : 0.6,
                          transition: 'all 0.2s'
                        }} 
                      />
                    ))}
                  </div>
                </div>
                
                <div style={{ flex: 1 }} className="flex flex-col gap-md">
                  <Card>
                    <h3 className="text-sm text-muted uppercase font-bold mb-4">Estimated Repair Cost</h3>
                    {damageAnalysis ? (
                      <div>
                        <div className="text-2xl font-bold mb-1">₹{damageAnalysis.totalEstimatedCost.min.toLocaleString()} – ₹{damageAnalysis.totalEstimatedCost.max.toLocaleString()}</div>
                        <p className="text-xs text-muted mb-4">Based on detected damage. Not a guaranteed payout.</p>
                        
                        <div className="flex flex-col gap-xs text-sm">
                          {damageAnalysis.damages.map(dmg => (
                            <div key={dmg.id} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                              <span>{dmg.type}</span>
                              <span className="text-muted">₹{dmg.estimatedRepairCost.min.toLocaleString()} – ₹{dmg.estimatedRepairCost.max.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                       <div className="flex flex-col gap-sm">
                          <p className="text-muted text-sm italic">Waiting for damage segmentation to complete before estimating parts and labor...</p>
                          <div style={{ height: '32px', width: '60%', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', border: '1px solid var(--border)' }} />
                       </div>
                    )}
                  </Card>

                  <Card style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
                    <h3 className="text-sm text-muted uppercase font-bold mb-4">Detected Damage</h3>
                    {damageAnalysis ? (
                      <div className="flex flex-col gap-sm">
                        {damageAnalysis.damages.map((dmg, idx) => (
                          <div 
                            key={dmg.id} 
                            onClick={() => setSelectedDamage(dmg)}
                            className="interactive-card text-sm p-3"
                            style={{
                              border: `1px solid ${selectedDamage?.id === dmg.id ? 'var(--warning)' : 'var(--border-color)'}`,
                              backgroundColor: selectedDamage?.id === dmg.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                            }}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold flex items-center gap-xs">
                                <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: '1px solid var(--border-color)' }}>{idx + 1}</span>
                                {dmg.type}
                              </span>
                              <Badge variant={dmg.severity === 'Severe' ? 'danger' : 'warning'}>{dmg.severity}</Badge>
                            </div>
                            <p className="text-muted text-xs ml-5">{dmg.location}</p>
                            <p className="text-muted text-xs ml-5 mt-1 font-bold">{dmg.confidence}% conf</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-sm">
                        <div style={{ height: '70px', width: '100%', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                        <div style={{ height: '70px', width: '100%', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'fraud' && (
              <div className="flex gap-lg">
                <div style={{ flex: 2 }} className="flex flex-col gap-md">
                  <Card>
                    <h3 className="text-sm text-muted uppercase font-bold mb-6">AI Fraud Assessment</h3>
                    {fraudAnalysis ? (
                      <div>
                        {/* Horizontal Risk Scale */}
                        <div className="flex flex-col mb-8">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-bold">{fraudAnalysis.score} <span className="text-lg text-muted font-normal">/ 100</span></span>
                            <span className="font-bold" style={{ color: fraudAnalysis.riskLevel === 'HIGH RISK' ? 'var(--danger)' : fraudAnalysis.riskLevel === 'MEDIUM RISK' ? 'var(--warning)' : 'var(--success)' }}>
                              {fraudAnalysis.riskLevel}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', display: 'flex', overflow: 'hidden' }}>
                            <div style={{ flex: 33, backgroundColor: fraudAnalysis.score <= 33 ? 'var(--success)' : 'var(--border-color)' }} />
                            <div style={{ flex: 33, backgroundColor: fraudAnalysis.score > 33 && fraudAnalysis.score <= 66 ? 'var(--warning)' : 'var(--border-color)', borderLeft: '2px solid var(--bg-secondary)', borderRight: '2px solid var(--bg-secondary)' }} />
                            <div style={{ flex: 34, backgroundColor: fraudAnalysis.score > 66 ? 'var(--danger)' : 'var(--border-color)' }} />
                          </div>
                          <div className="flex justify-between text-xs text-muted mt-2">
                            <span>Low (0-33)</span>
                            <span>Medium (34-66)</span>
                            <span>High (67-100)</span>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold mb-4">Risk Indicators</h4>
                        <div className="flex flex-col gap-sm">
                          {fraudAnalysis.indicators.map((indicator, idx) => (
                            <div key={idx} className="flex items-start gap-md p-3" style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                              {indicator.passed ? (
                                <CheckCircle size={18} color="var(--success)" />
                              ) : (
                                <AlertTriangle size={18} color="var(--danger)" />
                              )}
                              <div>
                                <p className="font-bold text-sm" style={{ color: indicator.passed ? 'var(--success)' : 'var(--danger)' }}>
                                  {indicator.passed ? 'Verified' : 'Suspicious Flag'}
                                </p>
                                <p className="text-xs text-muted mt-1">{indicator.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-md">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 2s infinite' }} />
                          <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>AI Fraud Engine is computing risk factors...</span>
                        </div>
                        <div style={{ height: '32px', width: '40%', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', border: '1px solid var(--border)' }} />
                        <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', border: '1px solid var(--border)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                          <div style={{ height: '60px', width: '100%', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                          <div style={{ height: '60px', width: '100%', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div className="p-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--danger-bg)', borderRadius: 'var(--radius-md)' }}>
                    <p className="font-bold flex items-center gap-sm text-sm" style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>
                      <AlertTriangle size={16}/> Internal Use Only
                    </p>
                    <p className="text-muted text-xs">
                      The fraud score and indicators are for internal review only. 
                      Under no circumstances should this data be disclosed to the customer or rendered in the customer portal.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
