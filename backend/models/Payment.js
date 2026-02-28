const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  jobId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  clientId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:             { type: Number, required: true },        // in dollars
  stripePaymentIntentId: { type: String, required: true, unique: true },
  stripeClientSecret: { type: String },
  // pending → paid → released → refunded
  status: {
    type: String,
    enum: ['pending', 'paid', 'released', 'refunded'],
    default: 'pending',
  },
  paidAt:     { type: Date },
  releasedAt: { type: Date },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
