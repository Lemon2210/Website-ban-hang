import React from 'react';
import { Nav } from 'react-bootstrap';
// Dùng LinkContainer để Nav.Link không F5 lại trang
import { LinkContainer } from 'react-router-bootstrap'; 
// Icons
import { HouseDoor, BoxSeam, ListCheck, Gear } from 'react-bootstrap-icons';

function AdminSidebar() {
  return (
    // Dùng class 'vh-100' (viewport height 100) để nó cao hết màn hình
    // 'position-fixed' để nó đứng yên khi cuộn
    <div 
      className="bg-dark text-white p-3 position-fixed" 
      style={{ width: '250px', height: '100vh' }}
    >
      <h4 className="text-center mb-4">Admin Panel</h4>
      
      <Nav className="flex-column">
        {/* Dùng Nav.Link của Bootstrap với LinkContainer */}
        
        <LinkContainer to="/admin/dashboard">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <HouseDoor size={20} className="me-2" />
            Tổng quan
          </Nav.Link>
        </LinkContainer>

        <LinkContainer to="/admin/products">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <BoxSeam size={20} className="me-2" />
            Quản lý Sản phẩm
          </Nav.Link>
        </LinkContainer>

        <LinkContainer to="/admin/orders">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <ListCheck size={20} className="me-2" />
            Quản lý Đơn hàng
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/admin/settings">
          <Nav.Link className="text-white d-flex align-items-center mb-2">
            <Gear size={20} className="me-2" />
            Cài đặt
          </Nav.Link>
        </LinkContainer>

      </Nav>
    </div>
  );
}

export default AdminSidebar;