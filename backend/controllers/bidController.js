const Bid          = require('../models/Bid');
const Job          = require('../models/Job');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const logger       = require('../utils/logger');
const { sendNewBidReceived, sendBidAccepted } = require('../utils/emailService');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

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
    const bids = await Bid.find({ freelancerId: req.user._id })
      .populate('jobId', 'title status deadline budgetMin budgetMax clientId');
    res.json({ success: true, bids });
  } catch (error) { next(error); }
};

exports.submitBid = async (req, res, next) => {
  try {
    const { jobId, amount, proposal } = req.body;
    const job = await Job.findById(jobId).populate('clientId', 'name email');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ success: false, message: `Cannot bid on a "${job.status}" job` });
    if (String(job.clientId._id) === String(req.user._id)) return res.status(400).json({ success: false, message: 'Cannot bid on your own job' });

    const existingBid = await Bid.findOne({ jobId, freelancerId: req.user._id });
    if (existingBid) return res.status(400).json({ success: false, message: 'You have already bid on this job' });

    const bid = await Bid.create({ jobId, freelancerId: req.user._id, amount: Number(amount), proposal });
    await bid.populate('freelancerId', 'name email');

    const io = req.app.get('io');
    await createNotification(io, job.clientId._id, 'new_bid',
      `${req.user.name} placed a bid of $${amount} on "${job.title}"`, jobId);

    // Send email to client
    sendNewBidReceived({
      to: job.clientId.email,
      clientName: job.clientId.name,
      freelancerName: req.user.name,
      jobTitle: job.title,
      bidAmount: amount,
      jobUrl: `${CLIENT_URL}/jobs/${jobId}`,
    }).catch(err => logger.warn({ msg: 'Failed to send new bid email', error: err.message }));

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

    // Send email to freelancer
    const freelancer = await User.findById(bid.freelancerId).select('name email');
    if (freelancer) {
      sendBidAccepted({
        to: freelancer.email,
        freelancerName: freelancer.name,
        jobTitle: job.title,
        bidAmount: bid.amount,
        jobUrl: `${CLIENT_URL}/jobs/${job._id}`,
      }).catch(err => logger.warn({ msg: 'Failed to send bid accepted email', error: err.message }));
    }

    res.json({ success: true, message: 'Bid accepted.', bid, job });
  } catch (error) { next(error); }
};

exports.rejectBid = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('jobId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });
    const job = bid.jobId;
    if (String(job.clientId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (bid.status !== 'pending') return res.status(400).json({ success: false, message: `Bid is already "${bid.status}"` });
    if (job.status !== 'open') return res.status(400).json({ success: false, message: `Cannot reject bids on a "${job.status}" job` });

    bid.status = 'rejected';
    await bid.save();

    const io = req.app.get('io');
    await createNotification(io, bid.freelancerId, 'bid_rejected',
      `Your bid on "${job.title}" was not selected by the client.`, job._id);

    res.json({ success: true, message: 'Bid rejected.', bid });
  } catch (error) { next(error); }
};

exports.cancelContract = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;
    const Job      = require('../models/Job');
    const Payment  = require('../models/Payment');

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (String(job.clientId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Only the client can cancel' });
    if (job.status !== 'in-progress') return res.status(400).json({ success: false, message: `Cannot cancel a "${job.status}" job` });

    const freelancerId = job.assignedFreelancerId;
    job.status = 'open';
    job.assignedFreelancerId = null;
    await job.save();

    await Bid.findOneAndUpdate({ jobId, status: 'accepted' }, { status: 'rejected' });

    let refundMessage = '';
    const payment = await Payment.findOne({ jobId });
    if (payment && payment.status === 'paid') {
      payment.status = 'refunded';
      await payment.save();
      refundMessage = ' Your payment has been marked for refund.';
    }

    const io = req.app.get('io');
    await createNotification(io, freelancerId, 'bid_rejected',
      `The client cancelled the contract for "${job.title}". Reason: ${reason || 'Not specified'}`, jobId);

    res.json({ success: true, message: `Contract cancelled.${refundMessage}`, job });
  } catch (error) { next(error); }
};
