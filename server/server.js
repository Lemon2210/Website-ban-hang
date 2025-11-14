const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // <-- 1. THÊM DÒNG NÀY

// --- 1. CẤU HÌNH VÀ KHỞI TẠO ---
dotenv.config();
const app = express();

// Middleware: Cho phép Express đọc JSON
app.use(express.json());

// --- 2. CẤU HÌNH CORS (RẤT QUAN TRỌNG) ---
// Thêm các "client" (frontend) được phép gọi API
const allowedOrigins = [
  'http://localhost:3000', // Cho máy local của bạn
  'https://dh52200455.site', // Cho domain chính của bạn
  'https://website-ban-hang-mu.vercel.app' // Cho domain Vercel
];

app.use(cors({
  origin: function (origin, callback) {
    // (Cho phép cả các request không có origin, như Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // (Nếu domain không có trong danh sách, từ chối)
      callback(new Error('Domain này không được phép truy cập (CORS)'));
    }
  }
}));
// --- HẾT CẤU HÌNH CORS ---


// --- 3. KẾT NỐI CƠ SỞ DỮ LIỆU MONGODB ---
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
  // (Lỗi và code kết nối CSDL giữ nguyên)
  console.error('❌ LỖI NGHIÊM TRỌNG: MONGODB_URI không được tìm thấy trong file .env');
  process.exit(1);
}

mongoose
  .connect(dbURI)
  .then(() => {
    console.log(`✅ Đã kết nối thành công tới MongoDB!`);
    console.log(`-----------------------------------------------`);
  })
  .catch((err) => {
    console.error('❌ LỖI KẾT NỐI MONGODB:', err.message);
    process.exit(1);
  });

// --- 4. ĐỊNH NGHĨA CÁC TUYẾN ĐƯỜNG API (ROUTES) ---
// (Giữ nguyên toàn bộ code import và app.use các routes của bạn)
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);

// --- 5. KHỞI CHẠY SERVER ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`-----------------------------------------------`);
  console.log(`🚀 Server đang chạy (listening) trên cổng ${PORT}`);
});