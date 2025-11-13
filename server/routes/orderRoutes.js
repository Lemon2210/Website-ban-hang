const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// "Khi có yêu cầu POST tới '/', HÃY "BẢO VỆ" (protect)
// và sau đó gọi hàm createOrder"
//
// URL: POST http://localhost:5000/api/orders
router.post('/', protect, createOrder);

// (Sau này chúng ta có thể thêm các route khác ở đây)
// Ví dụ:
// router.get('/myorders', protect, getMyOrders);
// router.get('/:id', protect, getOrderById);


module.exports = router;