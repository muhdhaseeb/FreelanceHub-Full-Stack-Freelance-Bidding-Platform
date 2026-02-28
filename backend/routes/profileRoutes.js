const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.get('/:id', protect, getProfile);
router.patch('/me', protect, updateProfile);
module.exports = router;
