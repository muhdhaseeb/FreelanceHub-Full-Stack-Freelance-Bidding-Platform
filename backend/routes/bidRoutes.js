const express = require('express');
const router = express.Router();
const { getBidsForJob, getMyBids, submitBid, acceptBid, rejectBid, cancelContract } = require('../controllers/bidController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateBid } = require('../middleware/validate');

router.get('/my', protect, restrictTo('freelancer'), getMyBids);
router.get('/', protect, restrictTo('client'), getBidsForJob);
router.post('/', protect, restrictTo('freelancer'), validateBid, submitBid);
router.patch('/:id/accept', protect, restrictTo('client'), acceptBid);
router.patch('/:id/reject', protect, restrictTo('client'), rejectBid);

// Cancel contract route (on the job)
router.post('/cancel/:jobId', protect, restrictTo('client'), cancelContract);

module.exports = router;
