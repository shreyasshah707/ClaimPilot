require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Claim = require('../models/Claim');
const { generateImageHash } = require('./phash');
const connectDB = require('../config/db');

const seedData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await User.deleteMany();
    await Claim.deleteMany();
    
    console.log('Cleared existing data.');

    // 1. Create Users
    const customer = await User.create({
      email: 'customer@example.com',
      password: 'password', // will be hashed by pre-save hook
      role: 'CUSTOMER',
      fullName: 'Rahul Sharma'
    });

    const agent = await User.create({
      email: 'agent@example.com',
      password: 'password',
      role: 'AGENT',
      fullName: 'Agent Priya'
    });
    
    console.log('Users created.');

    // 2. Create mock claims
    const claim1Hash = await generateImageHash('https://example.com/damage1.jpg');
    // Using a different image for the second one
    const claim2Hash = await generateImageHash('https://example.com/damage2.jpg');
    
    // Create first claim
    const claim1 = await Claim.create({
      claimNumber: 'CLM-2026-8001',
      customerId: customer._id,
      claimType: 'COLLISION',
      status: 'NEEDS_REVIEW',
      vehicleDetails: {
        registrationNumber: 'MH-12-AB-1234',
        drivingLicenseNumber: 'MH1220110012345',
        makeModel: 'Maruti Suzuki Swift 2022'
      },
      incident: {
        date: new Date('2026-08-20'),
        location: 'Pune-Mumbai Expressway',
        description: 'Rear-ended by a truck while slowing down for traffic.'
      },
      evidenceImages: [{
        url: 'https://example.com/damage1.jpg',
        damageType: 'Rear Bumper',
        severity: 'HIGH',
        pHash: claim1Hash
      }],
      costEstimation: {
        minEstimatedCost: 15000,
        maxEstimatedCost: 25000,
        lineItems: [
          { partName: 'Rear Bumper', action: 'Replace', estimatedPrice: 12000 },
          { partName: 'Tail Light', action: 'Replace', estimatedPrice: 3000 }
        ]
      },
      fraudAnalysis: {
        riskScore: 15,
        flaggedIndicators: []
      }
    });

    // Create second claim - simulating a duplicate image fraud scenario
    // We manually set this up for demonstration, in reality the controller logic catches this.
    const claim2 = await Claim.create({
      claimNumber: 'CLM-2026-8002',
      customerId: customer._id,
      claimType: 'OWN_DAMAGE',
      status: 'HIGH_RISK',
      vehicleDetails: {
        registrationNumber: 'MH-14-CD-5678',
        drivingLicenseNumber: 'MH1420150056789',
        makeModel: 'Hyundai i20'
      },
      incident: {
        date: new Date('2026-08-21'),
        location: 'Hinjewadi, Pune',
        description: 'Hit a pole while parking.'
      },
      evidenceImages: [{
        url: 'https://example.com/damage1_cropped.jpg',
        damageType: 'Front Bumper',
        severity: 'MEDIUM',
        pHash: claim1Hash // Same hash!
      }],
      costEstimation: {
        minEstimatedCost: 5000,
        maxEstimatedCost: 8000,
        lineItems: [
          { partName: 'Front Bumper', action: 'Repair', estimatedPrice: 5000 }
        ]
      },
      fraudAnalysis: {
        riskScore: 85,
        duplicateImageDetected: true,
        matchedClaimId: claim1._id,
        flaggedIndicators: [{
          code: 'FR-001',
          severity: 'HIGH',
          description: 'Duplicate image detected matching CLM-2026-8001'
        }]
      }
    });
    
    // Create a third valid claim
    const claim3 = await Claim.create({
      claimNumber: 'CLM-2026-8003',
      customerId: customer._id,
      claimType: 'THEFT',
      status: 'NEW',
      vehicleDetails: {
        registrationNumber: 'DL-01-EF-9012',
        drivingLicenseNumber: 'DL0120190090123',
        makeModel: 'Honda City'
      },
      incident: {
        date: new Date('2026-08-22'),
        location: 'Connaught Place, New Delhi',
        description: 'Car stolen from parking lot.'
      },
      evidenceImages: [{
        url: 'https://example.com/empty_parking.jpg',
        damageType: 'None',
        severity: 'NONE',
        pHash: claim2Hash
      }],
      costEstimation: {
        minEstimatedCost: 800000,
        maxEstimatedCost: 800000,
        lineItems: []
      },
      fraudAnalysis: {
        riskScore: 5,
        flaggedIndicators: []
      }
    });

    console.log('Mock claims created.');
    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
