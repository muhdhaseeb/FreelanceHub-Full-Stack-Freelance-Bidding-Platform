const Review = require('../models/Review');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.submitReview = async (req, res, next) => {
  try {
    const { jobId, rating, comment } = req.body;
    if (!jobId || !rating || !comment) return res.status(400).json({ success: false, message: 'jobId, rating and comment are required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    if (comment.trim().length < 10) return res.status(400).json({ success: false, message: 'Comment must be at least 10 characters' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (String(job.clientId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Only the client can leave a review' });
    if (job.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only review completed jobs' });
    if (!job.assignedFreelancerId) return res.status(400).json({ success: false, message: 'No freelancer to review' });

    const existing = await Review.findOne({ jobId, clientId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this job' });

    const review = await Review.create({ jobId, clientId: req.user._id, freelancerId: job.assignedFreelancerId, rating: Number(rating), comment });

    // Update freelancer's avg rating
    const allReviews = await Review.find({ freelancerId: job.assignedFreelancerId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(job.assignedFreelancerId, { avgRating: Math.round(avgRating * 10) / 10, totalReviews: allReviews.length });

    // Notify freelancer
    const io = req.app.get('io');
    const notification = await Notification.create({ userId: job.assignedFreelancerId, type: 'new_review', message: `${req.user.name} left you a ${rating}-star review!`, jobId });
    io.to(`user:${job.assignedFreelancerId}`).emit('notification', notification);

    await review.populate('clientId', 'name profilePicture');
    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Already reviewed this job' });
    next(error);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ freelancerId: req.params.freelancerId }).populate('clientId', 'name profilePicture').sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) { next(error); }
};
