const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  timestamp: { type: Date, default: Date.now, index: true },
});

messageSchema.index({ jobId: 1, timestamp: 1 });
module.exports = mongoose.model('Message', messageSchema);
