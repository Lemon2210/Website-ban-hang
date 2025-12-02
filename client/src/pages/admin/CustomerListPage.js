import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Alert, Row, Col, InputGroup, FormControl, Card, Modal } from 'react-bootstrap';
import { Search, Lock, Unlock, Eye, ClockHistory } from 'react-bootstrap-icons';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

function CustomerListPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State cho Modal Lịch sử
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { user: currentUser } = useAuth();

  // 1. Tải danh sách User
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const { data } = await api.get('/admin/users', config);
      // Chỉ lấy những người là 'user' (khách hàng), loại bỏ admin
      const onlyCustomers = data.filter(u => u.role === 'user');
      setCustomers(onlyCustomers);
      setLoading(false);
    } catch (err) {
      setError('Lỗi tải danh sách khách hàng.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 2. Logic Tìm kiếm Realtime
  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
        c.name.toLowerCase().includes(term) || 
        c.email.toLowerCase().includes(term)
    );
  });

  // 3. Xử lý Khóa/Mở khóa
  const handleToggleLock = async (customer) => {
    if (!window.confirm(`Bạn có chắc muốn ${customer.isLocked ? 'MỞ KHÓA' : 'KHÓA'} tài khoản này?`)) return;
    
    try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        await api.put(`/admin/users/${customer._id}/lock`, {}, config);
        toast.success('Cập nhật trạng thái thành công!');
        fetchCustomers(); // Tải lại danh sách
    } catch (err) {
        toast.error('Lỗi cập nhật trạng thái.');
    }
  };

  // 4. Xử lý Xem lịch sử
  const handleViewHistory = async (customer) => {
      setSelectedCustomer(customer);
      setShowHistoryModal(true);
      setLoadingHistory(true);
      try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        const { data } = await api.get(`/admin/users/${customer._id}/history`, config);
        setCustomerOrders(data);
      } catch (err) {
          toast.error('Không thể tải lịch sử mua hàng.');
      } finally {
          setLoadingHistory(false);
      }
  };

  return (
    <div>
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="mb-1">Quản lý Khách hàng</h2>
          <p className="text-muted">Xem danh sách và quản lý trạng thái khách hàng</p>
        </Col>
      </Row>

      {/* Thanh Tìm kiếm */}
      <Card className="p-3 mb-4 shadow-sm border-0">
        <InputGroup>
            <InputGroup.Text className="bg-white border-end-0"><Search /></InputGroup.Text>
            <FormControl 
                placeholder="Tìm kiếm theo tên hoặc email..." 
                className="border-start-0 ps-0"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </InputGroup>
      </Card>

      {/* Bảng Danh sách */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
            <Table striped hover responsive className="mb-0 align-middle">
                <thead className="bg-light">
                    <tr>
                        <th className="ps-4">Tên Khách hàng</th>
                        <th>Email</th>
                        <th>Ngày đăng ký</th>
                        <th>Trạng thái</th>
                        <th className="text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCustomers.map(c => (
                        <tr key={c._id}>
                            <td className="ps-4 fw-bold">{c.name}</td>
                            <td>{c.email}</td>
                            <td>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td>
                                {c.isLocked ? (
                                    <Badge bg="danger">Đã khóa</Badge>
                                ) : (
                                    <Badge bg="success">Hoạt động</Badge>
                                )}
                            </td>
                            <td className="text-center">
                                <Button 
                                    variant="outline-info" 
                                    size="sm" 
                                    className="me-2"
                                    title="Xem lịch sử mua hàng"
                                    onClick={() => handleViewHistory(c)}
                                >
                                    <ClockHistory />
                                </Button>
                                <Button 
                                    variant={c.isLocked ? "outline-success" : "outline-warning"} 
                                    size="sm"
                                    title={c.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                    onClick={() => handleToggleLock(c)}
                                >
                                    {c.isLocked ? <Unlock /> : <Lock />}
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {filteredCustomers.length === 0 && !loading && (
                        <tr><td colSpan="5" className="text-center py-4 text-muted">Không tìm thấy khách hàng nào.</td></tr>
                    )}
                </tbody>
            </Table>
        </Card.Body>
      </Card>

      {/* MODAL LỊCH SỬ MUA HÀNG */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg" centered>
        <Modal.Header closeButton>
            <Modal.Title>Lịch sử mua hàng: {selectedCustomer?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{maxHeight: '60vh', overflowY: 'auto'}}>
            {loadingHistory ? (
                <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : customerOrders.length === 0 ? (
                <Alert variant="info">Khách hàng này chưa có đơn hàng nào.</Alert>
            ) : (
                <Table bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Ngày đặt</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customerOrders.map(order => (
                            <tr key={order._id}>
                                <td>#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                                <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                                <td className="fw-bold">{order.totalPrice.toLocaleString()}₫</td>
                                <td>
                                    <Badge bg={
                                        order.status === 'Delivered' ? 'success' :
                                        order.status === 'Cancelled' ? 'danger' : 'warning'
                                    }>
                                        {order.status}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CustomerListPage;