import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Facebook, Youtube, Instagram } from 'react-bootstrap-icons';
import { LinkContainer } from 'react-router-bootstrap';

function Footer() {
  return (
    <footer className="bg-dark text-light mt-auto py-5">
      <Container>
        <Row className="gy-4">
          <Col md={6} lg={3}>
            <h5>LEMON FASHION</h5>
            <Nav className="flex-column">
              <LinkContainer to="/profile">
                <Nav.Link className="text-light p-0">Tài khoản Lemon</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/login">
                <Nav.Link className="text-light p-0">Đăng kí thành viên</Nav.Link>
              </LinkContainer>
            </Nav>
          </Col>

          <Col md={6} lg={3}>
            <h5>CHÍNH SÁCH</h5>
            <Nav className="flex-column">
              {/* --- ĐÃ SỬA: GẮN LINK CHÍNH SÁCH BẢO MẬT --- */}
              <LinkContainer to="/privacy-policy">
                <Nav.Link className="text-light p-0">Chính sách bảo mật</Nav.Link>
              </LinkContainer>
              {/* ------------------------------------------- */}
            </Nav>
          </Col>

          <Col md={6} lg={3}>
            <h5>CHĂM SÓC KHÁCH HÀNG</h5>
            <Nav className="flex-column">
              <LinkContainer to="/size-guide">
                 <Nav.Link className="text-light p-0">Hướng dẫn chọn size</Nav.Link>
              </LinkContainer>
            </Nav>
          </Col>

          <Col md={6} lg={3}>
            <h5>ĐỊA CHỈ LIÊN HỆ</h5>
            <address className="text-light" style={{ fontSize: '0.9rem' }}>
              Văn phòng TPHCM: 180 Cao Lỗ, phường 4, quận 8, TPHCM
            </address>
            <div>
              <Nav.Link href="#" className="text-light d-inline-block p-2 me-2"><Facebook size={20} /></Nav.Link>
              <Nav.Link href="#" className="text-light d-inline-block p-2 me-2"><Instagram size={20} /></Nav.Link>
              <Nav.Link href="#" className="text-light d-inline-block p-2"><Youtube size={20} /></Nav.Link>
            </div>
          </Col>
        </Row>
        <hr className="bg-light" />
        <p className="text-center text-light mb-0" style={{ fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} CÔNG TY TNHH STU
        </p>
      </Container>
    </footer>
  );
}

export default Footer;