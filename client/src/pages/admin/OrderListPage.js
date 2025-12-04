import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Alert, Row, Col, InputGroup, FormControl, Card, Form, Modal, Image } from 'react-bootstrap';
import { Search, Filter, Eye, XCircle, BoxSeam } from 'react-bootstrap-icons';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

function OrderListPage() {
  const { user } = useAuth();
  
  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State cho Modal Chi tiết
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // State cho Modal Hủy
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

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
      console.error(err);
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
    // Kiểm tra user có tồn tại không trước khi lấy name/email
    const customerName = order.user?.name?.toLowerCase() || 'khách vãng lai';
    const customerEmail = order.user?.email?.toLowerCase() || '';

    // Tìm theo ID đơn hàng HOẶC Tên khách HOẶC Email
    return orderId.includes(term) || customerName.includes(term) || customerEmail.includes(term);
  });

  // --- 3. XỬ LÝ CẬP NHẬT TRẠNG THÁI ---
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus }, config);
      
      toast.success(`Đã cập nhật trạng thái đơn hàng thành: ${newStatus}`);
      
      // Cập nhật lại state local để giao diện phản hồi ngay lập tức
      setOrders(prevOrders => prevOrders.map(o => {
        if (o._id === orderId) return { ...o, status: newStatus };
        return o;
      }));

    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật trạng thái.');
      fetchOrders(); // Tải lại data gốc nếu lỗi
    }
  };

  // --- 4. XỬ LÝ XEM CHI TIẾT ---
  const handleViewDetails = async (orderId) => {
    setShowDetailModal(true);
    setLoadingDetails(true);
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await api.get(`/orders/${orderId}`, config); // Dùng API chi tiết để lấy đầy đủ info
        setSelectedOrder(data);
    } catch (err) {
        toast.error('Không thể tải chi tiết đơn hàng.');
        setShowDetailModal(false);
    } finally {
        setLoadingDetails(false);
    }
  };

  // --- 5. XỬ LÝ HỦY ĐƠN (ADMIN) ---
  const handleCancelClick = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await api.put(`/orders/${orderToCancel}/cancel`, {}, config);
        
        toast.success('Đã hủy đơn hàng thành công.');
        fetchOrders(); // Tải lại danh sách
        setShowCancelModal(false); 
    } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi hủy đơn.');
        setShowCancelModal(false);
    }
  };

  // --- UI HELPERS ---
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

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

  // --- RENDER CONTENT ---
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
                    <th>Trạng thái (Admin)</th>
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
                            <Badge bg="light" text="dark" className="border me-1">
                                {order.paymentMethod}
                            </Badge>
                            {order.paymentStatus === 'Paid' && <Badge bg="success">Đã TT</Badge>}
                        </td>
                        
                        {/* --- DROPDOWN TRẠNG THÁI --- */}
                        <td style={{width: '160px'}}>
                            <Form.Select 
                                size="sm"
                                value={order.status}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                style={{ 
                                    fontWeight: '500',
                                    borderColor: order.status === 'Cancelled' ? '#dc3545' : '#ced4da',
                                    color: order.status === 'Cancelled' ? '#dc3545' : '#212529'
                                }}
                                disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                            >
                                <option value="Pending">Chờ xử lý</option>
                                <option value="Processing">Đang chuẩn bị</option>
                                <option value="Shipping">Đang giao</option>
                                <option value="Delivered">Đã giao</option>
                                <option value="Cancelled">Đã hủy</option>
                            </Form.Select>
                        </td>

                        <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                                <Button 
                                    variant="outline-dark" 
                                    size="sm" 
                                    title="Xem chi tiết"
                                    onClick={() => handleViewDetails(order._id)}
                                >
                                    <Eye />
                                </Button>

                                {/* Admin có thể hủy đơn nếu chưa giao xong */}
                                {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm" 
                                        title="Hủy đơn hàng"
                                        onClick={() => handleCancelClick(order._id)}
                                    >
                                        <XCircle />
                                    </Button>
                                )}
                            </div>
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

      {/* Thanh Tìm kiếm */}
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
            <Filter className="me-2" /> Lọc nâng cao
          </Button>
          <Button variant="dark">
            Xuất Excel
          </Button>
        </Col>
      </Row>

      {renderContent()}

      {/* --- MODAL CHI TIẾT --- */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton>
            <Modal.Title>Chi tiết đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {loadingDetails ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : selectedOrder ? (
                <>
                    <Row className="mb-4">
                        <Col md={6}>
                            <h6 className="fw-bold">Thông tin người nhận</h6>
                            <p className="mb-1">Tên: {selectedOrder.shippingAddress.fullName}</p>
                            <p className="mb-1">SĐT: {selectedOrder.shippingAddress.phone}</p>
                            <p className="mb-0">Đ/c: {selectedOrder.shippingAddress.address}</p>
                        </Col>
                        <Col md={6} className="text-md-end">
                            <h6 className="fw-bold">Thông tin đơn hàng</h6>
                            <p className="mb-1">Mã: #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}</p>
                            <p className="mb-1">Ngày: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                            <p className="mb-0">TT: {selectedOrder.paymentStatus === 'Paid' ? <span className="text-success fw-bold">Đã thanh toán</span> : <span className="text-warning fw-bold">Chưa thanh toán</span>}</p>
                        </Col>
                    </Row>
                    
                    <div className="table-responsive">
                        <Table size="sm" bordered>
                            <thead className="table-light">
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th className="text-center">SL</th>
                                    <th className="text-end">Đơn giá</th>
                                    <th className="text-end">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.orderItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Image src={item.imageUrl} width={40} height={40} rounded className="me-2 object-fit-cover" />
                                                <div>
                                                    <div>{item.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center align-middle">{item.quantity}</td>
                                        <td className="text-end align-middle">{item.price.toLocaleString()}₫</td>
                                        <td className="text-end align-middle">{(item.price * item.quantity).toLocaleString()}₫</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    <div className="text-end">
                        <p className="mb-1">Tạm tính: {(selectedOrder.totalPrice - 30000 + (selectedOrder.discountAmount || 0)).toLocaleString()}₫</p>
                        <p className="mb-1">Phí vận chuyển: 30.000₫</p>
                        {selectedOrder.discountAmount > 0 && (
                            <p className="mb-1 text-success">Giảm giá: -{selectedOrder.discountAmount.toLocaleString()}₫</p>
                        )}
                        <h4 className="text-primary mt-2">Tổng cộng: {selectedOrder.totalPrice.toLocaleString('vi-VN')}₫</h4>
                    </div>
                </>
            ) : <p>Không có dữ liệu.</p>}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Đóng</Button>
        </Modal.Footer>
      </Modal>

      {/* --- MODAL HỦY --- */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="bg-warning border-0"><Modal.Title>Xác nhận Hủy đơn</Modal.Title></Modal.Header>
        <Modal.Body>
            <p>Bạn có chắc chắn muốn hủy đơn hàng này không?</p>
            <p className="text-muted small">Hành động này sẽ hoàn trả số lượng sản phẩm về kho.</p>
        </Modal.Body>
        <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Không</Button>
            <Button variant="danger" onClick={confirmCancelOrder}>Đồng ý Hủy</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default OrderListPage;