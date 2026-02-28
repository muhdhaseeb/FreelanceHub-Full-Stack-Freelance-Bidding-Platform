const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminAuth');

// Public: admin login
router.post('/login', ctrl.adminLogin);

// All routes below require admin JWT
router.use(adminProtect);

router.get('/stats', ctrl.getStats);

// Users
router.get('/users',           ctrl.getUsers);
router.get('/users/:id',       ctrl.getUserDetail);
router.patch('/users/:id/ban', ctrl.banUser);
router.patch('/users/:id/unban', ctrl.unbanUser);
router.delete('/users/:id',    ctrl.deleteUser);

// Jobs
router.get('/jobs',                  ctrl.getJobs);
router.patch('/jobs/:id/cancel',     ctrl.cancelJob);

// Payments
router.get('/payments', ctrl.getPayments);

// Reviews
router.get('/reviews',       ctrl.getReviews);
router.delete('/reviews/:id', ctrl.deleteReview);

module.exports = router;
