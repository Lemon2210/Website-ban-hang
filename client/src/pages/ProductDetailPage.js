import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Image, Button, ButtonGroup, Form, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { LinkContainer } from 'react-router-bootstrap'; // <-- THÊM DÒNG NÀY

// 1. IMPORT THƯ VIỆN THÔNG BÁO VÀ ICON
import { toast } from "react-hot-toast";
import { CheckCircleFill, X } from "react-bootstrap-icons"; 

function ProductDetailPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // (Các state khác giữ nguyên)
  const [product, setProduct] = useState(null); 
  const [variants, setVariants] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(''); 
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  // (useEffect fetchProductDetails giữ nguyên)
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products/${productId}`);
        setProduct(data.product); 
        setVariants(data.variants); 
        const colors = [...new Set(data.variants.map(v => v.attributes.color))];
        setAvailableColors(colors);
        if (colors.length > 0) {
          setSelectedColor(colors[0]);
          const firstVariantOfColor = data.variants.find(v => v.attributes.color === colors[0]);
          if (firstVariantOfColor) {
            setMainImage(firstVariantOfColor.imageUrl);
          }
        }
        setLoading(false);
      } catch (err) {
        setError('Không tìm thấy sản phẩm này.');
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [productId]);

  // (useEffect cập nhật Size giữ nguyên)
  useEffect(() => {
    if (!selectedColor || variants.length === 0) return;
    const sizesForColor = variants
      .filter(v => v.attributes.color === selectedColor)
      .map(v => v.attributes.size);
    setAvailableSizes([...new Set(sizesForColor)]); 
    if (sizesForColor.length > 0 && !sizesForColor.includes(selectedSize)) {
      setSelectedSize(sizesForColor[0]);
    }
    const variantForImage = variants.find(v => v.attributes.color === selectedColor);
    if (variantForImage) {
      setMainImage(variantForImage.imageUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, variants]);

  
  const handleColorClick = (color) => setSelectedColor(color);
  const handleSizeClick = (size) => setSelectedSize(size);
  
  // --- (HÀM THÊM GIỎ HÀNG - ĐÃ CẬP NHẬT) ---
  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const selectedVariant = variants.find(
      v => v.attributes.color === selectedColor && v.attributes.size === selectedSize
    );
    
    if (selectedVariant) {
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        };
        
        await api.post(
          '/cart/add', 
          { 
            inventoryId: selectedVariant._id, 
            quantity: quantity 
          }, 
          config
        );
        
        // --- 2. HIỂN THỊ THÔNG BÁO (TOAST) TÙY CHỈNH ---
        toast.custom((t) => (
          // Dùng class của Bootstrap để tạo giao diện
          <div 
            className={`bg-white rounded shadow-lg border p-3 ${t.visible ? 'animate__animated animate__fadeInRight' : 'animate__animated animate__fadeOutRight'}`}
            style={{ width: '350px' }}
          >
            {/* Header: Icon check + Text + Nút tắt */}
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="d-flex align-items-center text-success fw-bold" style={{ fontSize: '0.95rem' }}>
                <CheckCircleFill size={18} className="me-2" />
                Thêm vào giỏ hàng thành công
              </div>
              <X 
                size={20} 
                onClick={() => toast.dismiss(t)} 
                style={{ cursor: 'pointer', color: '#999' }}
              />
            </div>

            {/* Body: Ảnh + Tên + Giá */}
            <div className="d-flex gap-3 mb-3">
              <div style={{ width: '60px', height: '80px', flexShrink: 0 }}>
                <img 
                  src={mainImage} 
                  alt={product.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                />
              </div>
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="fw-bold text-truncate mb-1" style={{ fontSize: '0.9rem' }}>
                  {product.name}
                </div>
                <div className="text-muted small mb-1">
                  {selectedColor} / {selectedSize}
                </div>
                <div className="fw-bold text-dark">
                  {selectedVariant.price.toLocaleString('vi-VN')}₫
                </div>
              </div>
            </div>

            {/* Footer: Nút Xem giỏ hàng */}
            <LinkContainer to="/cart">
              <Button 
                variant="outline-dark" 
                size="sm" 
                className="w-100 text-uppercase fw-bold rounded-pill py-2"
                onClick={() => toast.dismiss(t)} // Tắt toast khi click
              >
                XEM GIỎ HÀNG &rarr;
              </Button>
            </LinkContainer>
          </div>
        ), { 
          duration: 2000, // Tự tắt sau 2 giây
        });
        // --- HẾT PHẦN THÔNG BÁO ---

      } catch (err) {
        toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng.'); // Dùng toast cho lỗi
        console.error(err);
      }
    } else {
      toast.error("Vui lòng chọn màu sắc và kích thước hợp lệ."); // Dùng toast cho lỗi
    }
  };

  // --- 4. RENDER ---
  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!product) return null;

  return (
    <Container className="mt-4">
      <Row>
        <Col md={7}>
          <Image src={mainImage || 'https://via.placeholder.com/600x600'} alt={product.name} fluid rounded />
        </Col>

        <Col md={5}>
          <h3>{product.name}</h3>
          <h2 className="my-3">
            {variants.length > 0 ? `${variants[0].price.toLocaleString('vi-VN')}₫` : '...'}
          </h2>
          <p className="text-muted">{product.description}</p>

          <div className="mb-3">
            <Form.Label className="fw-bold">Màu sắc: {selectedColor}</Form.Label>
            <div className="d-flex gap-2">
              {availableColors.map(color => (
                <Button 
                  key={color}
                  variant={selectedColor === color ? 'dark' : 'outline-dark'}
                  onClick={() => handleColorClick(color)}
                >
                  {color}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <Form.Label className="fw-bold">Kích thước: {selectedSize}</Form.Label>
            <div className="d-flex gap-2 flex-wrap">
              {availableSizes.map(size => (
                <Button 
                  key={size}
                  variant={selectedSize === size ? 'dark' : 'outline-dark'}
                  onClick={() => handleSizeClick(size)}
                  className="px-4"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-4 d-flex align-items-center">
            <span className="fw-bold me-3">Số lượng:</span>
            <ButtonGroup>
              <Button variant="outline-secondary" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
              <Button variant="light" disabled style={{ minWidth: '50px' }}>{quantity}</Button>
              <Button variant="outline-secondary" onClick={() => setQuantity(quantity + 1)}>+</Button>
            </ButtonGroup>
          </div>

          <Button variant="dark" size="lg" className="w-100" onClick={handleAddToCart}>
            Thêm vào giỏ
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default ProductDetailPage;