const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Import thư viện mã hóa

// Schema cho từng món hàng trong giỏ
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

// Schema chính cho User
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
    
    // --- THÊM TRƯỜNG MỚI NÀY ---
    // Dùng để Admin khóa tài khoản vi phạm
    isLocked: { 
      type: Boolean, 
      default: false 
    }, 
    // ---------------------------

    cart: [cartItemSchema], // Giỏ hàng là một mảng các sản phẩm
  },
  {
    timestamps: true,
  }
);

// --- MÃ HÓA MẬT KHẨU TRƯỚC KHI LƯU ---
userSchema.pre('save', async function (next) {
  // Chỉ mã hóa mật khẩu nếu nó được thay đổi (hoặc là user mới)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// --- PHƯƠNG THỨC SO SÁNH MẬT KHẨU ---
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;