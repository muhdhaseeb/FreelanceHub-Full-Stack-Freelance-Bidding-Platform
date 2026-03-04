
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/disputeController');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/',        adminProtect, ctrl.getAllDisputes);
router.patch('/:id/resolve', adminProtect, ctrl.resolveDispute);

module.exports = router;
