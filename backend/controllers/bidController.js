const Bid = require('../models/Bid');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');

const createNotification = async (io, userId, type, message, jobId) => {
  const notification = await Notification.create({ userId, type, message, jobId });
  io.to(`user:${userId}`).emit('notification', notification);
};

exports.getBidsForJob = async (req, res, next) => {
  try {
    const { jobId } = req.query;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId required' });
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (String(job.clientId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized' });
    const bids = await Bid.find({ jobId }).populate('freelancerId', 'name email avgRating totalReviews skills');
    res.json({ success: true, count: bids.length, bids });
  } catch (error) { next(error); }
};

exports.getMyBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({ freelancerId: req.user._id }).populate('jobId', 'title status deadline budgetMin budgetMax clientId');
    res.json({ success: true, bids });
  } catch (error) { next(error); }
};

exports.submitBid = async (req, res, next) => {
  try {
    const { jobId, amount, proposal } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ success: false, message: `Cannot bid on a "${job.status}" job` });
    if (String(job.clientId) === String(req.user._id)) return res.status(400).json({ success: false, message: 'Cannot bid on your own job' });
    const existingBid = await Bid.findOne({ jobId, freelancerId: req.user._id });
    if (existingBid) return res.status(400).json({ success: false, message: 'You have already bid on this job' });

    const bid = await Bid.create({ jobId, freelancerId: req.user._id, amount: Number(amount), proposal });
    await bid.populate('freelancerId', 'name email');

    const io = req.app.get('io');
    await createNotification(io, job.clientId, 'new_bid',
      `${req.user.name} placed a bid of $${amount} on your job "${job.title}"`, jobId);

    res.status(201).json({ success: true, bid });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'You have already bid on this job' });
    next(error);
  }
};

exports.acceptBid = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('jobId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });
    const job = bid.jobId;
    if (String(job.clientId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (job.status !== 'open') return res.status(400).json({ success: false, message: `Job is "${job.status}"` });
    if (bid.status !== 'pending') return res.status(400).json({ success: false, message: 'Bid already processed' });

    bid.status = 'accepted';
    await bid.save();
    job.status = 'in-progress';
    job.assignedFreelancerId = bid.freelancerId;
    await job.save();

    const rejectedBids = await Bid.find({ jobId: job._id, _id: { $ne: bid._id }, status: 'pending' });
    await Bid.updateMany({ jobId: job._id, _id: { $ne: bid._id }, status: 'pending' }, { status: 'rejected' });

    const io = req.app.get('io');
    await createNotification(io, bid.freelancerId, 'bid_accepted',
      `Your bid on "${job.title}" was accepted!`, job._id);

    for (const rejBid of rejectedBids) {
      await createNotification(io, rejBid.freelancerId, 'bid_rejected',
        `Your bid on "${job.title}" was not selected.`, job._id);
    }

    io.to(String(job._id)).emit('job-updated', { jobId: job._id, status: 'in-progress' });
    res.json({ success: true, message: 'Bid accepted.', bid, job });
  } catch (error) { next(error); }
};

// ── NEW: Reject a single bid ──────────────────────────────────────────────────
exports.rejectBid = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('jobId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    const job = bid.jobId;

    // Only the job owner can reject bids
    if (String(job.clientId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Can only reject pending bids on open jobs
    if (bid.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Bid is already "${bid.status}"` });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ success: false, message: `Cannot reject bids on a "${job.status}" job` });
    }

    bid.status = 'rejected';
    await bid.save();

    // Notify freelancer
    const io = req.app.get('io');
    await createNotification(io, bid.freelancerId, 'bid_rejected',
      `Your bid on "${job.title}" was not selected by the client.`, job._id);

    res.json({ success: true, message: 'Bid rejected.', bid });
  } catch (error) { next(error); }
};

// ── NEW: Cancel contract (client cancels in-progress job) ─────────────────────
exports.cancelContract = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Only the client can cancel
    if (String(job.clientId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the client can cancel a contract' });
    }

    // Can only cancel in-progress jobs
    if (job.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: `Cannot cancel a "${job.status}" job` });
    }

    const freelancerId = job.assignedFreelancerId;

    // Revert job to open and clear assigned freelancer
    job.status = 'open';
    job.assignedFreelancerId = null;
    await job.save();

    // Reject the accepted bid
    await Bid.findOneAndUpdate(
      { jobId, status: 'accepted' },
      { status: 'rejected' }
    );

    // Handle payment refund if payment exists
    let refundMessage = '';
    const payment = await Payment.findOne({ jobId });
    if (payment && payment.status === 'paid') {
      // In production: call stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId })
      // For now we mark it as refunded
      payment.status = 'refunded';
      await payment.save();
      refundMessage = ' Your payment has been marked for refund.';
    }

    // Notify freelancer
    const io = req.app.get('io');
    await createNotification(io, freelancerId, 'bid_rejected',
      `The client has cancelled the contract for "${job.title}". Reason: ${reason || 'Not specified'}`, jobId);

    res.json({
      success: true,
      message: `Contract cancelled. Job is now open for new bids.${refundMessage}`,
      job,
    });
  } catch (error) { next(error); }
};
