import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Search, Cart, Person } from 'react-bootstrap-icons';
// LinkContainer dùng để "bọc" Nav.Link, giúp React Router
// chuyển trang mà không F5 (tải lại)
import { LinkContainer } from 'react-router-bootstrap'; 
import { useAuth } from '../context/AuthContext'; // <-- IMPORT "BỘ NHỚ"

function Header() {
  // Lấy thông tin "user" và hàm "logout" từ "bộ nhớ"
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // (Không cần điều hướng, App.js sẽ tự lo)
  };

  return (
    <header>
      <Navbar bg="light" expand="lg" className="shadow-sm" sticky="top">
        <Container>
          {/* 1. Logo */}
          <LinkContainer to="/">
            <Navbar.Brand>
              <strong>FASHION</strong>
            </Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          {/* 2. Các link (đã bọc bằng LinkContainer) */}
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto">
              <LinkContainer to="/">
                <Nav.Link>Trang Chủ</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/men">
                <Nav.Link>Đồ Nam</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/women">
                <Nav.Link>Đồ Nữ</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/accessories">
                <Nav.Link>Phụ Kiện</Nav.Link>
              </LinkContainer>
            </Nav>

            {/* 3. Các icon bên phải */}
            <Nav>
              <LinkContainer to="/search">
                <Nav.Link className="d-flex align-items-center">
                  <Search className="me-1" />
                  <span className="d-lg-none ms-2">Tìm kiếm</span>
                </Nav.Link>
              </LinkContainer>
              <LinkContainer to="/cart">
                <Nav.Link className="d-flex align-items-center">
                  <Cart className="me-1" />
                  <span className="d-lg-none ms-2">Giỏ hàng</span>
                </Nav.Link>
              </LinkContainer>
              
              {/* --- LOGIC ĐĂNG NHẬP/ĐĂNG XUẤT --- */}
              {user ? (
                // Nếu ĐÃ ĐĂNG NHẬP
                <NavDropdown 
                  title={`Chào, ${user.name}`} 
                  id="username-dropdown" 
                  align="end"
                >
                  {/* Nếu là Admin, thêm link tới trang Admin */}
                  {user.role === 'admin' && (
                    <LinkContainer to="/admin">
                      <NavDropdown.Item>Trang Quản Trị</NavDropdown.Item>
                    </LinkContainer>
                  )}
                  
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>Tài khoản</NavDropdown.Item>
                  </LinkContainer>
                  
                  <NavDropdown.Divider />
                  
                  <NavDropdown.Item onClick={handleLogout}>
                    Đăng xuất
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                // Nếu CHƯA ĐĂNG NHẬP
                <LinkContainer to="/login">
                  <Nav.Link className="d-flex align-items-center">
                    <Person className="me-1" />
                    <span className="d-lg-none ms-2">Tài khoản</span>
                  </Nav.Link>
                </LinkContainer>
              )}
              {/* --- KẾT THÚC LOGIC --- */}
              
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header;