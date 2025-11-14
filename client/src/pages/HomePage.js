import React, { useState, useEffect } from 'react';
import api from '../api';
import { Container, Carousel, Row, Col, Button } from 'react-bootstrap';

//banner
import firstSlide from '../assets/images/nam.png';

// (Chúng ta sẽ tạo 2 file này ngay sau đây)
import ProductCard from '../components/ProductCard';
import CategoryTabs from '../components/CategoryTabs';

function HomePage() {
  // === STATE QUẢN LÝ DỮ LIỆU ===
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // === GỌI API ĐỂ LẤY SẢN PHẨM ===
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // "proxy" trong package.json sẽ chuyển hướng /api/products
        const { data } = await api.get('/products');
        
        // Xáo trộn mảng data và lưu vào state
        const shuffled = data.sort(() => 0.5 - Math.random());
        setProducts(shuffled);
        
        setLoading(false);
      } catch (err) {
        setError('Không thể tải sản phẩm.');
        setLoading(false);
        console.error("Lỗi khi fetch sản phẩm:", err);
      }
    };

    fetchProducts();
  }, []); // [] = Chạy 1 lần khi trang tải

  // === RENDER SẢN PHẨM NGẪU NHIÊN ===
  const renderFeaturedProducts = () => {
    if (loading) return <p>Đang tải sản phẩm...</p>;
    if (error) return <p className="text-danger">{error}</p>;

    // Lấy 4 sản phẩm đầu tiên từ mảng đã xáo trộn
    return products.slice(0, 4).map((productItem) => (
      // productItem ở đây là một inventory item
      <Col key={productItem._id} sm={6} md={4} lg={3} className="mb-3">
        {/* Gọi component ProductCard (sẽ tạo ở bước sau) */}
        <ProductCard product={productItem} />
      </Col>
    ));
  };


  // === GIAO DIỆN RENDER ===
  return (
    // Dùng React.Fragment vì có nhiều section
    <>
      {/* 1. BANNER CAROUSEL */}
      {/* interval={2000} = tự động trượt mỗi 2 giây */}
      <Carousel interval={2000} className="mb-5">
        <Carousel.Item>
          {/* (Chúng ta sẽ thay bằng Link của react-router-dom sau) */}
          <a href="/collection/fall-winter">
            <img
              className="d-block w-100"
              src={firstSlide}
              alt="First slide"
            />
          </a>
        </Carousel.Item>
        <Carousel.Item>
          <a href="/collection/new-arrivals">
            <img
              className="d-block w-100"
              src={firstSlide}
              alt="Second slide"
            />
          </a>
        </Carousel.Item>
        <Carousel.Item>
          <a href="/collection/sale">
            <img
              className="d-block w-100"
              src={firstSlide}
              alt="Third slide"
            />
          </a>
        </Carousel.Item>
      </Carousel>

      {/* 2. TAB DANH MỤC NAM/NỮ */}
      <Container className="mb-5">
        <CategoryTabs />
      </Container>

      {/* 3. BANNER TĨNH (ĐỒ CHẠY BỘ) */}
      <Container fluid className="bg-primary text-light p-5 mb-5">
        <Row className="align-items-center">
          <Col md={6}>
            <h1 className="display-4">ĐỒ CHẠY BỘ</h1>
            <p>Sản phẩm mới của Lemon Fashion</p>
            <Button variant="light" href="/phu-kien">MUA NGAY</Button>
          </Col>
          <Col md={6}>
            {/* (Bạn có thể thay <img> bằng hình của bạn) */}
            <img 
              src="https://via.placeholder.com/500x300/FFF/000?text=Hinh+Anh+Nguoi+Mau" 
              alt="Đồ chạy bộ" 
              className="img-fluid"
            />
          </Col>
        </Row>
      </Container>

      {/* 4. SẢN PHẨM ĐỀ XUẤT (NGẪU NHIÊN) */}
      <Container className="mb-5">
        <h2 className="mb-4">SẢN PHẨM ĐỀ XUẤT</h2>
        <Row>
          {renderFeaturedProducts()}
        </Row>
      </Container>
    </>
  );
}

export default HomePage;