const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Tạo đơn hàng
router.post('/', protect, createOrder);

// Lấy danh sách đơn của tôi
router.get('/myorders', protect, getMyOrders);

// --- (THÊM ROUTE MỚI) ---
// Lấy chi tiết 1 đơn (để xem trong Modal)
router.get('/:id', protect, getOrderById);

// Hủy đơn hàng
router.put('/:id/cancel', protect, cancelOrder);
// -----------------------

module.exports = router;