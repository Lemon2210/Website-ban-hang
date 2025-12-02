import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Modal, Row, Col, Image } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Link } from 'react-router-dom';
import { Eye, XCircle } from 'react-bootstrap-icons'; 
import { toast } from 'sonner';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal Chi Tiết
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // --- STATE MỚI CHO MODAL HỦY ---
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // 1. Tải danh sách đơn hàng
  const fetchMyOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.get('/orders/myorders', config);
      setOrders(data);
      setLoading(false);
    } catch (err) {
      toast.error('Không thể tải lịch sử đơn hàng.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2. Xử lý khi bấm nút Hủy (Mở Modal)
  const handleCancelClick = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  // 3. Xử lý Xác nhận Hủy (Gọi API)
  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await api.put(`/orders/${orderToCancel}/cancel`, {}, config);
        
        toast.success('Đã hủy đơn hàng thành công.');
        fetchMyOrders(); // Tải lại danh sách
        setShowCancelModal(false); // Đóng modal
    } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi hủy đơn.');
        setShowCancelModal(false);
    }
  };

  // 4. Xử lý Xem Chi Tiết
  const handleViewDetails = (order) => {
      setSelectedOrder(order);
      setShowModal(true);
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

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

  return (
    <Container className="py-5">
      <h2 className="mb-4">Đơn hàng của tôi</h2>
      
      {orders.length === 0 ? (
        <Alert variant="info">Bạn chưa có đơn hàng nào. <Link to="/">Mua sắm ngay</Link></Alert>
      ) : (
        <Table striped hover responsive className="align-middle shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>Mã Đơn</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="fw-bold text-primary">
                    #{order._id.substring(order._id.length - 6).toUpperCase()}
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="fw-bold">{order.totalPrice.toLocaleString('vi-VN')}₫</td>
                <td>{getStatusBadge(order.status)}</td>
                <td className="text-center">
                    {/* Nút Xem Chi Tiết */}
                    <Button 
                        variant="outline-info" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleViewDetails(order)}
                        title="Xem chi tiết"
                    >
                        <Eye />
                    </Button>

                    {/* Nút Hủy Đơn (Chỉ hiện khi Pending) */}
                    {order.status === 'Pending' && (
                        <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleCancelClick(order._id)} 
                            title="Hủy đơn hàng"
                        >
                            <XCircle />
                        </Button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
            <Modal.Title>Chi tiết đơn hàng #{selectedOrder?._id.substring(selectedOrder._id.length - 6).toUpperCase()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {selectedOrder && (
                <>
                    {/* Thông tin chung */}
                    <div className="mb-4 p-3 bg-light rounded border">
                        <Row>
                            <Col md={6}>
                                <p className="mb-1"><strong>Người nhận:</strong> {selectedOrder.shippingAddress.fullName}</p>
                                <p className="mb-1"><strong>SĐT:</strong> {selectedOrder.shippingAddress.phone}</p>
                                <p className="mb-1"><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress.address}</p>
                            </Col>
                            <Col md={6}>
                                <p className="mb-1"><strong>Ngày đặt:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                                <p className="mb-1"><strong>Thanh toán:</strong> {selectedOrder.paymentMethod}</p>
                                <p className="mb-0"><strong>Trạng thái:</strong> {getStatusBadge(selectedOrder.status)}</p>
                            </Col>
                        </Row>
                    </div>

                    {/* Danh sách sản phẩm */}
                    <h6 className="mb-3">Sản phẩm</h6>
                    <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                        {selectedOrder.orderItems.map((item, index) => (
                            <div key={index} className="d-flex align-items-center mb-3 border-bottom pb-3">
                                <Image 
                                    src={item.imageUrl} 
                                    rounded 
                                    style={{width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px'}} 
                                />
                                <div className="flex-grow-1">
                                    <div className="fw-bold">{item.name}</div>
                                    <div className="text-muted small">x{item.quantity}</div>
                                </div>
                                <div className="fw-bold">
                                    {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Tổng kết tiền */}
                    <div className="text-end mt-3">
                        <p className="mb-1">Tạm tính: {(selectedOrder.totalPrice - 30000 + (selectedOrder.discountAmount || 0)).toLocaleString()}₫</p>
                        <p className="mb-1">Phí ship: 30.000₫</p>
                        {selectedOrder.discountAmount > 0 && (
                            <p className="mb-1 text-success">Giảm giá: -{selectedOrder.discountAmount.toLocaleString()}₫</p>
                        )}
                        <h4 className="text-primary mt-2">Tổng cộng: {selectedOrder.totalPrice.toLocaleString('vi-VN')}₫</h4>
                    </div>
                </>
            )}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
            {/* Nút hủy trong Modal chi tiết */}
            {selectedOrder?.status === 'Pending' && (
                <Button variant="danger" onClick={() => {
                    setShowModal(false); // Đóng modal chi tiết trước
                    handleCancelClick(selectedOrder._id); // Mở modal hủy
                }}>
                    Hủy Đơn Hàng
                </Button>
            )}
        </Modal.Footer>
      </Modal>

      {/* --- MODAL XÁC NHẬN HỦY --- */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="bg-warning border-0">
            <Modal.Title>Xác nhận Hủy đơn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>Bạn có chắc chắn muốn hủy đơn hàng này không?</p>
            <p className="text-muted small">Hành động này không thể hoàn tác. Nếu bạn đã thanh toán online, vui lòng liên hệ CSKH để được hoàn tiền.</p>
        </Modal.Body>
        <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                Không, giữ lại
            </Button>
            <Button variant="danger" onClick={confirmCancelOrder}>
                Đồng ý Hủy
            </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}