/**
 * adminAuth.js
 * Protects all /api/admin/* routes.
 * Requires a valid JWT AND role === 'admin'.
 * Admin tokens are issued identically to user tokens — same JWT_SECRET.
 */
const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const adminProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token provided.' });

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError')
        return res.status(401).json({ success: false, message: 'Token expired.' });
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user)
      return res.status(401).json({ success: false, message: 'User no longer exists.' });

    // Hard role check — not just any authenticated user
    if (user.role !== 'admin') {
      logger.warn({ msg: 'Unauthorized admin access attempt', userId: user._id, role: user.role, path: req.path });
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { adminProtect };
