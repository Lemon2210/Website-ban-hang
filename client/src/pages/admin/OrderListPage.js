import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Alert, Row, Col, InputGroup, FormControl, Card, Form } from 'react-bootstrap';
import { Search, Filter, Eye, CheckCircle, XCircle } from 'react-bootstrap-icons';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();

  // --- 1. HÀM TẢI DỮ LIỆU ---
  const fetchOrders = async () => {
    if (!user || !user.token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Gọi API lấy tất cả đơn hàng
      const { data } = await api.get('/admin/orders', config);
      
      // Sắp xếp đơn hàng mới nhất lên đầu
      const sortedOrders = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(sortedOrders);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- 2. LOGIC TÌM KIẾM REALTIME ---
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const orderId = order._id.toLowerCase();
    // Kiểm tra user có tồn tại không trước khi lấy name/email để tránh lỗi crash
    const customerName = order.user?.name?.toLowerCase() || 'khách vãng lai';
    const customerEmail = order.user?.email?.toLowerCase() || '';

    // Tìm theo ID đơn hàng HOẶC Tên khách HOẶC Email
    return orderId.includes(term) || customerName.includes(term) || customerEmail.includes(term);
  });

  // --- 3. HÀM HELPER ---
  
  // Định dạng ngày
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Màu trạng thái
  const getStatusBadge = (status) => {
    switch (status) {
        case 'Pending': return <Badge bg="warning" text="dark">Chờ xử lý</Badge>;
        case 'Processing': return <Badge bg="info" text="dark">Đang chuẩn bị</Badge>;
        case 'Shipping': return <Badge bg="primary">Đang giao</Badge>;
        case 'Delivered': return <Badge bg="success">Đã giao</Badge>;
        case 'Cancelled': return <Badge bg="danger">Đã hủy</Badge>;
        default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // (Chức năng cập nhật trạng thái sẽ làm sau)
  const handleStatusChange = async (orderId, newStatus) => {
    // TODO: Gọi API PUT /api/admin/orders/:id/status
    alert(`Chức năng cập nhật trạng thái thành "${newStatus}" đang phát triển.`);
  };

  // --- 4. RENDER GIAO DIỆN ---
  const renderContent = () => {
    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (filteredOrders.length === 0) {
        return <div className="text-center my-5 text-muted">Không tìm thấy đơn hàng nào khớp với "{searchTerm}".</div>;
    }

    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
            <Table striped hover responsive className="mb-0 align-middle">
                <thead className="bg-light">
                <tr>
                    <th className="py-3 ps-4">Mã đơn hàng</th>
                    <th>Khách hàng</th>
                    <th>Ngày đặt</th>
                    <th>Tổng tiền</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                    <th className="text-center">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {filteredOrders.map((order) => (
                    <tr key={order._id}>
                        <td className="ps-4 font-monospace fw-bold text-primary">
                            #{order._id.substring(order._id.length - 6).toUpperCase()}
                        </td>
                        <td>
                            <div className="fw-bold">{order.user?.name || 'Khách vãng lai'}</div>
                            <div className="small text-muted">{order.user?.email}</div>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td className="fw-bold">{order.totalPrice.toLocaleString('vi-VN')}₫</td>
                        <td>
                            <Badge bg="light" text="dark" className="border">
                                {order.paymentMethod}
                            </Badge>
                        </td>
                        <td>
                            {getStatusBadge(order.status || 'Pending')}
                        </td>
                        <td className="text-center">
                            <Button variant="outline-dark" size="sm" title="Xem chi tiết">
                                <Eye />
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div>
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="mb-1">Quản lý Đơn hàng</h2>
          <p className="text-muted">Theo dõi và xử lý các đơn hàng từ khách</p>
        </Col>
      </Row>

      {/* Thanh Tìm kiếm & Lọc */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0">
              <Search className="text-muted" />
            </InputGroup.Text>
            <FormControl 
              placeholder="Tìm theo mã đơn, tên khách hoặc email..." 
              className="border-start-0 ps-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6} className="text-end">
          <Button variant="outline-secondary" className="me-2">
            <Filter className="me-2" /> Lọc trạng thái
          </Button>
          <Button variant="dark">
            Xuất Excel
          </Button>
        </Col>
      </Row>

      {renderContent()}
    </div>
  );
}

export default OrderListPage;