const Job          = require('../models/Job');
const Bid          = require('../models/Bid');
const Notification = require('../models/Notification');
const logger       = require('../utils/logger');

exports.createJob = async (req, res, next) => {
  try {
    const { title, description, budgetMin, budgetMax, deadline, category, tags } = req.body;
    if (!title || !description || !budgetMin || !budgetMax || !deadline)
      return res.status(400).json({ success: false, message: 'All fields required.' });

    const job = await Job.create({
      title, description,
      budgetMin: Number(budgetMin), budgetMax: Number(budgetMax),
      deadline: new Date(deadline),
      clientId: req.user._id,
      category: category || 'General',
      tags: tags || [],
    });

    logger.info({ msg: 'Job created', jobId: job._id, clientId: req.user._id });
    res.status(201).json({ success: true, job });
  } catch (err) { next(err); }
};

exports.getJobs = async (req, res, next) => {
  try {
    const { search, budgetMin, budgetMax, sort, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (req.user.role === 'client') filter.clientId = req.user._id;
    else filter.status = 'open';

    if (search) filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (budgetMin) filter.budgetMax = { $gte: Number(budgetMin) };
    if (budgetMax) filter.budgetMin = { $lte: Number(budgetMax) };

    const sortMap = {
      newest:      { createdAt: -1 },
      oldest:      { createdAt:  1 },
      budget_high: { budgetMin: -1 },
      budget_low:  { budgetMin:  1 },
    };
    const sortObj = sortMap[sort] || { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('clientId', 'name avgRating')
        .sort(sortObj).skip(skip).limit(Number(limit)),
      Job.countDocuments(filter),
    ]);

    res.json({ success: true, jobs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('clientId', 'name email avgRating')
      .populate('assignedFreelancerId', 'name email avgRating');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    const bids = await Bid.find({ jobId: job._id })
      .populate('freelancerId', 'name email avgRating totalReviews skills');

    res.json({ success: true, job, bids });
  } catch (err) { next(err); }
};

exports.markJobComplete = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (String(job.assignedFreelancerId) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Only the assigned freelancer can mark complete.' });
    if (job.status !== 'in-progress')
      return res.status(400).json({ success: false, message: `Cannot complete a "${job.status}" job.` });

    job.status = 'completed';
    await job.save();

    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: job.clientId, type: 'job_completed',
      message: `Freelancer marked "${job.title}" as complete. Review and release payment.`,
      jobId: job._id,
    });
    io.to(`user:${job.clientId}`).emit('notification', notification);

    res.json({ success: true, job });
  } catch (err) { next(err); }
};

// ── NEW: Withdraw Job ─────────────────────────────────────────────────────────
exports.withdrawJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    // Only the client who owns the job can withdraw it
    if (String(job.clientId) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    // Can only withdraw open jobs
    if (job.status !== 'open')
      return res.status(400).json({ success: false, message: `Cannot withdraw a "${job.status}" job. Only open jobs can be withdrawn.` });

    // Find all pending bids before changing status
    const pendingBids = await Bid.find({ jobId: job._id, status: 'pending' })
      .populate('freelancerId', 'name');

    // Withdraw the job
    job.status = 'cancelled';
    await job.save();

    // Reject all pending bids
    await Bid.updateMany({ jobId: job._id, status: 'pending' }, { status: 'rejected' });

    // Notify all freelancers who had pending bids
    const io = req.app.get('io');
    for (const bid of pendingBids) {
      const notification = await Notification.create({
        userId: bid.freelancerId._id,
        type: 'bid_rejected',
        message: `The job "${job.title}" has been withdrawn by the client.`,
        jobId: job._id,
      });
      io.to(`user:${bid.freelancerId._id}`).emit('notification', notification);
    }

    logger.info({ msg: 'Job withdrawn', jobId: job._id, clientId: req.user._id, bidsRejected: pendingBids.length });
    res.json({ success: true, message: 'Job withdrawn successfully.', job });
  } catch (err) { next(err); }
};
