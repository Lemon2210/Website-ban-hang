const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        imageUrl: { type: String, required: true },
        price: { type: Number, required: true },
        inventory: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Inventory',
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true, // 'COD' hoặc 'VNPAY'
    },
    // --- CẬP NHẬT: QUẢN LÝ TRẠNG THÁI THANH TOÁN ĐỘC LẬP ---
    paymentStatus: {
        type: String,
        required: true,
        default: 'Unpaid',
        enum: ['Unpaid', 'Paid', 'Refunded', 'Failed'] // Chưa thanh toán, Đã TT, Hoàn tiền, Lỗi
    },
    // -------------------------------------------------------
    couponCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    // Trạng thái vận đơn (Độc lập với thanh toán)
    status: {
      type: String,
      required: true,
      default: 'Pending',
      enum: ['Pending', 'Processing', 'Shipping', 'Delivered', 'Cancelled'], 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);