import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'sonner'; 

// Import Bố cục (Layouts)
import Header from './components/Header';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import ScrollToTopButton from './components/ScrollToTopButton';
import AdminLayout from './components/admin/AdminLayout'; 
import AdminSidebar from './components/admin/AdminSidebar';

// Import Trang Khách hàng (Client Pages)
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import { LoginPage } from './pages/LoginPage';
import { CartPage } from './pages/CartPage'; 
import { CheckoutPage } from './pages/CheckoutPage';
import ProfilePage from './pages/customer/ProfilePage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import { CategoryPage } from './pages/customer/CategoryPage'; // Trang danh mục cho khách xem
import SearchResultsPage from './pages/customer/SearchResultsPage';
import PaymentResultPage from './pages/customer/PaymentResultPage';

// Import Trang Admin (Admin Pages)
import DashboardPage from './pages/admin/DashboardPage';
import ProductListPage from './pages/admin/ProductListPage';
import OrderListPage from './pages/admin/OrderListPage';
import ProductCreatePage from './pages/admin/ProductCreatePage'; 
import ProductEditPage from './pages/admin/ProductEditPage'; 
import UserListPage from './pages/admin/UserListPage';
import CustomerListPage from './pages/admin/CustomerListPage';
import CouponManagementPage from './pages/admin/CouponManagementPage';
import ReviewListPage from './pages/admin/ReviewListPage';
import AdminCategoryPage from './pages/admin/CategoryPage'; // <-- IMPORT MỚI: Trang quản lý danh mục (Admin)

// --- "VỆ SĨ" BẢO VỆ ROUTE ---
const UserRoutes = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
const AdminRoutes = () => {
  const { user } = useAuth();
  return user && user.role === 'admin' ? (
    <Outlet /> 
  ) : (
    <Navigate to="/" replace /> 
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

const AdminContentLayout = () => (
  <div className="d-flex">
    <AdminSidebar />
    <div 
      className="flex-grow-1 p-4" 
      style={{ marginLeft: '250px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}
    >
      <Container fluid>
        <Outlet /> 
      </Container>
    </div>
  </div>
);

// --- APP CHÍNH ---
function App() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        {/* === 1. Bố cục Client === */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<HomePage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          
          {/* Các trang danh mục cho khách */}
          <Route path="men" element={<CategoryPage gender="Men" title="Thời Trang Nam" />} />
          <Route path="women" element={<CategoryPage gender="Women" title="Thời Trang Nữ" />} />
          <Route path="accessories" element={<CategoryPage category="Phụ kiện" title="Phụ Kiện" />} />
          
          <Route path="search" element={<SearchResultsPage />} />
          <Route path="payment-result" element={<PaymentResultPage />} />

          <Route 
            path="login" 
            element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
          />
          
          {/* Route cần đăng nhập */}
          <Route element={<UserRoutes />}>
            <Route path="cart" element={<CartPage />} /> 
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="my-orders" element={<MyOrdersPage />} />
          </Route>
        </Route>

        {/* === 2. Bố cục Admin === */}
        <Route 
          path="/admin"
          element={
            <AdminRoutes>
              <AdminLayout />
            </AdminRoutes>
          }
        >
          <Route element={<AdminContentLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Quản lý Sản phẩm */}
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/add" element={<ProductCreatePage />} /> 
            <Route path="products/edit/:id" element={<ProductEditPage />} /> 
            
            {/* Quản lý Danh mục (MỚI THÊM) */}
            <Route path="categories" element={<AdminCategoryPage />} />

            {/* Quản lý Đơn hàng & Khách hàng */}
            <Route path="orders" element={<OrderListPage />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="customers" element={<CustomerListPage />} />
            
            {/* Quản lý Marketing & Đánh giá */}
            <Route path="coupons" element={<CouponManagementPage />} />
            <Route path="reviews" element={<ReviewListPage />} />
          </Route>
        </Route>
        
        {/* Route 404 - Chuyển về trang chủ nếu không tìm thấy */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;