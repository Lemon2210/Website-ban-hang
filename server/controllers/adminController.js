const Order = require('../models/Order');

/*
 * @route   GET /api/admin/orders
 * @desc    Admin lấy TẤT CẢ đơn hàng
 * @access  Private/Admin
 */
const getAllOrders = async (req, res) => {
  try {
    // Tìm tất cả đơn hàng, và "populate" thông tin user
    // (Chỉ lấy id, name, email của user, không lấy mật khẩu hay giỏ hàng)
    const orders = await Order.find({}).populate('user', 'id name email');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Lỗi khi Admin lấy đơn hàng:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// (Sau này chúng ta sẽ thêm các hàm khác vào đây, ví dụ:)
// const updateOrderStatus = async (req, res) => { ... }
// const getSalesStats = async (req, res) => { ... }

module.exports = {
  getAllOrders,
};