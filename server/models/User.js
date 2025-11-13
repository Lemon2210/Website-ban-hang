// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Import thư viện mã hóa

const cartItemSchema = new mongoose.Schema({
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory', // Tham chiếu đến một biến thể (SKU, màu, size) cụ thể
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Số lượng phải lớn hơn 0'],
  },
  // Chúng ta cũng có thể lưu giá tại thời điểm thêm vào giỏ
  // priceAtTime: { type: Number, required: true } 
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên không được để trống'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email không được để trống'],
      unique: true, // Email phải là duy nhất để đăng nhập
      lowercase: true, // Tự động chuyển email về chữ thường
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu không được để trống'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // Vai trò chỉ có thể là 'user' hoặc 'admin'
      default: 'user', // Mặc định là 'user'
    },
    cart: [cartItemSchema], // Giỏ hàng là một mảng các sản phẩm
  },
  {
    timestamps: true,
  }
);

// --- MÃ HÓA MẬT KHẨU TRƯỚC KHI LƯU ---
// Đây là một "pre-save hook" của Mongoose
// Nó sẽ tự động chạy trước khi một user mới được lưu vào database
userSchema.pre('save', async function (next) {
  // Chỉ mã hóa mật khẩu nếu nó được thay đổi (hoặc là user mới)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // "Salt" là một chuỗi ngẫu nhiên thêm vào để tăng bảo mật
    const salt = await bcrypt.genSalt(10);
    // Thay thế mật khẩu gốc bằng mật khẩu đã được mã hóa
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// --- PHƯƠNG THỨC SO SÁNH MẬT KHẨU ---
// Thêm một phương thức (method) vào model User để kiểm tra mật khẩu khi đăng nhập
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;