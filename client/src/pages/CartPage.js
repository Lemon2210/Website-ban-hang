import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Image, Spinner, Alert } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export function CartPage() {
  const { user } = useAuth(); // Lấy thông tin user (và token)
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hàm tính tổng tiền
  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.inventory.price * item.quantity, 0);
  };

  // Hàm tải giỏ hàng
  const fetchCart = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      // Gọi API GET /api/cart
      const { data } = await api.get('/cart', config);
      setCartItems(data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải giỏ hàng của bạn.');
      setLoading(false);
    }
  };

  // Hàm xóa sản phẩm
  const handleRemoveFromCart = async (inventoryId) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      return;
    }
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      // Gọi API DELETE /api/cart/:id
      const { data } = await api.delete(`/cart/${inventoryId}`, config);
      // Cập nhật lại state giỏ hàng với dữ liệu mới
      setCartItems(data); 
    } catch (err) {
      alert('Lỗi khi xóa sản phẩm.');
    }
  };

  // Tải giỏ hàng khi trang được mở
  useEffect(() => {
    if (user) { // Chỉ tải nếu đã đăng nhập
      fetchCart();
    } else {
      setLoading(false);
      setError('Vui lòng đăng nhập để xem giỏ hàng.');
    }
  }, [user]); // Chạy lại nếu user thay đổi

  // Render
  if (loading) {
    return <div className="text-center my-5"><Spinner animation="border" /></div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Container className="my-5">
      <h1 className="mb-4">Giỏ hàng của bạn</h1>
      <Row>
        {/* Cột trái (Danh sách sản phẩm) */}
        <Col md={8}>
          {cartItems.length === 0 ? (
            <Alert variant="info">Giỏ hàng của bạn đang trống.</Alert>
          ) : (
            <Card>
              <Card.Body>
                {cartItems.map((item) => (
                  <Row key={item.inventory._id} className="mb-3 align-items-center">
                    <Col xs={3} md={2}>
                      <Image 
                        src={item.inventory.imageUrl} 
                        alt={item.inventory.product.name} 
                        fluid 
                        rounded 
                      />
                    </Col>
                    <Col xs={9} md={10}>
                      <h5>{item.inventory.product.name}</h5>
                      <p className="text-muted mb-1">
                        {item.inventory.attributes.color} / {item.inventory.attributes.size}
                      </p>
                      <p className="fw-bold mb-1">
                        {item.inventory.price.toLocaleString('vi-VN')}₫ x {item.quantity}
                      </p>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.inventory._id)}
                      >
                        <Trash /> Xóa
                      </Button>
                    </Col>
                  </Row>
                ))}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Cột phải (Tổng tiền) */}
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Tổng Cộng</Card.Title>
              <h3 className="mb-3">{calculateSubtotal().toLocaleString('vi-VN')}₫</h3>
              <p className="text-muted text-sm">
                Phí vận chuyển và thuế sẽ được tính ở bước thanh toán.
              </p>
              <Button 
                variant="dark" 
                className="w-100" 
                disabled={cartItems.length === 0}
                href="/checkout" // (Link tới trang thanh toán)
              >
                Tiến hành Thanh toán
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}