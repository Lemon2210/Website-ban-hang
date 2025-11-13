import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Hook để đọc :id từ URL
import axios from 'axios';
import { Container, Row, Col, Image, Button, ButtonGroup, Form, Spinner, Alert } from 'react-bootstrap';
// (Đã xóa StarFill vì không dùng nữa)

function ProductDetailPage() {
  // Lấy id sản phẩm từ thanh URL
  const { id: productId } = useParams();

  // State cho dữ liệu
  const [product, setProduct] = useState(null); // Thông tin sản phẩm gốc
  const [variants, setVariants] = useState([]); // Mảng các biến thể (màu, size)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho lựa chọn của người dùng
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(''); // Ảnh chính đang hiển thị

  // State cho các lựa chọn (để render nút)
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  // --- 1. GỌI API KHI TRANG TẢI LẦN ĐẦU ---
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/products/${productId}`);
        
        setProduct(data.product); // Lưu thông tin gốc (tên, mô tả)
        setVariants(data.variants); // Lưu mảng các biến thể

        // --- Logic "thông minh" để tìm các lựa chọn ---
        
        // 2a. Tìm tất cả các màu duy nhất
        const colors = [...new Set(data.variants.map(v => v.attributes.color))];
        setAvailableColors(colors);
        
        // 2b. Tự động chọn màu đầu tiên
        if (colors.length > 0) {
          setSelectedColor(colors[0]);
          // Đặt ảnh chính là ảnh của biến thể đầu tiên có màu này
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
  }, [productId]); // Chạy lại nếu 'id' trên URL thay đổi

  
  // --- 2. LOGIC CẬP NHẬT SIZE KHI CHỌN MÀU ---
  useEffect(() => {
    if (!selectedColor || variants.length === 0) return;

    // Tìm tất cả các size có sẵn cho MÀU đã chọn
    const sizesForColor = variants
      .filter(v => v.attributes.color === selectedColor)
      .map(v => v.attributes.size);
      
    setAvailableSizes([...new Set(sizesForColor)]); // Lấy size duy nhất
    
    // Tự động chọn size đầu tiên
    if (sizesForColor.length > 0) {
      setSelectedSize(sizesForColor[0]);
    }
    
    // Cập nhật ảnh chính khi đổi màu
    const variantForImage = variants.find(v => v.attributes.color === selectedColor);
    if (variantForImage) {
      setMainImage(variantForImage.imageUrl);
    }

  }, [selectedColor, variants]); // Chạy lại mỗi khi đổi màu


  // --- 3. HÀM XỬ LÝ SỰ KIỆN ---
  const handleColorClick = (color) => {
    setSelectedColor(color);
  };

  const handleSizeClick = (size) => {
    setSelectedSize(size);
  };
  
  const handleAddToCart = () => {
    // Tìm biến thể chính xác dựa trên màu và size đã chọn
    const selectedVariant = variants.find(
      v => v.attributes.color === selectedColor && v.attributes.size === selectedSize
    );
    
    if (selectedVariant) {
      console.log(`ĐÃ THÊM VÀO GIỎ:`);
      console.log(`Inventory ID: ${selectedVariant._id}`);
      console.log(`Số lượng: ${quantity}`);
      // (Chúng ta sẽ gọi API "Thêm vào giỏ hàng" ở đây sau)
    } else {
      console.error("Không tìm thấy biến thể phù hợp");
    }
  };


  // --- 4. RENDER GIAO DIỆN ---
  
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
          {/* Ảnh chính */}
          <Image src={mainImage || 'https://via.placeholder.com/600x600'} alt={product.name} fluid rounded />
          {/* (Bạn có thể thêm các ảnh thumbnail ở đây sau) */}
        </Col>

        {/* CỘT BÊN PHẢI (Thông tin & Lựa chọn) */}
        <Col md={5}>
          <h3>{product.name}</h3>
          
          {/* (PHẦN ĐÁNH GIÁ SAO ĐÃ BỊ XÓA) */}

          {/* (Chúng ta sẽ lấy giá từ biến thể được chọn sau) */}
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