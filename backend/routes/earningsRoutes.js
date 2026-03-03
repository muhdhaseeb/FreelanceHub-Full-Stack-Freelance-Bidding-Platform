
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/earningsController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', protect, restrictTo('freelancer'), ctrl.getEarnings);

module.exports = router;
