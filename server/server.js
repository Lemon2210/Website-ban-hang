const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// --- 1. CẤU HÌNH VÀ KHỞI TẠO ---
dotenv.config();
const app = express();

app.use(express.json());

// --- 2. CẤU HÌNH CORS ---
const allowedOrigins = [
  'http://localhost:3000', 
  'https://dh52200455.site',
  'https://www.dh52200455.site',
  'https://website-ban-hang-mu.vercel.app'
];

app.use(cors());


// --- 3. KẾT NỐI MONGODB ---
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
  console.error('❌ LỖI NGHIÊM TRỌNG: MONGODB_URI không được tìm thấy trong file .env');
  process.exit(1);
}
mongoose
  .connect(dbURI)
  .then(() => {
    console.log(`✅ Đã kết nối thành công tới MongoDB!`);
  })
  .catch((err) => {
    console.error('❌ LỖI KẾT NỐI MONGODB:', err.message);
    process.exit(1);
  });


// --- 4. ĐỊNH NGHĨA ROUTES ---
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API đang chạy!', status: 'success' });
});

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const couponRoutes = require('./routes/couponRoutes'); // <-- 1. IMPORT LẠI
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes); // <-- 2. SỬ DỤNG LẠI (Đường dẫn là /api/coupons)
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);

// --- 5. KHỞI CHẠY SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});