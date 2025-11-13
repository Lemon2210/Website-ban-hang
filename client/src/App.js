import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from './context/AuthContext'; // Import "bộ nhớ"

// Import Bố cục
import Header from './components/Header';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import ScrollToTopButton from './components/ScrollToTopButton';

// Import Trang
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import { LoginPage } from './pages/LoginPage';
// (Chúng ta sẽ tạo các trang Admin sau)
// import DashboardPage from './pages/admin/DashboardPage'; 

// --- "VỆ SĨ" BẢO VỆ ROUTE ---

// "Vệ sĩ" cho User: Đã đăng nhập?
const UserRoutes = () => {
  const { user } = useAuth();
  // Nếu đã đăng nhập (bất kể role là gì), cho phép vào
  // Nếu chưa, điều hướng về /login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// "Vệ sĩ" cho Admin: Đã đăng nhập VÀ là admin?
const AdminRoutes = () => {
  const { user } = useAuth();
  // Nếu đã đăng nhập VÀ role là 'admin', cho phép vào
  return user && user.role === 'admin' ? (
    <Outlet /> 
  ) : (
    // Nếu không, đá về trang chủ
    <Navigate to="/" replace /> 
  );
};

// --- BỐ CỤC CHUNG ---
// Bố cục cho Khách hàng (Luôn có Header, Footer,...)
const ClientLayout = () => (
  <>
    <Header />
    <main className="py-4">
      <Container>
        <Outlet /> {/* Các trang con sẽ được render ở đây */}
      </Container>
    </main>
    <Footer />
    <ChatbotWidget />
    <ScrollToTopButton />
  </>
);

// (Bố cục cho Admin - chúng ta sẽ làm sau)
const AdminLayout = () => (
  <>
    <Header /> {/* (Sau này sẽ thay bằng AdminHeader/Sidebar) */}
    <main className="py-4">
      <Container>
        <h1>Đây là trang Admin (Layout)</h1>
        <Outlet /> {/* Các trang con của Admin render ở đây */}
      </Container>
    </main>
    <Footer />
  </>
);


// --- APP CHÍNH ---
function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* === 1. Bố cục Client (Mặc định) === */}
      <Route path="/" element={<ClientLayout />}>
        {/* Các trang công khai */}
        <Route index element={<HomePage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />

        {/* Trang đăng nhập (Nếu chưa login thì vào, nếu rồi thì về home) */}
        <Route 
          path="login" 
          element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
        />

        {/* Các trang riêng tư của User (phải đăng nhập) */}
        <Route element={<UserRoutes />}>
          {/* (Thêm các trang như Giỏ hàng, Thanh toán vào đây) */}
          {/* <Route path="cart" element={<CartPage />} /> */}
          {/* <Route path="checkout" element={<CheckoutPage />} /> */}
          {/* <Route path="profile" element={<ProfilePage />} /> */}
        </Route>
      </Route>

      {/* === 2. Bố cục Admin === */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* Các trang riêng tư của Admin */}
        <Route element={<AdminRoutes />}>
          {/* <Route index element={<DashboardPage />} /> */}
          {/* <Route path="orders" element={<OrdersPage />} /> */}
          {/* <Route path="products" element={<ProductManagementPage />} /> */}
        </Route>
      </Route>
      
      {/* === 3. Trang 404 (Không tìm thấy) === */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;