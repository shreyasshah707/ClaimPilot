import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimsApi } from '../../services/claimsApi';
import { Card } from '../../components/ui/Card';
import { Upload, X, ChevronRight, Car, AlertTriangle, Flame, CloudLightning, HelpCircle } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

export const NewClaim = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [claimType, setClaimType] = useState('Accident');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 4) as Step);
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImages([...images, 'https://images.unsplash.com/photo-1590240974967-0c67e96fa47e?auto=format&fit=crop&q=80&w=800']);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const newClaim = await claimsApi.createClaim({
      claimType,
      incidentDate,
      location,
      vehicle,
      engineNumber,
      chassisNumber,
      description,
      images
    });
    setLoading(false);
    navigate(`/customer/claims/${newClaim.id}`);
  };

  const typeOptions = [
    { id: 'Accident', icon: <Car size={24} /> },
    { id: 'Own Damage', icon: <AlertTriangle size={24} /> },
    { id: 'Theft', icon: <HelpCircle size={24} /> },
    { id: 'Fire', icon: <Flame size={24} /> },
    { id: 'Natural Event', icon: <CloudLightning size={24} /> },
  ];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div className="mb-8">
        <h1 className="text-2xl mb-6">Request a Claim</h1>
        
        {/* Progress Stepper */}
        <div className="flex justify-between items-center text-sm" style={{ padding: '0 2rem' }}>
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Photos' },
            { num: 3, label: 'Review' }
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-xs relative" style={{ flex: 1 }}>
              <div 
                style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', 
                  backgroundColor: step >= s.num ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: step >= s.num ? '#fff' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '0.75rem', zIndex: 2
                }}
              >
                {s.num}
              </div>
              <span style={{ color: step >= s.num ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.label}</span>
              {s.num < 3 && (
                <div style={{ position: 'absolute', top: '12px', left: '50%', width: '100%', height: '2px', backgroundColor: step > s.num ? 'var(--accent-primary)' : 'var(--bg-tertiary)', zIndex: 1 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card style={{ padding: '2rem' }}>
        {step === 1 && (
          <div className="flex flex-col gap-lg animate-in">
            <div>
              <h2 className="text-xl mb-1">What happened?</h2>
              <p className="text-muted text-sm">Select the type of incident.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
              {typeOptions.map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => setClaimType(opt.id)}
                  className="interactive-card flex flex-col items-center justify-center gap-sm text-center"
                  style={{ 
                    padding: '1.5rem 1rem', 
                    border: claimType === opt.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    backgroundColor: claimType === opt.id ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-primary)'
                  }}
                >
                  <div style={{ color: claimType === opt.id ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{opt.icon}</div>
                  <span className="text-sm font-medium">{opt.id}</span>
                </div>
              ))}
            </div>

            <div className="form-group mt-4">
              <label className="form-label">Vehicle</label>
              <input type="text" className="form-input" placeholder="e.g. Honda City (MH 12 AB 1234)" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
            </div>

            <div className="flex gap-md">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Engine Number</label>
                <input type="text" className="form-input" placeholder="e.g. G15A-123456" value={engineNumber} onChange={(e) => setEngineNumber(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Chassis Number</label>
                <input type="text" className="form-input" placeholder="e.g. MA3E123456789" value={chassisNumber} onChange={(e) => setChassisNumber(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-md">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Date</label>
                <input type="date" className="form-input" max={new Date().toISOString().split('T')[0]} value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Location</label>
                <input type="text" className="form-input" placeholder="e.g. Pune" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Brief Description</label>
              <textarea className="form-input" rows={3} placeholder="I hit a pole while parking..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn btn-primary" onClick={handleNext} disabled={!incidentDate || !vehicle || !description}>
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-lg animate-in">
            <div>
              <h2 className="text-xl mb-1">Add Photos</h2>
              <p className="text-muted text-sm">Clear photos help our AI assess the damage immediately.</p>
            </div>
            
            <div style={{ 
              border: '2px dashed var(--border-light)', 
              borderRadius: 'var(--radius-md)', 
              padding: '4rem 2rem', 
              textAlign: 'center',
              backgroundColor: 'var(--bg-primary)',
              position: 'relative',
              transition: 'background-color 0.2s'
            }} className="hover:bg-tertiary">
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
              />
              <div className="flex flex-col items-center gap-sm">
                <Upload size={32} color="var(--text-secondary)" />
                <span className="font-bold text-lg">Drop photos here</span>
                <span className="text-sm text-muted">or click to browse</span>
              </div>
            </div>

            {images.length > 0 && (
              <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={img} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => removeImage(idx)} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: '0.25rem', color: 'white' }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button className="btn btn-secondary" onClick={handlePrev}>Back</button>
              <button className="btn btn-primary" onClick={handleNext} disabled={images.length === 0}>
                Review Claim <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-lg animate-in">
             <div>
              <h2 className="text-xl mb-1">Review Details</h2>
              <p className="text-muted text-sm">Please verify the information before submitting.</p>
            </div>
            
            <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div className="p-md" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h4 className="text-sm text-muted uppercase font-bold mb-4">Incident</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <span className="text-muted">Type</span> <span className="font-medium">{claimType}</span>
                  <span className="text-muted">Vehicle</span> <span className="font-medium">{vehicle}</span>
                  <span className="text-muted">Date</span> <span>{incidentDate}</span>
                  <span className="text-muted">Location</span> <span>{location}</span>
                  <span className="text-muted">Details</span> <span>{description}</span>
                </div>
              </div>

              <div className="p-md">
                <h4 className="text-sm text-muted uppercase font-bold mb-4">Evidence</h4>
                <div className="flex gap-sm">
                  {images.map((img, idx) => (
                    <img key={idx} src={img} alt="Evidence" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  ))}
                  <span className="text-sm text-muted flex items-center ml-2">{images.length} photos attached</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button className="btn btn-secondary" onClick={handlePrev} disabled={loading}>Back</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ backgroundColor: 'var(--success)', border: 'none' }}>
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </div>
        )}
      </Card>
      <style>{`
        .animate-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
