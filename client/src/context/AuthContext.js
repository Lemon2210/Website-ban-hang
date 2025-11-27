import React, { createContext, useContext, useState } from 'react';
import api from '../api'; // Dùng 'api' thay vì 'axios' trực tiếp

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('userInfo')) || null
  );

  // --- (CẬP NHẬT: Nhận thêm captchaToken) ---
  const login = async (email, password, captchaToken) => {
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      // Gửi kèm captchaToken
      const { data } = await api.post(
        '/auth/login',
        { email, password, captchaToken }, 
        config
      );

      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return { success: true, user: data };
    } catch (error) {
      const message = error.response?.data?.message || "Email hoặc mật khẩu sai";
      return { success: false, message: message };
    }
  };

  // --- (CẬP NHẬT: Nhận thêm captchaToken) ---
  const register = async (name, email, password, captchaToken) => {
     try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      // Gửi kèm captchaToken
      const { data } = await api.post(
        '/auth/register',
        { name, email, password, captchaToken },
        config
      );

      return { success: true, user: data };
    } catch (error) {
       const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Email đã tồn tại hoặc không hợp lệ';
      return { success: false, message: message };
    }
  };

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

export const useAuth = () => {
  return useContext(AuthContext);
};