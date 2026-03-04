
const Dispute     = require('../models/Dispute');
const Job         = require('../models/Job');
const Payment     = require('../models/Payment');
const Notification= require('../models/Notification');
const logger      = require('../utils/logger');
const stripe      = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ── Raise a dispute ───────────────────────────────────────────────────────────
exports.raiseDispute = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const jobId = req.params.jobId;

    const job = await Job.findById(jobId)
      .populate('clientId', 'name')
      .populate('assignedFreelancerId', 'name');

    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.status !== 'in-progress')
      return res.status(400).json({ success: false, message: 'Disputes can only be raised on in-progress jobs.' });

    const isClient     = String(job.clientId._id) === String(req.user._id);
    const isFreelancer = String(job.assignedFreelancerId._id) === String(req.user._id);
    if (!isClient && !isFreelancer)
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    // Only one open dispute per job
    const existing = await Dispute.findOne({ jobId, status: 'open' });
    if (existing)
      return res.status(400).json({ success: false, message: 'There is already an open dispute for this job.' });

    const againstUser = isClient ? job.assignedFreelancerId._id : job.clientId._id;

    const dispute = await Dispute.create({ jobId, raisedBy: req.user._id, againstUser, reason });

    // Notify admin via job — set job flag
    job.hasDispute = true;
    await job.save();

    // Notify the other party
    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: againstUser,
      type: 'bid_rejected',
      message: `A dispute has been raised on job "${job.title}". An admin will review it shortly.`,
      jobId: job._id,
    });
    io.to(`user:${againstUser}`).emit('notification', notification);

    logger.info({ msg: 'Dispute raised', disputeId: dispute._id, jobId, raisedBy: req.user._id });
    res.status(201).json({ success: true, message: 'Dispute raised. Admin will review shortly.', dispute });
  } catch (err) { next(err); }
};

// ── Get dispute for a job ─────────────────────────────────────────────────────
exports.getDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findOne({ jobId: req.params.jobId })
      .populate('raisedBy', 'name role')
      .populate('againstUser', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, dispute });
  } catch (err) { next(err); }
};

// ── Admin: get all disputes ───────────────────────────────────────────────────
exports.getAllDisputes = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [disputes, total] = await Promise.all([
      Dispute.find(filter)
        .populate('jobId', 'title status')
        .populate('raisedBy', 'name role')
        .populate('againstUser', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Dispute.countDocuments(filter),
    ]);
    res.json({ success: true, disputes, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// ── Admin: resolve dispute ────────────────────────────────────────────────────
exports.resolveDispute = async (req, res, next) => {
  try {
    const { resolution, adminNote } = req.body;
    const validResolutions = ['refund_client', 'release_freelancer', 'cancel_job'];
    if (!validResolutions.includes(resolution))
      return res.status(400).json({ success: false, message: 'Invalid resolution.' });

    const dispute = await Dispute.findById(req.params.id)
      .populate('jobId')
      .populate('raisedBy', 'name')
      .populate('againstUser', 'name');

    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found.' });
    if (dispute.status === 'resolved')
      return res.status(400).json({ success: false, message: 'Dispute already resolved.' });

    const job     = dispute.jobId;
    const payment = await Payment.findOne({ jobId: job._id });
    const io      = req.app.get('io');

    if (resolution === 'refund_client') {
      if (payment && payment.stripePaymentIntentId) {
        await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
        payment.status = 'refunded';
        await payment.save();
      }
      job.status = 'cancelled';
      await job.save();

    } else if (resolution === 'release_freelancer') {
      if (payment) { payment.status = 'released'; await payment.save(); }
      job.status = 'completed';
      await job.save();

    } else if (resolution === 'cancel_job') {
      if (payment && payment.stripePaymentIntentId) {
        await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
        payment.status = 'refunded';
        await payment.save();
      }
      job.status = 'cancelled';
      job.hasDispute = false;
      await job.save();
    }

    dispute.status     = 'resolved';
    dispute.resolution = resolution;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    dispute.adminNote  = adminNote || '';
    await dispute.save();

    // Notify both parties
    const resolutionMsg = {
      refund_client:      'The dispute was resolved in your favour. Payment has been refunded.',
      release_freelancer: 'The dispute was resolved in your favour. Payment has been released.',
      cancel_job:         'The dispute has been resolved. The job has been cancelled.',
    };

    for (const userId of [String(dispute.raisedBy._id), String(dispute.againstUser._id)]) {
      const notification = await Notification.create({
        userId,
        type: 'job_completed',
        message: `Dispute on "${job.title}" resolved: ${resolutionMsg[resolution]}`,
        jobId: job._id,
      });
      io.to(`user:${userId}`).emit('notification', notification);
    }

    logger.info({ msg: 'Dispute resolved', disputeId: dispute._id, resolution, adminId: req.user._id });
    res.json({ success: true, message: 'Dispute resolved.', dispute });
  } catch (err) { next(err); }
};
