const express = require('express');
const router = express.Router();
const { createVnpayUrl, vnpayReturn } = require('../controllers/paymentController');

router.post('/create_payment_url', createVnpayUrl);
router.get('/vnpay_return', vnpayReturn);

module.exports = router;