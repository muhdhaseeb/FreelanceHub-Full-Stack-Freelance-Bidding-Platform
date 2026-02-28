const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No token provided.' });
    const token = authHeader.split(' ')[1];
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
    catch (err) {
      if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired.' });
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    req.user = user;
    next();
  } catch (error) { next(error); }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: `Only ${roles.join(' or ')} can do this.` });
  next();
};

module.exports = { protect, restrictTo };
