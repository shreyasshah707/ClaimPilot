const Claim = require('../models/Claim');
const AuditLog = require('../models/AuditLog');
const { generateImageHash, calculateHammingDistance } = require('../utils/phash');

exports.getAllClaims = async (req, res) => {
  try {
    let filter = {};
    
    // BOLA protection built into the query
    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.user.id;
    } else {
      // For AGENT and ADMIN, allow status filtering
      if (req.query.status) {
        filter.status = req.query.status;
      }
    }
    
    const claims = await Claim.find(filter)
      .populate('customerId', 'fullName email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: claims.length,
      data: {
        claims
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('customerId', 'fullName email');
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    // Strict ownership check (BOLA) for customers
    if (req.user.role === 'CUSTOMER' && claim.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to view this claim' });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        claim
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createClaim = async (req, res) => {
  try {
    const { claimType, vehicleDetails, incident, documents, evidenceImages } = req.body;
    
    // Auto-generate claim number
    const claimCount = await Claim.countDocuments();
    const claimNumber = `CLM-${new Date().getFullYear()}-${8000 + claimCount + 1}`;
    
    const newClaimData = {
      claimNumber,
      customerId: req.user.id,
      claimType,
      vehicleDetails,
      incident,
      documents,
      evidenceImages: evidenceImages || [],
      fraudAnalysis: {
        riskScore: 0,
        flaggedIndicators: []
      }
    };
    
    // pHash Fraud Check
    if (newClaimData.evidenceImages && newClaimData.evidenceImages.length > 0) {
      for (const img of newClaimData.evidenceImages) {
        // Generate hash for new image
        img.pHash = await generateImageHash(img.url);
        
        // Compare with all existing claims
        const historicalClaims = await Claim.find({ _id: { $ne: newClaimData._id } });
        for (const pastClaim of historicalClaims) {
          for (const pastImg of pastClaim.evidenceImages) {
            if (pastImg.pHash) {
              const distance = calculateHammingDistance(img.pHash, pastImg.pHash);
              if (distance <= 5) {
                // Fraud detected!
                newClaimData.fraudAnalysis.duplicateImageDetected = true;
                newClaimData.fraudAnalysis.riskScore += 50;
                newClaimData.fraudAnalysis.matchedClaimId = pastClaim._id;
                newClaimData.fraudAnalysis.flaggedIndicators.push({
                  code: 'FR-001',
                  severity: 'HIGH',
                  description: 'Duplicate or highly similar image detected from past claims.'
                });
                break;
              }
            }
          }
          if (newClaimData.fraudAnalysis.duplicateImageDetected) break;
        }
      }
    }
    
    const claim = await Claim.create(newClaimData);
    
    await AuditLog.create({
      userId: req.user.id,
      action: 'CLAIM_CREATED',
      claimId: claim._id,
      ipAddress: req.ip
    });
    
    res.status(201).json({
      status: 'success',
      data: { claim }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateClaimStatus = async (req, res) => {
  try {
    const { status, riskScore, flaggedIndicators } = req.body;
    
    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    // Only Agent/Admin can do this (handled by middleware restrictTo), but let's just make sure.
    
    if (status) claim.status = status;
    if (riskScore !== undefined) claim.fraudAnalysis.riskScore = riskScore;
    if (flaggedIndicators) claim.fraudAnalysis.flaggedIndicators = flaggedIndicators;
    
    await claim.save();
    
    await AuditLog.create({
      userId: req.user.id,
      action: `CLAIM_STATUS_UPDATED_TO_${status}`,
      claimId: claim._id,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      status: 'success',
      data: { claim }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
