const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, // Tự động viết hoa (ví dụ: sale50 -> SALE50)
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['percent', 'fixed'], // 'percent': giảm %, 'fixed': giảm số tiền cụ thể
    required: true 
  },
  value: { 
    type: Number, 
    required: true 
  },
  minOrderValue: { // Đơn hàng tối thiểu để áp dụng
    type: Number, 
    default: 0 
  },
  expirationDate: { // Ngày hết hạn
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // (Mở rộng sau này: áp dụng cho danh mục cụ thể)
  // applicableCategories: [{ type: String }] 
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);