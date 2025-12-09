import React from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap'; 
import { 
  HouseDoor, 
  BoxSeam, 
  ListCheck, 
  Gear, 
  People, 
  PersonBadge, 
  Star, 
  Tags, 
  BoxArrowRight, 
  BarChartLine, 
  Grid,
  Percent
} from 'react-bootstrap-icons'; 
import { Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

function AdminSidebar() {
  const { logout } = useAuth();

  return (
    <div 
      className="bg-dark text-white p-3 position-fixed d-flex flex-column" 
      style={{ width: '250px', height: '100vh', top: 0, left: 0, zIndex: 1000 }}
    >
      <h4 className="text-center mb-4 mt-2">Admin Panel</h4>
      
      <Nav className="flex-column flex-grow-1 overflow-auto">
        
        <LinkContainer to="/admin/dashboard">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <BarChartLine size={20} className="me-2" />
            Thống kê
          </Nav.Link>
        </LinkContainer>

        <LinkContainer to="/admin/products">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <BoxSeam size={20} className="me-2" />
            Quản lý Sản phẩm
          </Nav.Link>
        </LinkContainer>

        {/* --- 2. THÊM MỤC QUẢN LÝ DANH MỤC TẠI ĐÂY --- */}
        <LinkContainer to="/admin/categories">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <Grid size={20} className="me-2" />
            Quản lý Danh mục
          </Nav.Link>
        </LinkContainer>
        {/* ------------------------------------------- */}

        <LinkContainer to="/admin/orders">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <ListCheck size={20} className="me-2" />
            Quản lý Đơn hàng
          </Nav.Link>
        </LinkContainer>

        <LinkContainer to="/admin/users">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <People size={20} className="me-2" />
            Quản lý tài khoản
          </Nav.Link>
        </LinkContainer>

        <LinkContainer to="/admin/customers">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <PersonBadge size={20} className="me-2" />
            Quản lý khách hàng
          </Nav.Link>
        </LinkContainer>

        <LinkContainer to="/admin/promotions">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <Percent size={20} className="me-2" />
            Quản lý Khuyến mãi
          </Nav.Link>
        </LinkContainer>

        <LinkContainer to="/admin/coupons">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <Tags size={20} className="me-2" />
            Quản lý mã giảm giá
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/admin/reviews">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <Star size={20} className="me-2" />
            Quản lý đánh giá
          </Nav.Link>
        </LinkContainer>

        <div className="mt-4 border-top border-secondary pt-2">
            <LinkContainer to="/">
            <Nav.Link className="text-white d-flex align-items-center mb-2">
                <HouseDoor size={20} className="me-2" />
                Về Trang chủ
            </Nav.Link>
            </LinkContainer>
        </div>

      </Nav>

      <div className="mt-auto pt-3 border-top border-secondary">
        <Button 
          variant="outline-light" 
          className="w-100 d-flex align-items-center justify-content-center border-0"
          onClick={logout}
        >
          <BoxArrowRight size={20} className="me-2" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}

export default AdminSidebar;