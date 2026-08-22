const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto');

const lineItemSchema = new mongoose.Schema({
  partName: String,
  action: String,
  estimatedPrice: Number,
}, { _id: false });

const fraudIndicatorSchema = new mongoose.Schema({
  code: String,
  severity: String,
  description: String,
}, { _id: false });

const claimSchema = new mongoose.Schema({
  claimNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  claimType: {
    type: String,
    enum: ['COLLISION', 'THEFT', 'OWN_DAMAGE'],
    required: true,
  },
  status: {
    type: String,
    enum: ['NEW', 'NEEDS_REVIEW', 'HIGH_RISK', 'APPROVED', 'REJECTED'],
    default: 'NEW',
  },
  vehicleDetails: {
    registrationNumber: {
      type: String,
      required: true,
      get: decrypt,
      set: encrypt,
    },
    drivingLicenseNumber: {
      type: String,
      required: true,
      get: decrypt,
      set: encrypt,
    },
    makeModel: {
      type: String,
      required: true,
      get: decrypt,
      set: encrypt,
    },
  },
  incident: {
    date: { type: Date, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
  },
  documents: [{
    type: { type: String }, // 'FIR', 'RC', 'DL'
    fileUrl: String,
    verified: { type: Boolean, default: false },
    extractedText: String,
  }],
  evidenceImages: [{
    url: String,
    damageType: String,
    severity: String,
    pHash: String,
  }],
  costEstimation: {
    minEstimatedCost: Number,
    maxEstimatedCost: Number,
    lineItems: [lineItemSchema],
  },
  fraudAnalysis: {
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    flaggedIndicators: [fraudIndicatorSchema],
    duplicateImageDetected: { type: Boolean, default: false },
    matchedClaimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim' },
  }
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Claim', claimSchema);
