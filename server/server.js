/*
================================================
|   FILE: server/server.js
|   MÔ TẢ: File khởi động chính của Backend.
================================================
*/

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// --- 1. CẤU HÌNH VÀ KHỞI TẠO ---
dotenv.config();
const app = express();

// Middleware: Cho phép Express đọc và xử lý JSON
// (PHẢI ĐẶT TRƯỚC TẤT CẢ CÁC ROUTES)
app.use(express.json());

// --- 2. KẾT NỐI CƠ SỞ DỮ LIỆU MONGODB ---
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
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

// --- 3. ĐỊNH NGHĨA CÁC TUYẾN ĐƯỜNG API (ROUTES) ---

// Route kiểm tra sức khỏe
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Chào mừng đến với API Shop Thời Trang!',
    status: 'success',
  });
});

// "Import" các file tuyến đường
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- THÊM DÒNG NÀY

// "Sử dụng" các tuyến đường
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes); // <-- THÊM DÒNG NÀY

// --- 4. KHỞI CHẠY SERVER ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`-----------------------------------------------`);
  console.log(`🚀 Server đang chạy (listening) trên cổng ${PORT}`);
});