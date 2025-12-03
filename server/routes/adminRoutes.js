const express = require('express');
const router = express.Router();

const { 
  getAllOrders, 
  getAllProductsAdmin,
  createProduct,
  checkSku,
  deleteInventory,
  updateProduct,
  getAllUsers,
  updateUserRole,
  toggleUserLock,
  getUserHistory,
  updateOrderStatus,
  getAllReviews,
  deleteReview,
  getDashboardStats
} = require('../controllers/adminController');

const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- HÀM BẮT LỖI UPLOAD (DEBUG) ---
const uploadWithErrorHandling = (req, res, next) => {
  // Gọi hàm upload của multer
  const uploadMiddleware = upload.any();
  
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.log("------------------------------------------------");
      console.error("❌ LỖI UPLOAD ẢNH (MULTER/CLOUDINARY):");
      console.error(err); // In lỗi gốc
      
      // Kiểm tra lỗi Cloudinary cụ thể
      if (err.message && err.message.includes('Cloudinary')) {
        console.error("👉 GỢI Ý: Kiểm tra file .env xem đã điền API Key chưa?");
      }
      console.log("------------------------------------------------");

      return res.status(500).json({ 
        message: 'Lỗi Upload ảnh: ' + (err.message || 'Lỗi không xác định') 
      });
    }
    // Nếu không lỗi, đi tiếp đến controller
    next();
  });
};
// ----------------------------------

// --- QUẢN LÝ SẢN PHẨM ---
router.get('/products', protect, admin, getAllProductsAdmin);
router.post('/products/check-sku', protect, admin, checkSku);

// SỬ DỤNG HÀM BẮT LỖI MỚI Ở ĐÂY
router.post('/products', protect, admin, uploadWithErrorHandling, createProduct);

// (Các route khác cũng nên dùng nếu có upload, tạm thời giữ nguyên update)
router.put('/products/:id', protect, admin, uploadWithErrorHandling, updateProduct);

router.delete('/products/:id', protect, admin, deleteInventory);

// --- QUẢN LÝ ĐƠN HÀNG ---
router.get('/orders', protect, admin, getAllOrders);
router.put('/orders/:id/status', protect, admin, updateOrderStatus);

// --- QUẢN LÝ TÀI KHOẢN ---
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.put('/users/:id/lock', protect, admin, toggleUserLock);
router.get('/users/:id/history', protect, admin, getUserHistory);

// --- QUẢN LÝ ĐÁNH GIÁ ---
router.get('/reviews', protect, admin, getAllReviews);
router.delete('/reviews/:id', protect, admin, deleteReview);

// --- THỐNG KÊ ---
router.get('/stats', protect, admin, getDashboardStats);

module.exports = router;