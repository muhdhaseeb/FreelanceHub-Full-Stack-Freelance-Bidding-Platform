const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
  description: { type: String, required: true, minlength: 20, maxlength: 2000 },
  budgetMin:   { type: Number, required: true, min: 1 },
  budgetMax:   { type: Number, required: true, min: 1 },
  deadline:    { type: Date, required: true },
  clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedFreelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:      { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' },
  category:    { type: String, default: 'General' },
  tags:        [{ type: String }],
  hasDispute:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
