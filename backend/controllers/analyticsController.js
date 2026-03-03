
const User    = require('../models/User');
const Job     = require('../models/Job');
const Bid     = require('../models/Bid');
const Payment = require('../models/Payment');

const generateBuckets = (days) => {
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({ date: d.toISOString().split('T')[0], count: 0, amount: 0 });
  }
  return buckets;
};

const formatLabel = (dateStr, days) => {
  const d = new Date(dateStr);
  if (days <= 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    if (![7, 30, 90].includes(days))
      return res.status(400).json({ success: false, message: 'Days must be 7, 30, or 90.' });

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const [users, jobs, bids, payments] = await Promise.all([
      User.find({ createdAt: { $gte: since }, isDeleted: { $ne: true } }, 'createdAt'),
      Job.find({ createdAt: { $gte: since } }, 'createdAt'),
      Bid.find({ createdAt: { $gte: since } }, 'createdAt'),
      Payment.find({ createdAt: { $gte: since }, status: 'released' }, 'createdAt amount'),
    ]);

    const userBuckets    = generateBuckets(days);
    const jobBuckets     = generateBuckets(days);
    const bidBuckets     = generateBuckets(days);
    const revenueBuckets = generateBuckets(days);

    const toKey = (d) => new Date(d).toISOString().split('T')[0];

    users.forEach(u => { const b = userBuckets.find(b => b.date === toKey(u.createdAt)); if (b) b.count++; });
    jobs.forEach(j => { const b = jobBuckets.find(b => b.date === toKey(j.createdAt)); if (b) b.count++; });
    bids.forEach(b => { const bk = bidBuckets.find(bk => bk.date === toKey(b.createdAt)); if (bk) bk.count++; });
    payments.forEach(p => { const b = revenueBuckets.find(b => b.date === toKey(p.createdAt)); if (b) { b.count++; b.amount += p.amount; } });

    const format = (buckets, valueKey) => buckets.map(b => ({
      label: formatLabel(b.date, days),
      value: valueKey === 'amount' ? parseFloat((b.amount / 100).toFixed(2)) : b.count,
    }));

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      days,
      summary: {
        newUsers:  users.length,
        newJobs:   jobs.length,
        newBids:   bids.length,
        revenue:   parseFloat((totalRevenue / 100).toFixed(2)),
      },
      charts: {
        revenue: format(revenueBuckets, 'amount'),
        users:   format(userBuckets, 'count'),
        jobs:    format(jobBuckets, 'count'),
        bids:    format(bidBuckets, 'count'),
      },
    });
  } catch (err) { next(err); }
};
