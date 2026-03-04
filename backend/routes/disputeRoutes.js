
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/disputeController');
const { protect } = require('../middleware/auth');

router.post('/:jobId',  protect, ctrl.raiseDispute);
router.get('/:jobId',   protect, ctrl.getDispute);

module.exports = router;
