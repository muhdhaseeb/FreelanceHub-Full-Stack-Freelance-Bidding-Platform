const express = require('express');
const router = express.Router();
const { getJobs, getJob, createJob, updateJob, markComplete } = require('../controllers/jobController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateJob } = require('../middleware/validate');

router.get('/', protect, getJobs);
router.get('/:id', protect, getJob);
router.post('/', protect, restrictTo('client'), validateJob, createJob);
router.patch('/:id', protect, restrictTo('client'), updateJob);
router.patch('/:id/complete', protect, restrictTo('freelancer'), markComplete);
module.exports = router;
