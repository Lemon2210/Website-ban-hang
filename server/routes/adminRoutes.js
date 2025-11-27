const express = require('express');
const router = express.Router();

// --- (CẬP NHẬT DÒNG IMPORT) ---
const { 
  getAllOrders, 
  getAllProductsAdmin,
  createProduct, // <-- Thêm hàm mới
  checkSku,
  deleteInventory,
  updateProduct,
  getAllUsers,
  updateUserRole
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
// QUẢN LÝ TÀI KHOẢN
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);
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

router.put(
  '/products/:id', 
  protect, 
  admin, 
  upload.any(), // Cho phép upload ảnh mới nếu có
  updateProduct
);
// --- (HẾT ROUTE MỚI) ---

module.exports = router;