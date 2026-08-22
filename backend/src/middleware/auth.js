const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ error: 'You are not logged in! Please log in to get access.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ error: 'The user belonging to this token no longer exists.' });
    }
    
    // Attach user to request
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token or token expired' });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    next();
  };
};

/**
 * BOLA Check Middleware
 * Ensures a Customer can only access their own resources.
 * If the user is an AGENT or ADMIN, they bypass this check.
 * Note: For retrieving a specific claim, we do this check in the controller or a specialized middleware.
 * Here we can add a generic BOLA check if needed.
 */
exports.checkBOLA = (resourceOwnerIdField = 'customerId') => {
  return (req, res, next) => {
    // If agent/admin, skip
    if (['AGENT', 'ADMIN'].includes(req.user.role)) {
      return next();
    }
    
    // For list endpoints, the controller should filter by req.user.id
    // This middleware is mainly for single resource access if we have the resource loaded.
    // In Express, usually we do this in the controller after fetching the document.
    next();
  };
};
