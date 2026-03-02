const stripe       = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment      = require('../models/Payment');
const Job          = require('../models/Job');
const Bid          = require('../models/Bid');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const logger       = require('../utils/logger');
const { sendPaymentReleased } = require('../utils/emailService');

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { jobId, bidId } = req.body;
    if (!jobId || !bidId) return res.status(400).json({ success: false, message: 'jobId and bidId required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (String(job.clientId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized' });

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });
    if (bid.status !== 'accepted') return res.status(400).json({ success: false, message: 'Bid must be accepted first' });

    const existing = await Payment.findOne({ jobId });
    if (existing) return res.json({ success: true, clientSecret: existing.stripeClientSecret, payment: existing });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(bid.amount * 100),
      currency: 'usd',
      metadata: { jobId: String(jobId), bidId: String(bidId), clientId: String(req.user._id), freelancerId: String(bid.freelancerId) },
      description: `Payment for job: ${job.title}`,
    });

    const payment = await Payment.create({
      jobId, clientId: req.user._id, freelancerId: bid.freelancerId,
      amount: bid.amount, stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret, status: 'pending',
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret, payment });
  } catch (error) { next(error); }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ success: false, message: 'paymentIntentId required' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded')
      return res.status(400).json({ success: false, message: `Payment not successful. Status: ${paymentIntent.status}` });

    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      { status: 'paid', paidAt: new Date() },
      { new: true }
    );
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: payment.freelancerId, type: 'new_message',
      message: `Payment of $${payment.amount} has been secured for your job.`,
      jobId: payment.jobId,
    });
    io.to(`user:${payment.freelancerId}`).emit('notification', notification);

    res.json({ success: true, message: 'Payment confirmed!', payment });
  } catch (error) { next(error); }
};

exports.releasePayment = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const payment = await Payment.findOne({ jobId });
    if (!payment) return res.status(404).json({ success: false, message: 'No payment found for this job' });
    if (String(payment.clientId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (payment.status !== 'paid') return res.status(400).json({ success: false, message: `Cannot release. Status: ${payment.status}` });

    const job = await Job.findById(jobId);
    if (job.status !== 'completed') return res.status(400).json({ success: false, message: 'Job must be completed before releasing payment' });

    payment.status = 'released';
    payment.releasedAt = new Date();
    await payment.save();

    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: payment.freelancerId, type: 'job_completed',
      message: `$${payment.amount} has been released to you!`,
      jobId: payment.jobId,
    });
    io.to(`user:${payment.freelancerId}`).emit('notification', notification);

    // Send email to freelancer
    const freelancer = await User.findById(payment.freelancerId).select('name email');
    if (freelancer) {
      sendPaymentReleased({
        to: freelancer.email,
        freelancerName: freelancer.name,
        jobTitle: job.title,
        amount: payment.amount,
      }).catch(err => logger.warn({ msg: 'Failed to send payment released email', error: err.message }));
    }

    res.json({ success: true, message: `$${payment.amount} released!`, payment });
  } catch (error) { next(error); }
};

exports.getPaymentForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const isClient = String(job.clientId) === String(req.user._id);
    const isFreelancer = String(job.assignedFreelancerId) === String(req.user._id);
    if (!isClient && !isFreelancer) return res.status(403).json({ success: false, message: 'Not authorized' });

    const payment = await Payment.findOne({ jobId });
    res.json({ success: true, payment });
  } catch (error) { next(error); }
};
