import React, { useState, useEffect } from 'react';
import { Table, Button, Image, Spinner, Alert, Badge, Modal, Form } from 'react-bootstrap'; // <-- Thêm Modal, Form
import { PencilSquare, Trash, PlusLg } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- STATE CHO MODAL XÓA ---
  const [showModal, setShowModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null); // Lưu sản phẩm đang chọn xóa
  const [confirmSku, setConfirmSku] = useState(''); // Lưu SKU người dùng nhập vào
  const [deleteError, setDeleteError] = useState(null); // Lưu lỗi nếu nhập sai SKU

  const { user } = useAuth();

  // Hàm tải dữ liệu (Giữ nguyên)
  const fetchProductsAdmin = async () => {
    if (!user || !user.token) {
        setError('Cần có quyền Admin để xem trang này.');
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await api.get('/admin/products', config);
      setProducts(data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAdmin();
  }, [user]);

  const getStockInfo = (stockArray) => {
    const totalStock = stockArray.reduce((acc, store) => acc + store.quantity, 0);
    let variant, text, status;
    if (totalStock > 50) {
      variant = "success"; status = "Còn hàng";
    } else if (totalStock > 0 && totalStock <= 20) {
      variant = "warning"; text = "dark"; status = "SL thấp";
    } else if (totalStock === 0) {
      variant = "danger"; status = "Hết hàng";
    } else {
      variant = "success"; status = "Còn hàng";
    }
    return { totalStock, status, variant, text };
  };

  // --- CÁC HÀM XỬ LÝ XÓA ---

  // 1. Khi nhấn nút "Thùng rác" -> Mở Modal
  const handleDeleteClick = (product) => {
    setProductToDelete(product); // Lưu thông tin sản phẩm cần xóa
    setConfirmSku(''); // Reset ô nhập
    setDeleteError(null); // Reset lỗi
    setShowModal(true); // Hiện Modal
  };

  // 2. Khi nhấn "Xác nhận xóa" trong Modal
  const handleConfirmDelete = async () => {
    // Kiểm tra SKU nhập vào có khớp không
    if (confirmSku !== productToDelete.sku) {
      setDeleteError('Mã SKU không khớp! Vui lòng nhập lại.');
      return;
    }

    // Nếu đúng SKU, gọi API xóa
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.delete(`/admin/products/${productToDelete._id}`, config);
      
      // Xóa thành công -> Đóng modal và tải lại danh sách
      setShowModal(false);
      alert('Đã xóa sản phẩm thành công.');
      fetchProductsAdmin(); 
    } catch (err) {
      setDeleteError('Lỗi server khi xóa sản phẩm.');
    }
  };

  // 3. Đóng Modal
  const handleCloseModal = () => {
    setShowModal(false);
    setProductToDelete(null);
  };


  // Render nội dung
  const renderContent = () => {
    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    
    return (
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Sản phẩm</th>
            <th>Mã (SKU)</th>
            <th>Giá</th>
            <th>SL</th>
            <th>Trạng thái</th>
            <th className="text-center">Chức năng</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => {
            const { totalStock, status, variant, text } = getStockInfo(item.stock);
            return (
              <tr key={item._id}>
                <td className="align-middle">
                  <Image src={item.imageUrl} rounded style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }} />
                  {item.product.name} <small className='text-muted'>({item.attributes.color}, {item.attributes.size})</small>
                </td>
                <td className="align-middle">{item.sku}</td>
                <td className="align-middle">{item.price.toLocaleString()}₫</td>
                <td className="align-middle">{totalStock}</td>
                <td className="align-middle"><Badge bg={variant} text={text}>{status}</Badge></td>
                <td className="align-middle text-center">
                  <Button variant="outline-primary" size="sm" className="me-2"><PencilSquare /></Button>
                  {/* Nút Xóa: Gọi hàm mở Modal */}
                  <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(item)}>
                    <Trash />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Quản lý Sản phẩm</h1>
        <Button variant="dark" as={Link} to="/admin/products/add">
          <PlusLg size={20} className="me-2" /> Thêm Sản phẩm
        </Button>
      </div>
      
      {renderContent()}

      {/* --- MODAL XÁC NHẬN XÓA --- */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Xác nhận Xóa Sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn đang yêu cầu xóa sản phẩm: <strong>{productToDelete?.product.name}</strong></p>
          <p>Mã SKU: <strong className="text-danger">{productToDelete?.sku}</strong></p>
          <hr />
          <p className="text-muted small">Hành động này không thể hoàn tác. Vui lòng nhập chính xác mã SKU <strong>"{productToDelete?.sku}"</strong> vào ô bên dưới để xác nhận.</p>
          
          <Form.Group>
            <Form.Control 
              type="text" 
              placeholder="Nhập mã SKU tại đây..." 
              value={confirmSku}
              onChange={(e) => setConfirmSku(e.target.value)}
              isInvalid={!!deleteError}
            />
            <Form.Control.Feedback type="invalid">
              {deleteError}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Hủy bỏ</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Xóa vĩnh viễn
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ProductListPage;