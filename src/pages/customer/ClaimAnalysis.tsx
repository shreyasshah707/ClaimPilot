import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { claimsApi } from '../../services/claimsApi';
import { analysisApi } from '../../services/analysisApi';
import type { Claim } from '../../types/claim';
import type { DamageAnalysis, DamageArea } from '../../types/analysis';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DamageViewer } from '../../components/ui/DamageViewer';
import { ArrowLeft, ShieldAlert, Zap } from 'lucide-react';

export const ClaimAnalysis = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [analysis, setAnalysis] = useState<DamageAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDamage, setSelectedDamage] = useState<DamageArea | null>(null);

  useEffect(() => {
    if (id) {
      Promise.all([
        claimsApi.getClaimById(id),
        analysisApi.getDamageAnalysis(id)
      ]).then(([claimData, analysisData]) => {
        setClaim(claimData || null);
        setAnalysis(analysisData);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="text-muted p-xl text-center">Loading claim details...</div>;
  if (!claim) return <div className="text-muted p-xl text-center">Claim not found.</div>;

  return (
    <div className="flex flex-col gap-lg max-w-5xl mx-auto" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="flex items-center gap-md page-header mb-4">
        <Link to="/customer" className="btn-secondary btn-sm" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="flex items-center gap-sm">
            <h2 className="text-2xl m-0">{claim.vehicle}</h2>
            <Badge variant="warning">{claim.status}</Badge>
          </div>
          <p className="text-muted text-sm mt-1">{claim.id} • {claim.claimType} • Submitted {new Date(claim.submittedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex gap-xl" style={{ flexWrap: 'wrap' }}>
        {/* Left Column: Analysis Visuals */}
        <div style={{ flex: '5', minWidth: '400px' }} className="flex flex-col gap-md">
          {analysis ? (
            <Card style={{ padding: '0.5rem' }}>
              <div className="p-md mb-2 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-sm"><Zap size={18} color="var(--accent-primary)" /> AI Damage Assessment</h3>
              </div>
              <DamageViewer 
                analysis={analysis} 
                selectedDamageId={selectedDamage?.id}
                onSelectDamage={setSelectedDamage} 
              />
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center gap-md text-muted" style={{ minHeight: '400px' }}>
              <ShieldAlert size={48} opacity={0.5} />
              <div className="text-center">
                <p className="font-bold text-lg text-primary">Analyzing your vehicle</p>
                <p className="text-sm">Reviewing uploaded images...</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Details */}
        <div style={{ flex: '3', minWidth: '300px' }} className="flex flex-col gap-md">
          <Card>
            <h3 className="text-sm text-muted uppercase font-bold mb-4">AI Assessment</h3>
            {analysis ? (
              <div className="flex flex-col gap-md">
                <p className="text-sm"><strong>{analysis.damages.length}</strong> damaged areas detected.</p>
                
                <div className="flex flex-col gap-sm">
                  {analysis.damages.map((dmg, idx) => (
                    <div 
                      key={dmg.id} 
                      onClick={() => setSelectedDamage(dmg)}
                      className="interactive-card p-3"
                      style={{
                        border: `1px solid ${selectedDamage?.id === dmg.id ? 'var(--warning)' : 'var(--border-color)'}`,
                        backgroundColor: selectedDamage?.id === dmg.id ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm">
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: '1px solid var(--border-color)', marginRight: '6px' }}>{idx + 1}</span>
                          {dmg.type}
                        </span>
                        <Badge variant={dmg.severity === 'Severe' ? 'danger' : 'warning'}>{dmg.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted ml-6">{dmg.location}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <span className="text-muted block text-xs mb-1">Estimated Repair Cost</span>
                  <span className="text-2xl font-bold">₹{analysis.totalEstimatedCost.min.toLocaleString()} – ₹{analysis.totalEstimatedCost.max.toLocaleString()}</span>
                  <p className="text-xs text-muted mt-2">Based on detected damage. Requires final agent review.</p>
                </div>
              </div>
            ) : (
              <p className="text-muted text-sm">Assessment not yet complete.</p>
            )}
          </Card>

          <Card>
            <h3 className="text-sm text-muted uppercase font-bold mb-4">Claim Summary</h3>
            <div className="flex flex-col gap-sm text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Incident Date</span>
                <span>{claim.incidentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Location</span>
                <span>{claim.location}</span>
              </div>
              <div className="mt-2">
                <span className="text-muted block mb-1">Your Description</span>
                <p className="text-sm p-3" style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  "{claim.description}"
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
