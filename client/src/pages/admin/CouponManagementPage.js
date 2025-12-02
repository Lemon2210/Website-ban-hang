import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Trash, Plus } from 'react-bootstrap-icons';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

function CouponManagementPage() {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    code: '', type: 'percent', value: '', minOrderValue: 0, expirationDate: ''
  });

  // 1. Load Coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // --- SỬA ĐƯỜNG DẪN: /coupons thay vì /admin/coupons ---
      const { data } = await api.get('/coupons', config);
      
      setCoupons(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  // 2. Tạo Coupon mới
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // --- SỬA ĐƯỜNG DẪN ---
      await api.post('/coupons', formData, config);
      
      toast.success('Tạo mã giảm giá thành công!');
      setShowModal(false);
      fetchCoupons(); // Tải lại danh sách
      // Reset form
      setFormData({ code: '', type: 'percent', value: '', minOrderValue: 0, expirationDate: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo mã.');
    }
  };

  // 3. Xóa Coupon
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mã này?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // --- SỬA ĐƯỜNG DẪN ---
      await api.delete(`/coupons/${id}`, config);
      
      toast.success('Đã xóa mã.');
      fetchCoupons();
    } catch (err) {
      toast.error('Lỗi xóa mã.');
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Mã Giảm Giá</h2>
        <Button variant="dark" onClick={() => setShowModal(true)}>
          <Plus size={20} className="me-2"/> Thêm Mã Mới
        </Button>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Mã Code</th>
            <th>Loại</th>
            <th>Giá trị</th>
            <th>Đơn tối thiểu</th>
            <th>Hết hạn</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {coupons.length === 0 ? (
              <tr><td colSpan="6" className="text-center">Chưa có mã giảm giá nào.</td></tr>
          ) : (
              coupons.map(c => (
                <tr key={c._id}>
                  <td className="fw-bold text-primary">{c.code}</td>
                  <td>{c.type === 'percent' ? 'Phần trăm' : 'Số tiền'}</td>
                  <td>{c.type === 'percent' ? `${c.value}%` : `${c.value.toLocaleString()}₫`}</td>
                  <td>{c.minOrderValue.toLocaleString()}₫</td>
                  <td>{new Date(c.expirationDate).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(c._id)}>
                      <Trash />
                    </Button>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </Table>

      {/* Modal Thêm Mới */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Tạo Mã Giảm Giá</Modal.Title></Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Row className="mb-3">
                <Col>
                    <Form.Label>Mã Code (*)</Form.Label>
                    <Form.Control 
                        required 
                        placeholder="VD: SALE50" 
                        value={formData.code} 
                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                    />
                </Col>
                <Col>
                    <Form.Label>Ngày hết hạn (*)</Form.Label>
                    <Form.Control 
                        required 
                        type="date" 
                        value={formData.expirationDate} 
                        onChange={e => setFormData({...formData, expirationDate: e.target.value})} 
                    />
                </Col>
            </Row>
            <Row className="mb-3">
                <Col>
                    <Form.Label>Loại giảm giá</Form.Label>
                    <Form.Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="percent">Theo Phần trăm (%)</option>
                        <option value="fixed">Số tiền cố định (VND)</option>
                    </Form.Select>
                </Col>
                <Col>
                    <Form.Label>Giá trị giảm (*)</Form.Label>
                    <Form.Control 
                        required 
                        type="number" 
                        placeholder={formData.type === 'percent' ? 'VD: 10' : 'VD: 50000'}
                        value={formData.value} 
                        onChange={e => setFormData({...formData, value: e.target.value})} 
                    />
                </Col>
            </Row>
            <Form.Group className="mb-3">
                <Form.Label>Đơn hàng tối thiểu (VND)</Form.Label>
                <Form.Control 
                    type="number" 
                    value={formData.minOrderValue} 
                    onChange={e => setFormData({...formData, minOrderValue: e.target.value})} 
                />
                <Form.Text className="text-muted">Nhập 0 nếu không yêu cầu tối thiểu.</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button variant="dark" type="submit">Tạo Mã</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default CouponManagementPage;