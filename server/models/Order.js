// server/models/Order.js
const mongoose = require('mongoose');

// Chúng ta định nghĩa một schema con cho các sản phẩm trong đơn hàng
// Rất quan trọng: Chúng ta "sao chép" thông tin sản phẩm vào đây
// để đơn hàng không bị thay đổi nếu sau này sản phẩm gốc bị sửa/xóa.
const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Giá tại thời điểm mua
  imageUrl: { type: String },
  inventory: {
    // Chúng ta vẫn lưu ID của biến thể để tham chiếu nếu cần
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      // Người dùng đã đặt hàng
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema], // Danh sách các sản phẩm đã mua
    shippingAddress: {
      // Địa chỉ giao hàng tại thời điểm đặt
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    paymentMethod: {
      // Phương thức thanh toán (ví dụ: 'COD', 'Online')
      type: String,
      required: true,
    },
    totalPrice: {
      // Tổng giá trị cuối cùng của đơn hàng
      type: Number,
      required: true,
      min: 0,
    },
    isPaid: {
      // Đã thanh toán hay chưa (quan trọng cho thanh toán online)
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      // Thời điểm thanh toán
      type: Date,
    },
    status: {
      // Trạng thái đơn hàng cho admin theo dõi
      type: String,
      enum: ['Chờ xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'],
      default: 'Chờ xử lý',
    },
    deliveredAt: {
      // Thời điểm giao hàng thành công
      type: Date,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt (thời điểm đặt hàng)
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;