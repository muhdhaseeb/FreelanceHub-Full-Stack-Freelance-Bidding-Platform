const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true, token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, bio: user.bio, skills: user.skills, profilePicture: user.profilePicture, location: user.location, avgRating: user.avgRating, totalReviews: user.totalReviews, createdAt: user.createdAt },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    sendAuthResponse(user, 201, res);
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    sendAuthResponse(user, 200, res);
  } catch (error) { next(error); }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
