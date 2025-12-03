import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Row, Col, InputGroup, FormControl, Card } from 'react-bootstrap';
import { Search, Trash, StarFill, Star } from 'react-bootstrap-icons';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

function ReviewListPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();

  // 1. Tải danh sách đánh giá
  const fetchReviews = async () => {
    if (!user || !user.token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.get('/admin/reviews', config);
      setReviews(data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách đánh giá.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2. Logic Tìm kiếm (theo tên khách hàng hoặc tên sản phẩm)
  const filteredReviews = reviews.filter((review) => {
    const term = searchTerm.toLowerCase();
    const customerName = review.user?.name?.toLowerCase() || '';
    const productName = review.product?.name?.toLowerCase() || '';
    
    return customerName.includes(term) || productName.includes(term);
  });

  // 3. Xóa đánh giá
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await api.delete(`/admin/reviews/${id}`, config);
        toast.success('Đã xóa đánh giá.');
        fetchReviews(); // Reload
    } catch (err) {
        toast.error('Lỗi khi xóa đánh giá.');
    }
  };

  // Render Sao
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
        i < rating 
        ? <StarFill key={i} className="text-warning me-1" size={12} /> 
        : <Star key={i} className="text-warning me-1" size={12} />
    ));
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="mb-1">Quản lý Đánh giá</h2>
          <p className="text-muted">Xem và quản lý phản hồi của khách hàng</p>
        </Col>
      </Row>

      {/* Thanh Tìm kiếm */}
      <Card className="p-3 mb-4 shadow-sm border-0">
        <InputGroup>
            <InputGroup.Text className="bg-white border-end-0"><Search /></InputGroup.Text>
            <FormControl 
                placeholder="Tìm theo tên khách hàng hoặc tên sản phẩm..." 
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
                        <th className="ps-4" style={{width: '15%'}}>Khách hàng</th>
                        <th style={{width: '25%'}}>Sản phẩm</th>
                        <th style={{width: '15%'}}>Đánh giá</th>
                        <th style={{width: '30%'}}>Bình luận</th>
                        <th style={{width: '10%'}}>Ngày</th>
                        <th className="text-center" style={{width: '5%'}}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredReviews.map(review => (
                        <tr key={review._id}>
                            <td className="ps-4">
                                <div className="fw-bold">{review.user?.name || 'N/A'}</div>
                                <div className="small text-muted">{review.user?.email}</div>
                            </td>
                            <td>{review.product?.name || 'Sản phẩm đã xóa'}</td>
                            <td>
                                <div className="d-flex">{renderStars(review.rating)}</div>
                            </td>
                            <td>
                                <span className="text-muted small fst-italic">"{review.comment}"</span>
                            </td>
                            <td>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td className="text-center">
                                <Button 
                                    variant="outline-danger" 
                                    size="sm" 
                                    onClick={() => handleDelete(review._id)}
                                    title="Xóa đánh giá"
                                >
                                    <Trash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {filteredReviews.length === 0 && (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">Không tìm thấy đánh giá nào.</td></tr>
                    )}
                </tbody>
            </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

export default ReviewListPage;