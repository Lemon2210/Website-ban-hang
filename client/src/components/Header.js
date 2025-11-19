import React, { useState } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Search, Cart, Person } from 'react-bootstrap-icons';
import { LinkContainer } from 'react-router-bootstrap'; 
import { useAuth } from '../context/AuthContext';

// 1. IMPORT MODAL TÌM KIẾM
import SearchModal from './SearchModal';

function Header() {
  const { user, logout } = useAuth();
  
  // 2. STATE ĐỂ BẬT/TẮT MODAL
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header>
      <Navbar bg="light" expand="lg" className="shadow-sm" sticky="top">
        <Container>
          {/* Logo */}
          <LinkContainer to="/">
            <Navbar.Brand>
              <strong>FASHION</strong>
            </Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">
            {/* Menu chính */}
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
              {/*
              <LinkContainer to="/accessories">
                <Nav.Link>Phụ Kiện</Nav.Link>
              </LinkContainer>
              */}
            </Nav>

            {/* Các icon bên phải */}
            <Nav>
              {/* 3. NÚT TÌM KIẾM (ĐÃ CẬP NHẬT) */}
              {/* Bỏ LinkContainer, dùng onClick để mở Modal */}
              <Nav.Link 
                className="d-flex align-items-center" 
                onClick={() => setShowSearch(true)}
                style={{ cursor: 'pointer' }}
              >
                <Search className="me-1" />
                <span className="d-lg-none ms-2">Tìm kiếm</span>
              </Nav.Link>

              <LinkContainer to="/cart">
                <Nav.Link className="d-flex align-items-center">
                  <Cart className="me-1" />
                  <span className="d-lg-none ms-2">Giỏ hàng</span>
                </Nav.Link>
              </LinkContainer>
              
              {/* Logic Đăng nhập/Đăng xuất */}
              {user ? (
                <NavDropdown 
                  title={`Chào, ${user.name}`} 
                  id="username-dropdown" 
                  align="end"
                >
                  {user.role === 'admin' && (
                    <LinkContainer to="/admin">
                      <NavDropdown.Item>Trang Quản Trị</NavDropdown.Item>
                    </LinkContainer>
                  )}
                  <NavDropdown.Item onClick={handleLogout}>
                    Đăng xuất
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link className="d-flex align-items-center">
                    <Person className="me-1" />
                    <span className="d-lg-none ms-2">Tài khoản</span>
                  </Nav.Link>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* 4. ĐẶT MODAL TÌM KIẾM Ở ĐÂY */}
      <SearchModal show={showSearch} onHide={() => setShowSearch(false)} />
    </header>
  );
}

export default Header;