const express = require('express');
const router = express.Router();
const { submitReview, getReviews } = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('client'), submitReview);
router.get('/:freelancerId', protect, getReviews);
module.exports = router;
