const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/jobController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/',              protect, ctrl.getJobs);
router.post('/',             protect, restrictTo('client'), ctrl.createJob);
router.get('/:id',           protect, ctrl.getJob);
router.patch('/:id/complete',protect, restrictTo('freelancer'), ctrl.markJobComplete);
router.patch('/:id/withdraw',protect, restrictTo('client'), ctrl.withdrawJob);

module.exports = router;
