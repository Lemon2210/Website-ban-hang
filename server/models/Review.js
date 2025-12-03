const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  
  // --- SỬA ĐỔI Ở ĐÂY ---
  // Đổi required: true thành false (không bắt buộc)
  comment: { type: String, required: false }, 
  // --------------------
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Order',
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);