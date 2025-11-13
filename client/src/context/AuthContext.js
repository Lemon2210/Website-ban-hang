import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('userInfo')) || null
  );

  // Hàm Đăng nhập (Giữ nguyên)
  const login = async (email, password) => {
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post(
        '/api/auth/login',
        { email, password },
        config
      );

      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return { success: true, user: data };
    } catch (error) {
      const message = "Email hoặc mật khẩu sai";
      return { success: false, message: message };
    }
  };

  // Hàm Đăng ký (ĐÃ CẬP NHẬT)
  const register = async (name, email, password) => {
     try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      // Chỉ gọi API để tạo user, không làm gì thêm
      const { data } = await axios.post(
        '/api/auth/register',
        { name, email, password },
        config
      );

      // --- (ĐÃ XÓA 2 DÒNG TỰ ĐỘNG ĐĂNG NHẬP) ---
      
      return { success: true, user: data }; // Trả về thành công
    } catch (error) {
       const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Email đã tồn tại hoặc không hợp lệ';
      return { success: false, message: message };
    }
  };

  // Hàm Đăng xuất (Giữ nguyên)
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook tùy chỉnh (Giữ nguyên)
export const useAuth = () => {
  return useContext(AuthContext);
};