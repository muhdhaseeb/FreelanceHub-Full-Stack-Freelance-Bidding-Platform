const Message = require('../models/Message');
const Job = require('../models/Job');

exports.getMessages = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    const isClient = String(job.clientId) === String(req.user._id);
    const isAssignedFreelancer = String(job.assignedFreelancerId) === String(req.user._id);
    if (!isClient && !isAssignedFreelancer) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (job.status !== 'in-progress') return res.json({ success: true, messages: [] });
    const messages = await Message.find({ jobId }).populate('senderId', 'name role').sort({ timestamp: 1 }).limit(200);
    res.json({ success: true, count: messages.length, messages });
  } catch (error) { next(error); }
};
