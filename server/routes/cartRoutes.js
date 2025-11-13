const express = require('express');
const router = express.Router();

// Import cả 3 hàm từ controller
const { 
  addOrUpdateToCart, 
  getCart, 
  removeFromCart 
} = require('../controllers/cartController');

// Import "vệ sĩ"
const { protect } = require('../middleware/authMiddleware');

// Định nghĩa các tuyến đường
// Tất cả các tuyến đường này đều được "protect" (bảo vệ)
// Yêu cầu phải có Bearer Token hợp lệ

// URL: POST http://localhost:5000/api/cart/add
router.post('/add', protect, addOrUpdateToCart);

// URL: GET http://localhost:5000/api/cart
router.get('/', protect, getCart);

// URL: DELETE http://localhost:5000/api/cart/:id
// (với :id là ID của inventory)
router.delete('/:id', protect, removeFromCart);


module.exports = router;