
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/analyticsController');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/', adminProtect, ctrl.getAnalytics);

module.exports = router;
