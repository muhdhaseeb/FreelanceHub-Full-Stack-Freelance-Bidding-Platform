const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['client', 'freelancer', 'admin'], required: true },

  bio:            { type: String, maxlength: 500, default: '' },
  skills:         [{ type: String, trim: true }],
  portfolio:      [{ title: String, url: String, description: String }],
  profilePicture: { type: String, default: '' },
  location:       { type: String, default: '' },

  avgRating:    { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  // Admin controls
  isBanned:  { type: Boolean, default: false },
  bannedAt:  { type: Date },
  bannedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  banReason: { type: String, default: '' },

  // Soft delete
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },

  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
