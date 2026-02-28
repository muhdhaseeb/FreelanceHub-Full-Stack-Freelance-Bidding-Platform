const User = require('../models/User');
const Review = require('../models/Review');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const reviews = await Review.find({ freelancerId: req.params.id }).populate('clientId', 'name profilePicture').sort({ createdAt: -1 });
    res.json({ success: true, user, reviews });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills, location, portfolio, profilePicture } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (skills) updates.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    if (location !== undefined) updates.location = location;
    if (portfolio) updates.portfolio = portfolio;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) { next(error); }
};
