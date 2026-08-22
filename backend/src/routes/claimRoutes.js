const express = require('express');
const claimController = require('../controllers/claimController');
const authController = require('../middleware/auth');

const router = express.Router();

// All claim routes require authentication
router.use(authController.protect);

router
  .route('/')
  .get(claimController.getAllClaims)
  .post(authController.restrictTo('CUSTOMER'), claimController.createClaim);

router
  .route('/:id')
  .get(claimController.getClaim);

router
  .route('/:id/status')
  .patch(authController.restrictTo('AGENT', 'ADMIN'), claimController.updateClaimStatus);

module.exports = router;
