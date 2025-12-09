const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Người tạo sản phẩm (Admin)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  // Ảnh đại diện chính của sản phẩm (hiển thị ở trang danh sách)
  image: {
    type: String,
    required: false,
  },
  // Giá cơ bản (hiển thị khi chưa chọn size/màu)
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex', 'Kids'],
    default: 'Unisex',
    required: true
  },
  
  // --- HỆ THỐNG DANH MỤC 3 CẤP ---
  category: { // Cấp 1: Danh mục Chính (VD: Áo)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  subCategory: { // Cấp 2: Danh mục Phụ (VD: Áo Polo)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
  },
  brand: { // Cấp 3: Thương hiệu (VD: Nike)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
  },
  // ------------------------------

  // --- HỆ THỐNG BIẾN THỂ (VARIANTS) ---
  // Lưu trữ chi tiết từng phiên bản: Màu Xanh Size M giá bao nhiêu, còn bao nhiêu cái...
  variants: [
    {
      sku: { type: String, required: true }, // Mã kho (VD: POLO-BLUE-M)
      price: { type: Number, required: true },
      quantity: { type: Number, default: 0 }, // Số lượng tồn kho
      attributes: {
        color: { type: String }, // Màu sắc
        size: { type: String }   // Kích cỡ
      },
      imageUrl: { type: String } // Ảnh riêng cho biến thể này (nếu có)
    }
  ],

  // Thống kê đánh giá (Review)
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
  numReviews: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);