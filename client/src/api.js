import axios from 'axios';

// Lấy địa chỉ API backend của bạn từ log Render
const API_URL = 'https://website-ban-hang-ed1u.onrender.com'; //

// Kiểm tra xem chúng ta đang ở local hay trên mạng
const baseURL = process.env.NODE_ENV === 'production'
  ? `${API_URL}/api` // Nếu trên mạng (Vercel), dùng URL của Render
  : '/api';         // Nếu ở local, dùng proxy (giữ nguyên /api)

// Tạo một "instance" (phiên bản) axios đã được cấu hình
const api = axios.create({
  baseURL: baseURL
});

export default api;