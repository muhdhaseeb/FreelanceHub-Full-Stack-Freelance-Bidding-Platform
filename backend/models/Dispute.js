
const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  jobId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  raisedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  againstUser:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason:       { type: String, required: true, minlength: 20, maxlength: 1000 },
  status:       { type: String, enum: ['open', 'resolved'], default: 'open' },
  resolution:   { type: String, enum: ['refund_client', 'release_freelancer', 'cancel_job', null], default: null },
  resolvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:   { type: Date },
  adminNote:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
