import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Spinner, Alert, Modal, Form, Image, InputGroup, FormControl, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Link } from 'react-router-dom';
import { Eye, XCircle, StarFill, Star, CheckCircleFill, Search } from 'react-bootstrap-icons';
import { toast } from 'sonner';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- STATE CHO CÁC MODAL ---
  const [showModal, setShowModal] = useState(false); // Modal Chi tiết
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false); // Modal Hủy
  const [orderToCancel, setOrderToCancel] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false); // Modal Đánh giá
  const [reviewItem, setReviewItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const [showSuccessModal, setShowSuccessModal] = useState(false); // Modal Thành công

  // --- 1. TẢI DANH SÁCH ĐƠN HÀNG ---
  const fetchMyOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.get('/orders/myorders', config);
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- 2. LOGIC TÌM KIẾM REALTIME ---
  const filteredOrders = orders.filter(order => 
    order._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 3. XỬ LÝ XEM CHI TIẾT (GỌI API LẤY REVIEW) ---
  const handleViewDetails = async (orderId) => {
      setShowModal(true);
      setLoadingDetails(true);
      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          // Gọi API lấy chi tiết đơn hàng (bao gồm reviews)
          const { data } = await api.get(`/orders/${orderId}`, config);
          setSelectedOrder(data);
      } catch (err) {
          toast.error('Không thể tải chi tiết đơn hàng.');
          setShowModal(false);
      } finally {
          setLoadingDetails(false);
      }
  };

  // Helper: Tìm review của sản phẩm trong đơn hàng này
  const getReviewForProduct = (productId) => {
      if (!selectedOrder || !selectedOrder.reviews) return null;
      // productId là ID của Product Gốc
      return selectedOrder.reviews.find(r => r.product === productId);
  };

  // --- 4. XỬ LÝ HỦY ĐƠN ---
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
        fetchMyOrders(); 
        setShowCancelModal(false); 
    } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi hủy đơn.');
        setShowCancelModal(false);
    }
  };

  // --- 5. XỬ LÝ ĐÁNH GIÁ ---
  const openReviewModal = (item) => {
      setReviewItem(item);
      setRating(5);
      setComment('');
      setShowReviewModal(true);
  };

  const submitReview = async (e) => {
      e.preventDefault();
      if (rating === 0) { alert("Vui lòng chọn số sao!"); return; }

      try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          // Xử lý ID an toàn
          const invId = (reviewItem.inventory && reviewItem.inventory._id) ? reviewItem.inventory._id : reviewItem.inventory;

          await api.post('/reviews', {
              rating,
              comment, 
              inventoryId: invId,
              orderId: selectedOrder._id
          }, config);

          // Thành công -> Reload lại chi tiết đơn hàng để cập nhật giao diện ngay lập tức
          await handleViewDetails(selectedOrder._id);

          setShowReviewModal(false);
          setShowSuccessModal(true);
          
      } catch (err) {
          const msg = err.response?.data?.message || 'Lỗi khi gửi đánh giá.';
          alert("Lỗi: " + msg);
      }
  };

  // --- UI HELPERS ---
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

      {/* Thanh tìm kiếm */}
      <Card className="mb-4 shadow-sm border-0">
        <InputGroup>
            <InputGroup.Text className="bg-white border-end-0"><Search /></InputGroup.Text>
            <FormControl 
                placeholder="Tìm theo mã đơn hàng..." 
                className="border-start-0 ps-0"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </InputGroup>
      </Card>
      
      {filteredOrders.length === 0 ? (
        <Alert variant="info">Không tìm thấy đơn hàng nào. <Link to="/">Mua sắm ngay</Link></Alert>
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
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td className="fw-bold text-primary">#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="fw-bold">{order.totalPrice.toLocaleString('vi-VN')}₫</td>
                <td>{getStatusBadge(order.status)}</td>
                <td className="text-center">
                    <Button 
                        variant="outline-info" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleViewDetails(order._id)}
                        title="Xem chi tiết"
                    >
                        <Eye />
                    </Button>

                    {order.status === 'Pending' && (
                        <Button variant="outline-danger" size="sm" onClick={() => handleCancelClick(order._id)}><XCircle /></Button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton>
            <Modal.Title>Chi tiết đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {loadingDetails ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : selectedOrder ? (
                <>
                    <div className="mb-4 p-3 bg-light rounded border">
                        <Row>
                             <Col md={6}>
                                <p className="mb-1"><strong>Mã đơn:</strong> #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}</p>
                                <p className="mb-1"><strong>Ngày đặt:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                                <p className="mb-0"><strong>Trạng thái:</strong> {getStatusBadge(selectedOrder.status)}</p>
                             </Col>
                             <Col md={6}>
                                <p className="mb-1"><strong>Người nhận:</strong> {selectedOrder.shippingAddress.fullName}</p>
                                <p className="mb-1"><strong>SĐT:</strong> {selectedOrder.shippingAddress.phone}</p>
                                <p className="mb-0"><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress.address}</p>
                             </Col>
                        </Row>
                    </div>

                    <h6 className="mb-3">Sản phẩm</h6>
                    <div>
                        {selectedOrder.orderItems.map((item, index) => {
                            // Tìm review của sản phẩm này (nếu có)
                            const userReview = getReviewForProduct(item.inventory.product._id);

                            return (
                                <div key={index} className="mb-3 border-bottom pb-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <Image src={item.imageUrl} rounded style={{width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px'}} />
                                        <div className="flex-grow-1">
                                            <div className="fw-bold">{item.name}</div>
                                            <div className="text-muted small">x{item.quantity}</div>
                                        </div>
                                        <div className="text-end">
                                            <div className="fw-bold mb-1">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</div>
                                        </div>
                                    </div>

                                    {/* LOGIC HIỂN THỊ ĐÁNH GIÁ */}
                                    {selectedOrder.status === 'Delivered' && (
                                        <div className="ms-5 ps-4">
                                            {userReview ? (
                                                // ĐÃ ĐÁNH GIÁ
                                                <div className="bg-light p-2 rounded border border-warning bg-opacity-10">
                                                    <div className="d-flex align-items-center mb-1 text-warning">
                                                        <span className="me-2 fw-bold text-dark" style={{fontSize:'0.85rem'}}>Đánh giá của bạn:</span>
                                                        {[...Array(5)].map((_, i) => (
                                                            i < userReview.rating ? <StarFill key={i} size={12}/> : <Star key={i} size={12}/>
                                                        ))}
                                                    </div>
                                                    {userReview.comment ? (
                                                        <p className="mb-0 small text-muted fst-italic">"{userReview.comment}"</p>
                                                    ) : (
                                                        <p className="mb-0 small text-muted fst-italic">(Không có lời bình)</p>
                                                    )}
                                                </div>
                                            ) : (
                                                // CHƯA ĐÁNH GIÁ -> NÚT ĐÁNH GIÁ
                                                <div className="text-end">
                                                    <Button 
                                                        variant="warning" 
                                                        size="sm" 
                                                        style={{fontSize: '0.8rem'}}
                                                        onClick={() => openReviewModal(item)}
                                                    >
                                                        <StarFill className="me-1 mb-1" size={12}/>Đánh giá ngay
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="text-end mt-3">
                         <p className="mb-1">Tạm tính: {(selectedOrder.totalPrice - 30000 + (selectedOrder.discountAmount || 0)).toLocaleString()}₫</p>
                         {selectedOrder.discountAmount > 0 && <p className="mb-1 text-success">Giảm giá: -{selectedOrder.discountAmount.toLocaleString()}₫</p>}
                         <p className="mb-1">Phí ship: 30.000₫</p>
                        <h4 className="text-primary mt-2">Tổng cộng: {selectedOrder.totalPrice.toLocaleString('vi-VN')}₫</h4>
                    </div>
                </>
            ) : <p className="text-center py-4">Không có dữ liệu.</p>}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
            {selectedOrder?.status === 'Pending' && (
                <Button variant="danger" onClick={() => { setShowModal(false); handleCancelClick(selectedOrder._id); }}>
                    Hủy Đơn Hàng
                </Button>
            )}
        </Modal.Footer>
      </Modal>

      {/* --- MODAL NHẬP ĐÁNH GIÁ --- */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered backdrop="static" style={{zIndex: 1060}}>
        <Modal.Header closeButton><Modal.Title>Đánh giá sản phẩm</Modal.Title></Modal.Header>
        <Modal.Body>
            <div className="text-center mb-4">
                <p className="fw-bold mb-2">{reviewItem?.name}</p>
                <div className="fs-1 text-warning" style={{cursor: 'pointer'}}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} onClick={() => setRating(star)} className="mx-1">
                            {star <= rating ? <StarFill /> : <Star />}
                        </span>
                    ))}
                </div>
                <p className="text-muted small mt-2">{rating === 5 ? "Tuyệt vời!" : rating >= 4 ? "Hài lòng" : "Bình thường"}</p>
            </div>
            <Form onSubmit={submitReview}>
                <Form.Group className="mb-3">
                    <Form.Label>Nhận xét (Tùy chọn)</Form.Label>
                    <Form.Control as="textarea" rows={3} placeholder="Chia sẻ trải nghiệm..." value={comment} onChange={(e) => setComment(e.target.value)} />
                </Form.Group>
                <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Hủy</Button>
                    <Button variant="primary" type="submit">Gửi Đánh Giá</Button>
                </div>
            </Form>
        </Modal.Body>
      </Modal>

      {/* --- MODAL THÀNH CÔNG --- */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered style={{zIndex: 1070}}>
        <Modal.Body className="text-center py-5">
            <div className="text-success mb-3"><CheckCircleFill size={60} /></div>
            <h4 className="mb-3">Đánh giá thành công!</h4>
            <p className="text-muted">Cảm ơn bạn đã dành thời gian.</p>
            <Button variant="success" onClick={() => setShowSuccessModal(false)}>Đóng</Button>
        </Modal.Body>
      </Modal>

      {/* Modal Hủy */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="bg-warning border-0"><Modal.Title>Xác nhận Hủy đơn</Modal.Title></Modal.Header>
        <Modal.Body><p>Bạn có chắc chắn muốn hủy đơn hàng này không?</p></Modal.Body>
        <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Không</Button>
            <Button variant="danger" onClick={confirmCancelOrder}>Đồng ý Hủy</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}