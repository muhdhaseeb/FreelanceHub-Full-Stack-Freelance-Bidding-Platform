const express = require('express');
const router = express.Router();
const { getNotifications, markRead, markOneRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markRead);
router.patch('/:id/read', protect, markOneRead);
module.exports = router;
