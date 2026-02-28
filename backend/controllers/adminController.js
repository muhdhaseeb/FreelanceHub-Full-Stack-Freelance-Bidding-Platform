/**
 * adminController.js
 * All admin operations. Only accessible via adminProtect middleware.
 * Every destructive action is logged with the admin's user ID.
 */
const User     = require('../models/User');
const Job      = require('../models/Job');
const Bid      = require('../models/Bid');
const Payment  = require('../models/Payment');
const Review   = require('../models/Review');
const logger   = require('../utils/logger');

// ── AUTH ──────────────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '8h' });

exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      logger.warn({ msg: 'Failed admin login attempt', email });
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user._id);
    logger.info({ msg: 'Admin login', adminId: user._id, email: user.email });

    res.json({
      success: true, token,
      admin: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) { next(err); }
};

// ── STATS ─────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalClients, totalFreelancers, bannedUsers,
      totalJobs, openJobs, inProgressJobs, completedJobs,
      totalPayments, paidPayments, releasedPayments,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'freelancer' }),
      User.countDocuments({ isBanned: true }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Job.countDocuments({ status: 'in-progress' }),
      Job.countDocuments({ status: 'completed' }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'paid' }),
      Payment.countDocuments({ status: 'released' }),
      Review.countDocuments(),
    ]);

    // Total payment volume
    const volumeAgg = await Payment.aggregate([
      { $match: { status: { $in: ['paid', 'released'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalVolume = volumeAgg[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, clients: totalClients, freelancers: totalFreelancers, banned: bannedUsers },
        jobs:  { total: totalJobs, open: openJobs, inProgress: inProgressJobs, completed: completedJobs },
        payments: { total: totalPayments, paid: paidPayments, released: releasedPayments, volume: totalVolume },
        reviews: { total: totalReviews },
      },
    });
  } catch (err) { next(err); }
};

// ── USERS ─────────────────────────────────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role, banned, page = 1, limit = 20 } = req.query;
    const filter = { role: { $ne: 'admin' } };

    if (role && ['client', 'freelancer'].includes(role)) filter.role = role;
    if (banned === 'true')  filter.isBanned = true;
    if (banned === 'false') filter.isBanned = false;
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

exports.getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const [jobs, bids, reviews] = await Promise.all([
      Job.find({ clientId: user._id }).select('title status createdAt').limit(10),
      Bid.find({ freelancerId: user._id }).populate('jobId', 'title status').limit(10),
      Review.find({ freelancerId: user._id }).populate('clientId', 'name').limit(10),
    ]);

    res.json({ success: true, user, jobs, bids, reviews });
  } catch (err) { next(err); }
};

exports.banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot ban an admin.' });

    user.isBanned  = true;
    user.bannedAt  = new Date();
    user.bannedBy  = req.user._id;
    user.banReason = reason || 'Violation of terms of service';
    await user.save();

    logger.info({ msg: 'User banned', targetId: user._id, adminId: req.user._id, reason: user.banReason });
    res.json({ success: true, message: `${user.name} has been banned.`, user });
  } catch (err) { next(err); }
};

exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isBanned  = false;
    user.bannedAt  = undefined;
    user.bannedBy  = undefined;
    user.banReason = '';
    await user.save();

    logger.info({ msg: 'User unbanned', targetId: user._id, adminId: req.user._id });
    res.json({ success: true, message: `${user.name} has been unbanned.`, user });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete an admin.' });

    await User.findByIdAndDelete(req.params.id);
    logger.info({ msg: 'User deleted', targetId: req.params.id, adminId: req.user._id });
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
};

// ── JOBS ──────────────────────────────────────────────────────────────────────
exports.getJobs = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && ['open','in-progress','completed','cancelled'].includes(status)) filter.status = status;
    if (search) filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('clientId', 'name email')
        .populate('assignedFreelancerId', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Job.countDocuments(filter),
    ]);

    res.json({ success: true, jobs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

exports.cancelJob = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (['completed','cancelled'].includes(job.status))
      return res.status(400).json({ success: false, message: `Job is already ${job.status}.` });

    job.status = 'cancelled';
    await job.save();

    // Reject all pending bids
    await Bid.updateMany({ jobId: job._id, status: 'pending' }, { status: 'rejected' });

    logger.info({ msg: 'Admin force-cancelled job', jobId: job._id, adminId: req.user._id, reason });
    res.json({ success: true, message: 'Job cancelled.', job });
  } catch (err) { next(err); }
};

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
exports.getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && ['pending','paid','released','refunded'].includes(status)) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('clientId', 'name email')
        .populate('freelancerId', 'name email')
        .populate('jobId', 'title')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    res.json({ success: true, payments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// ── REVIEWS ───────────────────────────────────────────────────────────────────
exports.getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('clientId', 'name email')
        .populate('freelancerId', 'name email')
        .populate('jobId', 'title')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Review.countDocuments(),
    ]);
    res.json({ success: true, reviews, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    await Review.findByIdAndDelete(req.params.id);

    // Recalculate freelancer avg rating
    const remaining = await Review.find({ freelancerId: review.freelancerId });
    const avg = remaining.length
      ? Math.round((remaining.reduce((s, r) => s + r.rating, 0) / remaining.length) * 10) / 10
      : 0;
    await User.findByIdAndUpdate(review.freelancerId, { avgRating: avg, totalReviews: remaining.length });

    logger.info({ msg: 'Review deleted by admin', reviewId: req.params.id, adminId: req.user._id });
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) { next(err); }
};
