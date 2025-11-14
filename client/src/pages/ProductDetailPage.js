import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // <-- THÊM useNavigate
import axios from 'axios';
import { Container, Row, Col, Image, Button, ButtonGroup, Form, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; // <-- THÊM "BỘ NHỚ" AUTH
import api from '../api'; // <-- THÊM "BỘ NÃO" API

function ProductDetailPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate(); // <-- Hook để chuyển trang
  
  // Lấy user từ "bộ nhớ"
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
        // Dùng `api` (đã có baseURL)
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
        console.error("Lỗi khi fetch chi tiết sản phẩm:", err);
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
    
    if (sizesForColor.length > 0) {
      setSelectedSize(sizesForColor[0]);
    }
    
    const variantForImage = variants.find(v => v.attributes.color === selectedColor);
    if (variantForImage) {
      setMainImage(variantForImage.imageUrl);
    }

  }, [selectedColor, variants]);


  // --- (HÀM XỬ LÝ SỰ KIỆN - ĐÃ CẬP NHẬT) ---
  const handleColorClick = (color) => {
    setSelectedColor(color);
  };
  const handleSizeClick = (size) => {
    setSelectedSize(size);
  };
  
  const handleAddToCart = async () => {
    // 1. Kiểm tra xem user đã đăng nhập chưa
    if (!user) {
      // Nếu chưa, "đẩy" họ sang trang login
      navigate('/login');
      return;
    }

    // 2. Tìm biến thể chính xác
    const selectedVariant = variants.find(
      v => v.attributes.color === selectedColor && v.attributes.size === selectedSize
    );
    
    if (selectedVariant) {
      try {
        // 3. Lấy token từ "bộ nhớ" (localStorage)
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        };
        
        // 4. Gọi API "Thêm vào giỏ"
        await api.post(
          '/cart/add', 
          { 
            inventoryId: selectedVariant._id, 
            quantity: quantity 
          }, 
          config
        );
        
        // 5. Thông báo và chuyển sang trang giỏ hàng
        alert('Đã thêm vào giỏ hàng!');
        navigate('/cart');

      } catch (err) {
        alert('Có lỗi xảy ra khi thêm vào giỏ hàng.');
        console.error(err);
      }
    } else {
      alert("Không tìm thấy biến thể sản phẩm phù hợp");
    }
  };


  // --- (RENDER GIAO DIỆN - Giữ nguyên) ---
  if (loading) {
    return <div className="text-center my-5"><Spinner animation="border" /></div>;
  }
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }
  if (!product) {
    return null;
  }

  return (
    <Container className="mt-4">
      <Row>
        {/* CỘT BÊN TRÁI (Hình ảnh) */}
        <Col md={7}>
          <Image src={mainImage || 'https://via.placeholder.com/600x600'} alt={product.name} fluid rounded />
        </Col>

        {/* CỘT BÊN PHẢI (Thông tin & Lựa chọn) */}
        <Col md={5}>
          <h3>{product.name}</h3>
          
          <h2 className="my-3">
            {variants.length > 0 ? `${variants[0].price.toLocaleString('vi-VN')}₫` : '...'}
          </h2>
          
          <p className="text-muted">{product.description}</p>

          {/* Lựa chọn Màu sắc */}
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
          
          {/* Lựa chọn Kích thước */}
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

          {/* Chọn Số lượng */}
          <div className="mb-4 d-flex align-items-center">
            <span className="fw-bold me-3">Số lượng:</span>
            <ButtonGroup>
              <Button variant="outline-secondary" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
              <Button variant="light" disabled style={{ minWidth: '50px' }}>{quantity}</Button>
              <Button variant="outline-secondary" onClick={() => setQuantity(quantity + 1)}>+</Button>
            </ButtonGroup>
          </div>

          {/* Nút Thêm vào giỏ */}
          <Button variant="dark" size="lg" className="w-100" onClick={handleAddToCart}>
            Thêm vào giỏ
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default ProductDetailPage;