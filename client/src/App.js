import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';

// Import Bố cục (Layouts)
import Header from './components/Header';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import ScrollToTopButton from './components/ScrollToTopButton';
import AdminLayout from './components/admin/AdminLayout'; // <-- Import bố cục Admin

// Import Trang (Pages)
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import { LoginPage } from './pages/LoginPage';
import { CartPage } from './pages/CartPage'; 
import DashboardPage from './pages/admin/DashboardPage';
import ProductListPage from './pages/admin/ProductListPage';
import OrderListPage from './pages/admin/OrderListPage';
import ProductCreatePage from './pages/admin/ProductCreatePage'; 

// --- "VỆ SĨ" BẢO VỆ ROUTE ---
const UserRoutes = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
const AdminRoutes = () => {
  const { user } = useAuth();
  // Nếu đã đăng nhập VÀ role là 'admin', cho phép vào bố cục Admin
  return user && user.role === 'admin' ? (
    <AdminLayout /> // <-- Render BỐ CỤC ADMIN (với Sidebar)
  ) : (
    <Navigate to="/" replace /> // Nếu không, đá về trang chủ
  );
};

// --- BỐ CỤC CHUNG ---
const ClientLayout = () => (
  <>
    <Header />
    <main className="py-4">
      <Container>
        <Outlet /> 
      </Container>
    </main>
    <Footer />
    <ChatbotWidget />
    <ScrollToTopButton />
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
        <Route 
          path="login" 
          element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
        />
        {/* Các trang riêng tư của User */}
        <Route element={<UserRoutes />}>
          <Route path="cart" element={<CartPage />} /> 
        </Route>
      </Route>

      {/* === 2. Bố cục Admin === */}
      {/* Tất cả các route /admin/* sẽ được render bên trong Bố cục AdminLayout */}
      <Route path="/admin" element={<AdminRoutes />}> 
          {/* Các trang con của Admin sẽ được render vào <Outlet> của AdminLayout */}
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/add" element={<ProductCreatePage />} />
          <Route path="orders" element={<OrderListPage />} />
      </Route>
      
      {/* === 3. Trang 404 (Không tìm thấy) === */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;