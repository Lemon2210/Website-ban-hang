// server/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { // Ví dụ: "Áo Polo Basic"
    type: String,
    required: [true, 'Tên sản phẩm không được để trống'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Mô tả không được để trống'],
  },
  category: {
    main: { 
      type: String, 
      required: true, 
      trim: true // Ví dụ: 'Áo'
    },
    sub: { 
      type: String, 
      required: true, 
      trim: true // Ví dụ: 'Áo Polo'
    },
  },
  // Các trường chung khác có thể thêm sau (chất liệu, v.v.)
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;