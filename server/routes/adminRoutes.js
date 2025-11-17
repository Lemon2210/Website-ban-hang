const express = require('express');
const router = express.Router();

// --- (CẬP NHẬT DÒNG IMPORT) ---
const { 
  getAllOrders, 
  getAllProductsAdmin,
  createProduct, // <-- Thêm hàm mới
  checkSku,
  deleteInventory
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

router.post('/products/check-sku', protect, admin, checkSku);

router.delete('/products/:id', protect, admin, deleteInventory);
// --- (THÊM ROUTE MỚI NÀY VÀO) ---
/*
 * @route   POST /api/admin/products
 * @desc    Tạo sản phẩm mới
 */
router.post(
  '/products',
  protect,
  admin,
  upload.any(), 
  createProduct
);
// --- (HẾT ROUTE MỚI) ---

module.exports = router;