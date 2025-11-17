const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  // --- THÊM TRƯỜNG MỚI ---
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex', 'Kids'], // Các giá trị cho phép
    default: 'Unisex',
    required: true
  },
  // ----------------------
  category: {
    main: { type: String, required: true },
    sub: { type: String, required: true },
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;