const express = require('express');
const router = express.Router();

const { getAllOrders } = require('../controllers/adminController');

// Import cả 2 "vệ sĩ"
const { protect, admin } = require('../middleware/authMiddleware');

/*
 * @route   GET /api/admin/orders
 * @desc    Định nghĩa tuyến đường lấy tất cả đơn hàng
 * @access  Private/Admin
 */
router.get(
  '/orders',
  protect, // Vệ sĩ cấp 1: Phải đăng nhập
  admin, // Vệ sĩ cấp 2: Phải là Admin
  getAllOrders // Nếu qua 2 cửa, mới được chạy hàm này
);

// (Sau này thêm các route khác)
// router.put('/orders/:id/status', protect, admin, updateOrderStatus);
// router.get('/stats/sales', protect, admin, getSalesStats);

module.exports = router;