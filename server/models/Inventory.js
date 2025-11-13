// server/models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  // Liên kết đến sản phẩm gốc
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Tham chiếu đến Model 'Product'
    required: true,
  },
  sku: { // SKU riêng cho từng biến thể
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  attributes: {
    color: { type: String, required: true, trim: true }, // Ví dụ: 'Trắng'
    size: { type: String, required: true, trim: true },  // Ví dụ: 'S'
  },
  imageUrl: { // Ảnh cho từng biến thể (ví dụ: ảnh cho từng màu)
    type: String,
  },
  // --- TỒN KHO CHI TIẾT THEO CỬA HÀNG ---
  stock: [
    {
      store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store', // Sẽ tham chiếu đến Model 'Store' chúng ta sắp tạo
        required: true
      },
      quantity: { // Số lượng tồn kho TẠI cửa hàng đó
        type: Number,
        required: true,
        min: 0,
        default: 0
      }
    }
  ],
}, {
  timestamps: true,
});

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;