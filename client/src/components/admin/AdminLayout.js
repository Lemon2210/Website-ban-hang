import React from 'react';
import { Outlet } from 'react-router-dom'; // Outlet là nơi các trang con (như Dashboard) sẽ render
import AdminSidebar from './AdminSidebar';
import { Container } from 'react-bootstrap';

function AdminLayout() {
  return (
    // Bố cục D-Flex (Sidebar + Nội dung)
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      
      {/* Cột 1: Sidebar (đã tạo ở trên) */}
      <AdminSidebar />
      
      {/* Cột 2: Nội dung chính */}
      <div 
        className="flex-grow-1 p-4" 
        style={{ marginLeft: '250px', backgroundColor: '#f8f9fa' }} // 250px là độ rộng của Sidebar
      >
        {/* Container để nội dung không bị sát lề */}
        <Container fluid>
          <Outlet /> {/* Đây là nơi trang Dashboard, Orders... sẽ hiện ra */}
        </Container>
      </div>
    </div>
  );
}

export default AdminLayout;