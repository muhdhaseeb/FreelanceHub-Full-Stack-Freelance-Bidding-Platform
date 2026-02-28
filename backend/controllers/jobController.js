const Job = require('../models/Job');
const Bid = require('../models/Bid');

exports.getJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search, budgetMin, budgetMax, deadlineBefore, sort } = req.query;
    const filter = {};

    if (status && ['open', 'in-progress', 'completed'].includes(status)) filter.status = status;
    if (req.user?.role === 'client') filter.clientId = req.user._id;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (budgetMin) filter.budgetMax = { $gte: Number(budgetMin) };
    if (budgetMax) filter.budgetMin = { $lte: Number(budgetMax) };
    if (deadlineBefore) filter.deadline = { $lte: new Date(deadlineBefore) };

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      budget_low: { budgetMin: 1 },
      budget_high: { budgetMin: -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const skip = (Number(page) - 1) * Number(limit);
    const [jobs, total] = await Promise.all([
      Job.find(filter).populate('clientId', 'name email avgRating').populate('assignedFreelancerId', 'name email').sort(sortBy).skip(skip).limit(Number(limit)),
      Job.countDocuments(filter),
    ]);

    res.json({ success: true, count: jobs.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), jobs });
  } catch (error) { next(error); }
};

exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('clientId', 'name email avgRating totalReviews').populate('assignedFreelancerId', 'name email avgRating');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    let bids = [];
    if (req.user && String(job.clientId._id) === String(req.user._id)) {
      bids = await Bid.find({ jobId: job._id }).populate('freelancerId', 'name email avgRating totalReviews');
    }
    res.json({ success: true, job, bids });
  } catch (error) { next(error); }
};

exports.createJob = async (req, res, next) => {
  try {
    const { title, description, budgetMin, budgetMax, deadline, category, tags } = req.body;
    const job = await Job.create({
      title, description,
      budgetMin: Number(budgetMin), budgetMax: Number(budgetMax),
      deadline: new Date(deadline),
      clientId: req.user._id,
      category: category || 'General',
      tags: tags || [],
    });
    res.status(201).json({ success: true, job });
  } catch (error) { next(error); }
};

exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (String(job.clientId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (job.assignedFreelancerId) return res.status(400).json({ success: false, message: 'Cannot edit after freelancer is assigned' });
    const { title, description, budgetMin, budgetMax, deadline } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (budgetMin) updates.budgetMin = Number(budgetMin);
    if (budgetMax) updates.budgetMax = Number(budgetMax);
    if (deadline) updates.deadline = new Date(deadline);
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, job: updatedJob });
  } catch (error) { next(error); }
};

exports.markComplete = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (String(job.assignedFreelancerId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Only the assigned freelancer can mark this complete' });
    if (job.status !== 'in-progress') return res.status(400).json({ success: false, message: `Job status is "${job.status}"` });
    job.status = 'completed';
    await job.save();
    res.json({ success: true, message: 'Job marked as completed', job });
  } catch (error) { next(error); }
};
