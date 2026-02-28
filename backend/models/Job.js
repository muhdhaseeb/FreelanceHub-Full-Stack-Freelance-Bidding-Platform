const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
  budgetMin: { type: Number, required: true, min: 1 },
  budgetMax: {
    type: Number, required: true,
    validate: { validator: function(v) { return v >= this.budgetMin; }, message: 'budgetMax must be >= budgetMin' }
  },
  deadline: { type: Date, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedFreelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['open', 'in-progress', 'completed'], default: 'open' },
  category: { type: String, default: 'General' },
  tags: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now, index: true },
});

jobSchema.index({ clientId: 1, status: 1 });
module.exports = mongoose.model('Job', jobSchema);
