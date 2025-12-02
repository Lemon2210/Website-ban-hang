const express = require('express');
const router = express.Router();
const { createCoupon, getAllCoupons, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public (hoặc chỉ cần đăng nhập user thường) để kiểm tra mã
router.post('/validate', protect, validateCoupon);

// Admin routes
router.post('/', protect, admin, createCoupon);
router.get('/', protect, admin, getAllCoupons);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;