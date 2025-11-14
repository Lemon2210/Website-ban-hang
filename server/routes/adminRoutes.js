const express = require('express');
const router = express.Router();

// --- (CẬP NHẬT DÒNG IMPORT) ---
const { 
  getAllOrders, 
  getAllProductsAdmin,
  createProduct // <-- Thêm hàm mới
} = require('../controllers/adminController');

// Import các "vệ sĩ"
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // <-- IMPORT VỆ SĨ UPLOAD

/*
 * @route   GET /api/admin/orders
 */
router.get('/orders', protect, admin, getAllOrders);

/*
 * @route   GET /api/admin/products
 */
router.get('/products', protect, admin, getAllProductsAdmin);

// --- (THÊM ROUTE MỚI NÀY VÀO) ---
/*
 * @route   POST /api/admin/products
 * @desc    Tạo sản phẩm mới
 */
router.post(
  '/products',
  protect, // 1. Phải đăng nhập
  admin,   // 2. Phải là Admin
  upload.single('image'), // 3. Bắt lấy file tên là 'image' và upload
  createProduct // 4. Chạy logic tạo sản phẩm
);
// --- (HẾT ROUTE MỚI) ---

module.exports = router;