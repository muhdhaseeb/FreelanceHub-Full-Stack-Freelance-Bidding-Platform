const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment, releasePayment, getPaymentForJob } = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/create-intent',    protect, restrictTo('client'), createPaymentIntent);
router.post('/confirm',          protect, confirmPayment);
router.post('/release/:jobId',   protect, restrictTo('client'), releasePayment);
router.get('/job/:jobId',        protect, getPaymentForJob);

module.exports = router;
