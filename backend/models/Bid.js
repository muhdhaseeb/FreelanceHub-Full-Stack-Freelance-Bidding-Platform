const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  proposal: { type: String, required: true, trim: true, minlength: 20, maxlength: 1000 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

bidSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });
module.exports = mongoose.model('Bid', bidSchema);
