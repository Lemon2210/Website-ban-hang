import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Image, InputGroup, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from 'sonner';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- STATE CƠ BẢN ---
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  // --- STATE FORM ĐỊA CHỈ ---
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    note: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');

  // --- STATE MÃ GIẢM GIÁ ---
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0); // Số tiền được giảm
  const [couponApplied, setCouponApplied] = useState(null); // Mã đã áp dụng thành công

  // --- 1. TẢI GIỎ HÀNG ---
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await api.get('/cart', config);
        
        if (data.length === 0) {
            toast.info('Giỏ hàng của bạn đang trống.');
            navigate('/cart');
            return;
        }
        
        setCartItems(data);
        setLoading(false);
      } catch (err) {
        toast.error('Không thể tải thông tin giỏ hàng.');
        setLoading(false);
      }
    };

    fetchCart();
  }, [user, navigate]);

  // --- TÍNH TOÁN TIỀN ---
  const subtotal = cartItems.reduce((acc, item) => acc + item.inventory.price * item.quantity, 0);
  const shippingFee = 30000; // Phí ship cố định
  const total = subtotal + shippingFee - discount; // Tổng cuối cùng

  // --- XỬ LÝ NHẬP LIỆU ĐỊA CHỈ ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- 2. XỬ LÝ ÁP DỤNG MÃ GIẢM GIÁ ---
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Gọi API kiểm tra mã
      const { data } = await api.post('/coupons/validate', {
        code: couponCode,
        orderTotal: subtotal // Gửi tổng tiền hàng để kiểm tra điều kiện tối thiểu
      }, config);
  
      setDiscount(data.discountAmount);
      setCouponApplied(data.couponCode);
      toast.success(data.message);
    } catch (err) {
      setDiscount(0);
      setCouponApplied(null);
      toast.error(err.response?.data?.message || 'Mã không hợp lệ');
    }
  };

  // --- 3. XỬ LÝ ĐẶT HÀNG (GỌI API) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrdering(true);

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // A. Tạo đơn hàng trên hệ thống trước
      const { data: order } = await api.post('/orders', {
        shippingAddress: {
            fullName: formData.fullName,
            phone: formData.phone,
            address: `${formData.address}, ${formData.city}`,
            city: formData.city
        },
        paymentMethod: paymentMethod,
        couponCode: couponApplied, // Gửi mã giảm giá nếu có
        // (Backend sẽ tự tính toán lại giá và trừ tồn kho)
      }, config);

      // B. Xử lý thanh toán
      if (paymentMethod === 'VNPAY') {
          // Nếu chọn VNPAY -> Gọi API lấy URL thanh toán
          const { data: paymentData } = await api.post('/payment/create_payment_url', {
              orderId: order._id,
              amount: order.totalPrice, // Số tiền cần thanh toán
              language: 'vn'
          });
          
          // Chuyển hướng sang VNPAY Sandbox
          window.location.href = paymentData.url;
      } else {
          // Nếu chọn COD -> Hoàn tất ngay
          toast.success('Đặt hàng thành công! Cảm ơn bạn đã mua sắm.');
          navigate('/my-orders'); // Chuyển đến trang Lịch sử đơn hàng
      }
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

  return (
    <Container className="py-5">
      <h2 className="mb-4">Thanh Toán</h2>
      <Form onSubmit={handleSubmit}>
        <Row>
          {/* === CỘT TRÁI: THÔNG TIN GIAO HÀNG === */}
          <Col md={7} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-white py-3">
                <h5 className="mb-0">Thông tin giao hàng</h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group controlId="fullName">
                            <Form.Label>Họ và tên (*)</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="fullName"
                                value={formData.fullName} 
                                onChange={handleChange} 
                                required 
                                placeholder="Nguyễn Văn A"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="phone">
                            <Form.Label>Số điện thoại (*)</Form.Label>
                            <Form.Control 
                                type="tel" 
                                name="phone"
                                value={formData.phone} 
                                onChange={handleChange} 
                                required 
                                placeholder="0901234567"
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control 
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleChange} 
                        disabled // Không cho sửa email
                    />
                </Form.Group>

                <Row className="mb-3">
                    <Col md={8}>
                        <Form.Group controlId="address">
                            <Form.Label>Địa chỉ nhận hàng (*)</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="address"
                                value={formData.address} 
                                onChange={handleChange} 
                                required 
                                placeholder="Số nhà, tên đường, phường/xã"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="city">
                            <Form.Label>Tỉnh / Thành (*)</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="city"
                                value={formData.city} 
                                onChange={handleChange} 
                                required 
                                placeholder="Hồ Chí Minh"
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3" controlId="note">
                    <Form.Label>Ghi chú đơn hàng (Tùy chọn)</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={2} 
                        name="note"
                        value={formData.note} 
                        onChange={handleChange} 
                        placeholder="Ví dụ: Giao giờ hành chính..."
                    />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mt-4 shadow-sm">
                <Card.Header className="bg-white py-3">
                    <h5 className="mb-0">Phương thức thanh toán</h5>
                </Card.Header>
                <Card.Body>
                    <Form.Check 
                        type="radio"
                        id="cod"
                        label="Thanh toán khi nhận hàng (COD)"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mb-3"
                    />
                    
                    {/* --- THAY VNPAY BẰNG MOMO --- */}
                    <Form.Check 
                        type="radio"
                        id="vnpay" // Giữ ID là vnpay cũng được để đỡ sửa logic, hoặc đổi thành momo
                        label={
                            <div className="d-flex align-items-center">
                                <span>Ví MoMo</span>
                                <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MOMO" height="24" className="ms-2" />
                            </div>
                        }
                        name="paymentMethod"
                        value="VNPAY" // Vẫn giữ value là VNPAY để khớp với logic code cũ, hoặc bạn có thể đổi thành MOMO và sửa cả backend
                        checked={paymentMethod === 'VNPAY'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                     {/* -------------------- */}
                </Card.Body>
            </Card>
          </Col>

          {/* === CỘT PHẢI: TÓM TẮT ĐƠN HÀNG === */}
          <Col md={5}>
            <Card className="shadow-sm border-0 bg-light">
              <Card.Body>
                <h4 className="mb-4">Đơn hàng của bạn</h4>
                
                {/* Danh sách sản phẩm */}
                <div className="mb-4" style={{maxHeight: '300px', overflowY: 'auto'}}>
                    {cartItems.map((item) => (
                        <div key={item.inventory._id} className="d-flex gap-3 mb-3 align-items-center">
                            <div style={{width: '60px', height: '60px', flexShrink: 0}}>
                                <Image 
                                    src={item.inventory.imageUrl} 
                                    alt={item.inventory.product.name} 
                                    fluid rounded 
                                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                />
                            </div>
                            <div className="flex-grow-1">
                                <div className="fw-bold text-truncate" style={{maxWidth: '200px'}}>{item.inventory.product.name}</div>
                                <div className="text-muted small">
                                    {item.inventory.attributes.color} / {item.inventory.attributes.size} <span className="mx-1">|</span> x{item.quantity}
                                </div>
                            </div>
                            <div className="fw-bold">
                                {(item.inventory.price * item.quantity).toLocaleString('vi-VN')}₫
                            </div>
                        </div>
                    ))}
                </div>

                <hr />
                
                {/* --- KHU VỰC MÃ GIẢM GIÁ --- */}
                <InputGroup className="mb-3">
                  <Form.Control 
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!couponApplied} // Khóa nếu đã áp dụng
                  />
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleApplyCoupon}
                    disabled={!!couponApplied || !couponCode}
                  >
                    Áp dụng
                  </Button>
                </InputGroup>
                
                {couponApplied && (
                    <Alert variant="success" className="py-2 text-sm mb-3">
                        Đã dùng mã: <strong>{couponApplied}</strong> 
                        <span className="float-end fw-bold">-{discount.toLocaleString()}₫</span>
                    </Alert>
                )}
                {/* --------------------------- */}

                {/* Tính tiền */}
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Tạm tính:</span>
                    <span className="fw-bold">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí vận chuyển:</span>
                    <span className="fw-bold">{shippingFee.toLocaleString('vi-VN')}₫</span>
                </div>
                
                {discount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Giảm giá:</span>
                        <span>-{discount.toLocaleString('vi-VN')}₫</span>
                    </div>
                )}
                
                <hr />
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <span className="h5 mb-0">Tổng cộng:</span>
                    <span className="h4 text-primary mb-0">{total.toLocaleString('vi-VN')}₫</span>
                </div>

                <Button 
                    variant="dark" 
                    size="lg" 
                    type="submit" 
                    className="w-100 py-3 fw-bold"
                    disabled={ordering}
                >
                    {ordering ? <Spinner as="span" animation="border" size="sm" /> : 'ĐẶT HÀNG NGAY'}
                </Button>

                <div className="text-center mt-3">
                    <Link to="/cart" className="text-decoration-none text-muted small">
                        &larr; Quay lại giỏ hàng
                    </Link>
                </div>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}