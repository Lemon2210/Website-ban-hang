import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Image, Button, ButtonGroup, Form, Spinner, Alert, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from "sonner";
import { CheckCircle, X, Star, StarHalf, CircleUser, ChevronLeft, ChevronRight } from "lucide-react"; 

// 1. IMPORT COMPONENT THẺ SẢN PHẨM
import ProductCard from '../components/ProductCard';

function ProductDetailPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- STATE ---
  const [product, setProduct] = useState(null); 
  const [variants, setVariants] = useState([]); 
  const [reviews, setReviews] = useState([]); 
  
  // State cho sản phẩm tương tự
  const [relatedProducts, setRelatedProducts] = useState([]); 

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(''); 

  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  // State cho Phân trang Bình luận
  const [reviewPage, setReviewPage] = useState(0);
  const reviewsPerPage = 5;

  // --- 1. GỌI API KHI TRANG TẢI ---
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        
        // Reset lại các state khi ID thay đổi (để tránh hiện dữ liệu cũ)
        setRelatedProducts([]);
        setProduct(null);
        
        const [productRes, reviewsRes] = await Promise.all([
            api.get(`/products/${productId}`),
            api.get(`/reviews/${productId}`)
        ]);
        
        const { product: productData, variants: variantsData } = productRes.data;
        
        setProduct(productData); 
        setVariants(variantsData); 
        setReviews(reviewsRes.data); 

        // Logic chọn màu/ảnh mặc định
        const colors = [...new Set(variantsData.map(v => v.attributes.color))];
        setAvailableColors(colors);
        
        if (colors.length > 0) {
          setSelectedColor(colors[0]);
          const firstVariantOfColor = variantsData.find(v => v.attributes.color === colors[0]);
          if (firstVariantOfColor) {
            setMainImage(firstVariantOfColor.imageUrl);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Không tìm thấy sản phẩm này.');
        setLoading(false);
        console.error("Lỗi:", err);
      }
    };

    fetchProductDetails();
  }, [productId]); // Chạy lại khi ID trên URL thay đổi

  // --- 2. LOGIC LẤY SẢN PHẨM TƯƠNG TỰ (MỚI) ---
  useEffect(() => {
    if (!product) return; // Chỉ chạy khi đã có thông tin sản phẩm

    const fetchRelated = async () => {
        try {
            // Gọi API lấy sản phẩm cùng danh mục chính (ví dụ: 'Áo')
            const { data } = await api.get(`/products?category=${product.category.main}`);
            
            // 1. Lọc bỏ sản phẩm đang xem
            const filtered = data.filter(p => p._id !== product._id);
            
            // 2. Xáo trộn ngẫu nhiên
            const shuffled = filtered.sort(() => 0.5 - Math.random());
            
            // 3. Lấy 4 sản phẩm đầu tiên
            setRelatedProducts(shuffled.slice(0, 4));
            
        } catch (err) {
            console.error("Lỗi tải sản phẩm tương tự:", err);
        }
    };

    fetchRelated();
  }, [product]); 
  // --------------------------------------------


  // --- 3. LOGIC CẬP NHẬT SIZE KHI CHỌN MÀU ---
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
    if (variantForImage) setMainImage(variantForImage.imageUrl);
  }, [selectedColor, variants]);

  // --- 4. TÍNH SAO TRUNG BÌNH ---
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            stars.push(<Star key={i} size={16} className="text-warning" fill="#ffc107" />);
        } else if (rating >= i - 0.5) {
            stars.push(<StarHalf key={i} size={16} className="text-warning" fill="#ffc107" />);
        } else {
            stars.push(<Star key={i} size={16} className="text-warning" />);
        }
    }
    return stars;
  };

  // --- 5. XỬ LÝ SỰ KIỆN ---
  const handleColorClick = (color) => setSelectedColor(color);
  const handleSizeClick = (size) => setSelectedSize(size);
  
  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    const selectedVariant = variants.find(
      v => v.attributes.color === selectedColor && v.attributes.size === selectedSize
    );
    
    if (selectedVariant) {
      try {
        const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` } };
        await api.post('/cart/add', { inventoryId: selectedVariant._id, quantity: quantity }, config);
        
        toast.custom((t) => (
          <div className="bg-white rounded shadow-lg border p-3" style={{ width: '350px', pointerEvents: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center text-success fw-bold" style={{ fontSize: '0.9rem' }}>
                <CheckCircle size={18} className="me-2" />Thêm thành công
              </div>
              <X size={20} onClick={() => toast.dismiss(t)} style={{ cursor: 'pointer', color: '#999' }} />
            </div>
            <div className="d-flex gap-3 mb-3">
              <div style={{ width: '60px', height: '80px', flexShrink: 0 }}>
                <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-bold text-truncate" style={{ fontSize: '0.9rem' }}>{product.name}</div>
                <div className="text-muted small mb-1">{selectedColor} / {selectedSize}</div>
                <div className="fw-bold text-dark">{selectedVariant.price.toLocaleString('vi-VN')}₫</div>
              </div>
            </div>
            <Button variant="outline-dark" size="sm" className="w-100 fw-bold rounded-pill" onClick={() => { toast.dismiss(t); navigate('/cart'); }}>XEM GIỎ HÀNG &rarr;</Button>
          </div>
        ), { duration: 2000 });
      } catch (err) { toast.error('Lỗi thêm giỏ hàng.'); }
    } else { toast.error("Vui lòng chọn biến thể."); }
  };

  // Logic Phân trang Bình luận
  const displayedReviews = reviews.slice(reviewPage * reviewsPerPage, (reviewPage + 1) * reviewsPerPage);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!product) return null;

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-5">
        <Col md={7}>
          <Image src={mainImage || 'https://via.placeholder.com/600x600'} alt={product.name} fluid rounded />
        </Col>

        <Col md={5}>
          <h3 className="mb-2">{product.name}</h3>
          
          <div className="d-flex align-items-center mb-3">
             <div className="d-flex me-2">{renderStars(Number(averageRating))}</div>
             <span className="text-muted small">({reviews.length} đánh giá)</span>
          </div>

          <h2 className="my-3 text-danger fw-bold">
            {variants.length > 0 ? `${variants[0].price.toLocaleString('vi-VN')}₫` : '...'}
          </h2>
          
          <p className="text-muted">{product.description}</p>

          <div className="mb-3">
            <Form.Label className="fw-bold">Màu sắc: {selectedColor}</Form.Label>
            <div className="d-flex gap-2">
              {availableColors.map(color => (
                <Button key={color} variant={selectedColor === color ? 'dark' : 'outline-dark'} onClick={() => handleColorClick(color)}>{color}</Button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <Form.Label className="fw-bold">Kích thước: {selectedSize}</Form.Label>
            <div className="d-flex gap-2 flex-wrap">
              {availableSizes.map(size => (
                <Button key={size} variant={selectedSize === size ? 'dark' : 'outline-dark'} onClick={() => handleSizeClick(size)} className="px-4">{size}</Button>
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

          <Button variant="dark" size="lg" className="w-100 py-3 text-uppercase fw-bold" onClick={handleAddToCart}>
            Thêm vào giỏ
          </Button>
        </Col>
      </Row>

      {/* --- KHU VỰC BÌNH LUẬN --- */}
      <Row className="mt-5 mb-5">
        <Col>
            <h4 className="mb-4 border-bottom pb-2">Đánh giá từ khách hàng ({reviews.length})</h4>
            
            {reviews.length === 0 ? (
                <p className="text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>
            ) : (
                <div className="review-list">
                    {displayedReviews.map((review) => (
                        <Card key={review._id} className="mb-3 border-0 shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between">
                                    <div className="d-flex align-items-center mb-2">
                                        <div className="bg-light rounded-circle p-2 me-2">
                                            <CircleUser size={24} className="text-secondary" />
                                        </div>
                                        <div>
                                            <div className="fw-bold" style={{fontSize: '0.95rem'}}>{review.user?.name || "Khách hàng"}</div>
                                            <div className="d-flex text-warning small">
                                                {renderStars(review.rating)}
                                            </div>
                                        </div>
                                    </div>
                                    <small className="text-muted">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</small>
                                </div>
                                <p className="mb-0 mt-2 text-secondary">
                                    {review.comment || <em className="text-muted">Không có lời bình</em>}
                                </p>
                            </Card.Body>
                        </Card>
                    ))}

                    {/* Phân trang Bình luận */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
                            <Button 
                                variant="outline-secondary" 
                                size="sm"
                                disabled={reviewPage === 0}
                                onClick={() => setReviewPage(p => p - 1)}
                            >
                                <ChevronLeft /> Trước
                            </Button>
                            <span className="small text-muted">Trang {reviewPage + 1} / {totalPages}</span>
                            <Button 
                                variant="outline-secondary" 
                                size="sm"
                                disabled={reviewPage >= totalPages - 1}
                                onClick={() => setReviewPage(p => p + 1)}
                            >
                                Sau <ChevronRight />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Col>
      </Row>

      {/* --- KHU VỰC SẢN PHẨM TƯƠNG TỰ (MỚI) --- */}
      {relatedProducts.length > 0 && (
        <Row className="mt-5">
            <Col>
                <h4 className="mb-4 border-bottom pb-2">Sản phẩm tương tự</h4>
                <Row>
                    {relatedProducts.map((p) => (
                        <Col key={p._id} xs={6} md={4} lg={3} className="mb-4">
                            <ProductCard product={p} />
                        </Col>
                    ))}
                </Row>
            </Col>
        </Row>
      )}
      {/* -------------------------------------- */}

    </Container>
  );
}

export default ProductDetailPage;