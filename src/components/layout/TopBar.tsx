import React, { useState } from 'react';

const precise2DText = `"Precise 2D" is the algorithmic capability to extract millimeter-accurate 3D physical geometry—depth differential (ΔZ), surface normal vectors (θ), and volumetric deformation—strictly from a single standard 2D monocular RGB photo. It bridges the gap between low-information 2D vision and inaccessible 3D hardware, serving as the core Unique Selling Proposition (USP) of ClaimPilot.

The Paradigm Shift: Why "Precise 2D" Disrupts the Industry

Standard 2D Object Detection (Traditional AI): Models like plain YOLO draw flat bounding boxes around damage. They treat a 1 mm surface scratch identical to a 15 mm high-energy structural crease because standard RGB images lack depth information.

Hardware 3D Scanning (LiDAR / Stereo Cameras): Provides accurate depth but requires specialized hardware. It cannot be deployed to millions of policyholders submitting self-service photos on standard smartphones.

"Precise 2D" (ClaimPilot USP): Delivers 3D metric accuracy with 2D smartphone accessibility. It turns any standard car photo into a calibrated metric surface mesh without requiring depth sensors.

The 4 Pillars of the "Precise 2D" Innovation

1. Monocular Metric Depth Inference: Neural networks predict relative Z-axis depth matrices from a single RGB perspective by analyzing micro-shadows, surface specular reflections, and edge gradients.

2. Surface Normal Orientation (θ): By calculating 3-channel normal vectors (Nx, Ny, Nz), the engine evaluates the curvature rate of damaged metal. This distinguishes elastic, pop-out dents from sharp, non-repairable creases.

3. In-Frame Spatial Calibration: Converts unitless pixel offsets into real-world millimeters (mm/px) using known reference dimensions from standard vehicle features (such as license plates or wheel rims).

4. Localized Region-of-Interest (ROI) Cropping: Rather than wasting compute estimating depth across irrelevant backgrounds (sky, pavement, trees), the hybrid architecture isolates the 2D bounding box and calculates 3D deformation solely within the damage region.`;

export const TopBar: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div style={{
        height: '72px',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2.5rem',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '1rem',
        margin: '1rem 2rem',
        borderRadius: '100px',
        boxShadow: 'var(--shadow-md)',
        zIndex: 100,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{
            fontFamily: 'var(--font-logo)',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--accent)" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            ClaimPilot AI
          </span>
          
          <nav style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            <button 
              onClick={() => setShowModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Why ClaimPilot? 
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </nav>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            position: 'relative',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}
            >
              ✕
            </button>
            <h2 style={{ fontFamily: 'var(--font-logo)', marginBottom: '1.5rem', fontSize: '1.75rem' }}>Why ClaimPilot?</h2>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {precise2DText}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
