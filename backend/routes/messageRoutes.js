const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/:jobId', protect, getMessages);
module.exports = router;
