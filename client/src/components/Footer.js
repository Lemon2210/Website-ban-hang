import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Facebook, Youtube, Instagram } from 'react-bootstrap-icons';

// (Đây là layout mô phỏng lại ảnh footer của bạn)
function Footer() {
  return (
    <footer className="bg-dark text-light mt-auto py-5">
      <Container>
        <Row className="gy-4">
          <Col md={6} lg={3}>
            <h5>COOLCLUB</h5>
            <Nav className="flex-column">
              <Nav.Link href="#" className="text-light p-0">Tài khoản CoolClub</Nav.Link>
              <Nav.Link href="#" className="text-light p-0">Đăng kí thành viên</Nav.Link>
              <Nav.Link href="#" className="text-light p-0">Ưu đãi & Đặc quyền</Nav.Link>
            </Nav>
          </Col>

          <Col md={6} lg={3}>
            <h5>CHÍNH SÁCH</h5>
            <Nav className="flex-column">
              <Nav.Link href="#" className="text-light p-0">Chính sách đổi trả 60 ngày</Nav.Link>
              <Nav.Link href="#" className="text-light p-0">Chính sách khuyến mãi</Nav.Link>
              <Nav.Link href="#" className="text-light p-0">Chính sách bảo mật</Nav.Link>
            </Nav>
          </Col>

          <Col md={6} lg={3}>
            <h5>CHĂM SÓC KHÁCH HÀNG</h5>
            <Nav className="flex-column">
              <Nav.Link href="#" className="text-light p-0">Hỏi đáp - FAQs</Nav.Link>
              <Nav.Link href="#" className="text-light p-0">Hướng dẫn chọn size</Nav.Link>
              <Nav.Link href="#" className="text-light p-0">Blog</Nav.Link>
            </Nav>
          </Col>

          <Col md={6} lg={3}>
            <h5>ĐỊA CHỈ LIÊN HỆ</h5>
            <address className="text-light" style={{ fontSize: '0.9rem' }}>
              Văn phòng Hà Nội: Tầng 3-4, Tòa nhà BMM...<br />
              Trung tâm vận hành: Lô C8, KCN Lai Xá...<br />
              Văn phòng TPHCM: Lô C3, đường D2...
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
          &copy; {new Date().getFullYear()} CÔNG TY TNHH FASTECH ASIA
        </p>
      </Container>
    </footer>
  );
}

export default Footer;