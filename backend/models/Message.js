const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  jobId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, default: '' },
  file: {
    url:          { type: String, default: null },
    originalName: { type: String, default: null },
    fileType:     { type: String, default: null },
    size:         { type: Number, default: null },
  },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);
