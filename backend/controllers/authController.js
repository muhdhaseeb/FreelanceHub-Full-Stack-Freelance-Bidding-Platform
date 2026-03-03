const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');
const logger = require('../utils/logger');
const { sendPasswordReset } = require('../utils/emailService');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

const resetTokenStore = new Map();

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'All fields required.' });
    if (!['client', 'freelancer'].includes(role))
      return res.status(400).json({ success: false, message: 'Role must be client or freelancer.' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id);
    logger.info({ msg: 'User registered', userId: user._id, role });
    res.status(201).json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      logger.warn({ msg: 'Failed login attempt', email });
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (user.isBanned)
      return res.status(403).json({ success: false, code: 'ACCOUNT_BANNED', message: 'Your account has been suspended.' });

    const token = signToken(user._id);
    logger.info({ msg: 'User logged in', userId: user._id, role: user.role });
    res.json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) { next(err); }
};

// ── Delete Account (soft delete) ──────────────────────────────────────────────
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password)
      return res.status(400).json({ success: false, message: 'Password is required to delete your account.' });

    const user = await User.findById(req.user._id).select('+password');
    if (!await user.comparePassword(password))
      return res.status(401).json({ success: false, message: 'Incorrect password.' });

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.email     = `deleted_${Date.now()}_${user.email}`; // free up the email
    await user.save();

    logger.info({ msg: 'Account deleted', userId: user._id });
    res.json({ success: true, message: 'Your account has been deleted.' });
  } catch (err) { next(err); }
};

// ── Password Reset ─────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
    if (!user)
      return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });

    const token     = crypto.randomBytes(32).toString('hex');
    const hash      = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000;

    resetTokenStore.set(hash, { userId: String(user._id), expiresAt });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendPasswordReset({ to: user.email, name: user.name, resetUrl });

    logger.info({ msg: 'Password reset email sent', userId: user._id });
    res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const hash   = crypto.createHash('sha256').update(token).digest('hex');
    const record = resetTokenStore.get(hash);

    if (!record || record.expiresAt < Date.now()) {
      resetTokenStore.delete(hash);
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = newPassword;
    await user.save();
    resetTokenStore.delete(hash);

    logger.info({ msg: 'Password reset successful', userId: user._id });
    res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (err) { next(err); }
};
