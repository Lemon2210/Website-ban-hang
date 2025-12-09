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
  getDashboardStats,
  updateBulkDiscounts,
  fixDataError
} = require('../controllers/adminController');

const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- HÀM BẮT LỖI UPLOAD (DEBUG) ---
const uploadWithErrorHandling = (req, res, next) => {
  const uploadMiddleware = upload.any();
  
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.log("------------------------------------------------");
      console.error("❌ LỖI UPLOAD ẢNH (MULTER/CLOUDINARY):");
      console.error(err); 
      
      if (err.message && err.message.includes('Cloudinary')) {
        console.error("👉 GỢI Ý: Kiểm tra file .env xem đã điền API Key chưa?");
      }
      console.log("------------------------------------------------");

      return res.status(500).json({ 
        message: 'Lỗi Upload ảnh: ' + (err.message || 'Lỗi không xác định') 
      });
    }
    next();
  });
};
// ----------------------------------

// Route chạy fix lỗi
router.get('/fix-data', protect, admin, fixDataError);

// --- QUẢN LÝ SẢN PHẨM ---

// 1. Lấy danh sách & Check SKU
router.get('/products', protect, admin, getAllProductsAdmin);
router.post('/products/check-sku', protect, admin, checkSku);

// 2. Cập nhật Giảm giá hàng loạt 
// (QUAN TRỌNG: Phải đặt dòng này TRƯỚC route /:id để tránh xung đột đường dẫn)
router.put('/products/bulk-discount', protect, admin, updateBulkDiscounts);

// 3. Tạo sản phẩm mới
router.post('/products', protect, admin, uploadWithErrorHandling, createProduct);

// 4. Cập nhật 1 sản phẩm cụ thể (Route này có :id nên phải nằm dưới các route cụ thể khác)
router.put('/products/:id', protect, admin, uploadWithErrorHandling, updateProduct);

// 5. Xóa sản phẩm
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