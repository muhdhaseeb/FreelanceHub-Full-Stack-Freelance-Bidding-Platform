const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['new_bid', 'bid_accepted', 'bid_rejected', 'job_completed', 'new_message', 'new_review'],
    required: true,
  },
  message: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
});

notificationSchema.index({ userId: 1, read: 1 });
module.exports = mongoose.model('Notification', notificationSchema);
