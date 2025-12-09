import React, { useState, useEffect } from 'react';
import api from '../api';
import { Container, Carousel, Row, Col, Button, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom'; 

// Banner Images
import firstSlide from '../assets/images/nam.png';
import secondSlide from '../assets/images/nu.png';
import thirdSlide from '../assets/images/bannernam.png';
import fourthSlide from '../assets/images/walk.png';
import promoBanner from '../assets/images/HomePage/Frame-88072td.png'; 

import ProductCard from '../components/ProductCard';
import CategoryTabs from '../components/CategoryTabs';

function HomePage() {
  const [newArrivals, setNewArrivals] = useState([]); 
  const [saleProducts, setSaleProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/products');
        
        // 1. Lọc 4 Sản phẩm Mới nhất
        const sortedByDate = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNewArrivals(sortedByDate.slice(0, 4));

        // 2. Lọc 4 Sản phẩm Khuyến mãi ngẫu nhiên
        const discountedItems = data.filter(p => p.discount > 0);
        const shuffledSale = discountedItems.sort(() => 0.5 - Math.random());
        setSaleProducts(shuffledSale.slice(0, 4));
        
        setLoading(false);
      } catch (err) {
        setError('Không thể tải sản phẩm.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const renderProductList = (products) => {
    if (loading) return <div className="text-center py-5">Đang tải sản phẩm...</div>;
    if (error) return <p className="text-danger">{error}</p>;
    if (products.length === 0) return <p className="text-muted text-center">Chưa có sản phẩm nào.</p>;

    return products.map((productItem) => (
      <Col key={productItem._id} xs={6} md={4} lg={3} className="mb-4">
        <ProductCard product={productItem} />
      </Col>
    ));
  };

  return (
    <>
      {/* 1. BANNER CAROUSEL */}
      <Carousel interval={3000} className="mb-4">
        <Carousel.Item>
          <Link to="/men">
            <img className="d-block w-100" src={thirdSlide} alt="Thời trang Nam" style={{maxHeight: '500px', objectFit: 'cover'}} />
          </Link>
        </Carousel.Item>
        <Carousel.Item>
          <Link to="/women">
            <img className="d-block w-100" src={secondSlide} alt="Thời trang Nữ" style={{maxHeight: '500px', objectFit: 'cover'}} />
          </Link>
        </Carousel.Item>
      </Carousel>

      {/* 2. TAB DANH MỤC NAM/NỮ */}
      <Container className="mb-5">
        <CategoryTabs />
      </Container>

      {/* 3. BANNER HƯỚNG DẪN CHỌN SIZE (ĐÃ ĐỔI MÀU DARK) */}
      <Container className="mb-5">
        {/* bg-dark: Nền đen | text-white: Chữ trắng */}
        <div className="bg-dark text-white p-5 rounded-3 text-center border border-secondary shadow-sm">
            <Row className="align-items-center justify-content-center">
                <Col md={8}>
                    <h3 className="fw-bold text-uppercase mb-3">Bạn băn khoăn về size?</h3>
                    <p className="text-white-50 mb-4 fs-5">
                        Xem ngay bảng hướng dẫn chọn size chuẩn xác nhất dành cho người Việt Nam để có trải nghiệm tốt nhất.
                    </p>
                    {/* Nút màu trắng (variant="light") để nổi bật trên nền đen */}
                    <Button 
                        variant="light" 
                        size="lg"
                        className="fw-bold px-5 rounded-pill"
                        as={Link} 
                        to="/size-guide"
                    >
                        XEM HƯỚNG DẪN SIZE
                    </Button>
                </Col>
            </Row>
        </div>
      </Container>

      {/* 4. SẢN PHẨM MỚI */}
      <Container className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <h3 className="fw-bold mb-0">SẢN PHẨM MỚI</h3>
            <Link to="/search" className="text-decoration-none fw-bold text-primary">Xem tất cả &rarr;</Link>
        </div>
        <Row>
          {renderProductList(newArrivals)}
        </Row>
      </Container>

      {/* 5. BANNER KHUYẾN MÃI */}
      <Container className="mb-5">
        <Link to="/search" title="Xem tất cả sản phẩm khuyến mãi">
            <div className="position-relative rounded-3 overflow-hidden shadow-sm">
                <Image src={promoBanner} fluid style={{width: '100%', minHeight: '200px', objectFit: 'cover'}} />
                <div className="position-absolute top-50 start-50 translate-middle text-center text-white p-3" style={{background: 'rgba(0,0,0,0.4)', borderRadius: '10px'}}>
                    <h2 className="fw-bold display-5">SIÊU SALE LỄ HỘI</h2>
                    <p className="fs-5">Giảm giá lên đến 50% cho các sản phẩm mùa đông</p>
                    <Button variant="light" className="fw-bold px-4 rounded-pill">MUA NGAY</Button>
                </div>
            </div>
        </Link>
      </Container>

      {/* 6. SẢN PHẨM KHUYẾN MÃI */}
      {saleProducts.length > 0 && (
        <Container className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h3 className="fw-bold mb-0 text-danger">⚡ KHUYẾN MÃI HOT</h3>
                <Link to="/search?sale=true" className="text-decoration-none fw-bold text-danger">Xem tất cả &rarr;</Link>
            </div>
            <Row>
                {renderProductList(saleProducts)}
            </Row>
        </Container>
      )}
    </>
  );
}

export default HomePage;