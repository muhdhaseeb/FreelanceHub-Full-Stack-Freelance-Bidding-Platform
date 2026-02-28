const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

reviewSchema.index({ jobId: 1, clientId: 1 }, { unique: true });
module.exports = mongoose.model('Review', reviewSchema);
