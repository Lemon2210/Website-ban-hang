import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, ListGroup, Image } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from 'sonner'; // Dùng để hiện thông báo đặt hàng thành công

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- STATE ---
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false); // Trạng thái khi đang bấm nút Đặt hàng

  // Form thông tin giao hàng
  const [formData, setFormData] = useState({
    fullName: user?.name || '', // Tự điền tên nếu có
    email: user?.email || '',   // Tự điền email nếu có
    phone: '',
    address: '',
    city: '',
    note: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('COD'); // Mặc định là COD

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
            navigate('/cart'); // Quay lại giỏ hàng nếu trống
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
  const shippingFee = 30000; // Phí ship cố định (ví dụ 30k)
  const total = subtotal + shippingFee;

  // --- XỬ LÝ NHẬP LIỆU ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- 2. XỬ LÝ ĐẶT HÀNG (GỌI API) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrdering(true);

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // Gửi dữ liệu lên API POST /api/orders
      // (Backend sẽ tự lấy danh sách sản phẩm từ giỏ hàng trong CSDL)
      await api.post('/orders', {
        shippingAddress: {
            fullName: formData.fullName,
            phone: formData.phone,
            address: `${formData.address}, ${formData.city}`, // Gộp địa chỉ
            city: formData.city
        },
        paymentMethod: paymentMethod,
        // itemsPrice, shippingPrice, totalPrice sẽ được tính lại ở backend hoặc lưu ở đây
        totalPrice: total 
      }, config);

      // Thành công!
      toast.success('Đặt hàng thành công! Cảm ơn bạn đã mua sắm.');
      
      // Chuyển hướng về trang chủ (hoặc trang Lịch sử đơn hàng nếu có)
      navigate('/'); 
      
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
                        disabled // Email lấy từ tài khoản, không cho sửa
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
                        placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
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
                        className="mb-2"
                    />
                    <Form.Text className="text-muted d-block ms-4 mb-3">
                        Bạn sẽ thanh toán tiền mặt cho shipper khi nhận được hàng.
                    </Form.Text>
                    
                    <Form.Check 
                        type="radio"
                        id="banking"
                        label="Chuyển khoản ngân hàng (Đang bảo trì)"
                        name="paymentMethod"
                        value="Banking"
                        disabled
                    />
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

                {/* Tính tiền */}
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Tạm tính:</span>
                    <span className="fw-bold">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Phí vận chuyển:</span>
                    <span className="fw-bold">{shippingFee.toLocaleString('vi-VN')}₫</span>
                </div>
                
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