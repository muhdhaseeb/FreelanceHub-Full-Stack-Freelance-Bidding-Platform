
const Payment = require('../models/Payment');
const Bid     = require('../models/Bid');
const Job     = require('../models/Job');

const generateBuckets = (days) => {
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({ date: d.toISOString().split('T')[0], amount: 0 });
  }
  return buckets;
};

const formatLabel = (dateStr, days) => {
  const d = new Date(dateStr);
  if (days <= 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

exports.getEarnings = async (req, res, next) => {
  try {
    const freelancerId = req.user._id;
    const days = parseInt(req.query.days) || 30;
    if (![7, 30, 90].includes(days))
      return res.status(400).json({ success: false, message: 'Days must be 7, 30, or 90.' });

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // All released payments for this freelancer
    const [allPayments, recentPayments, pendingPayments, allBids, completedJobs] = await Promise.all([
      Payment.find({ freelancerId, status: 'released' }, 'amount createdAt'),
      Payment.find({ freelancerId, status: 'released', createdAt: { $gte: since } }, 'amount createdAt'),
      Payment.find({ freelancerId, status: 'paid' }, 'amount'),
      Bid.find({ freelancerId }, 'status'),
      Job.countDocuments({ assignedFreelancerId: freelancerId, status: 'completed' }),
    ]);

    // Total earned all time
    const totalEarned = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // Pending (in escrow)
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // Earnings chart
    const buckets = generateBuckets(days);
    const toKey = (d) => new Date(d).toISOString().split('T')[0];
    recentPayments.forEach(p => {
      const b = buckets.find(b => b.date === toKey(p.createdAt));
      if (b) b.amount += p.amount;
    });

    const chart = buckets.map(b => ({
      label: formatLabel(b.date, days),
      value: parseFloat((b.amount / 100).toFixed(2)),
    }));

    // Recent earnings list
    const recentList = await Payment.find({ freelancerId, status: 'released' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('jobId', 'title');

    res.json({
      success: true,
      summary: {
        totalEarned:    parseFloat((totalEarned / 100).toFixed(2)),
        pendingAmount:  parseFloat((pendingAmount / 100).toFixed(2)),
        jobsCompleted:  completedJobs,
        periodEarned:   parseFloat((recentPayments.reduce((s, p) => s + p.amount, 0) / 100).toFixed(2)),
      },
      chart,
      recentPayments: recentList.map(p => ({
        _id:       p._id,
        amount:    parseFloat((p.amount / 100).toFixed(2)),
        jobTitle:  p.jobId?.title || 'Unknown Job',
        jobId:     p.jobId?._id,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) { next(err); }
};
