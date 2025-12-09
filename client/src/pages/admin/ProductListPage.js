import React, { useState, useEffect } from 'react';
import { Table, Button, Image, Spinner, Alert, Badge, Row, Col, InputGroup, FormControl, Modal, Form } from 'react-bootstrap';
import { PencilSquare, Trash, PlusLg, Search, Filter } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import api from '../../api'; 
import { useAuth } from '../../context/AuthContext';

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- STATE TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState(''); 

  // --- STATE CHO MODAL XÓA ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [confirmSku, setConfirmSku] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { user } = useAuth();

  // --- 1. HÀM TẢI DỮ LIỆU ---
  const fetchProductsAdmin = async () => {
    if (!user || !user.token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // API này trả về danh sách Inventory (biến thể) đã populate product
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- 2. LOGIC LỌC SẢN PHẨM ---
  const filteredProducts = products.filter((item) => {
    const term = searchTerm.toLowerCase();
    
    // Lấy thông tin để tìm kiếm
    const name = item.product?.name?.toLowerCase() || '';
    const sku = item.sku?.toLowerCase() || '';
    
    // Lấy tên danh mục để tìm kiếm (nếu có populate)
    const catName = item.product?.category?.name?.toLowerCase() || '';
    const subCatName = item.product?.subCategory?.name?.toLowerCase() || '';
    const brandName = item.product?.brand?.name?.toLowerCase() || '';

    // Tìm kiếm trong Tên, SKU, hoặc Danh mục/Brand
    return name.includes(term) || sku.includes(term) || catName.includes(term) || subCatName.includes(term) || brandName.includes(term);
  });

  const getStockInfo = (stockArray) => {
    if (!stockArray) return { totalStock: 0, status: "Hết hàng", variant: "danger" };
    const totalStock = stockArray.reduce((acc, store) => acc + store.quantity, 0);
    
    let variant, status, text;
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

  const handleDeleteClick = (item) => {
    setProductToDelete(item);
    setConfirmSku('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    if (confirmSku !== productToDelete.sku) {
      setDeleteError('Mã SKU không khớp!');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await api.delete(`/admin/products/${productToDelete._id}`, config);
      setShowDeleteModal(false);
      alert('Đã xóa sản phẩm thành công!');
      fetchProductsAdmin(); 
    } catch (err) {
      setDeleteError('Lỗi server: Không thể xóa sản phẩm.');
    }
  };

  // --- 4. RENDER GIAO DIỆN ---
  const renderContent = () => {
    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    
    if (filteredProducts.length === 0) {
        return <div className="text-center my-5 text-muted">Không tìm thấy sản phẩm nào khớp với "{searchTerm}".</div>;
    }

    return (
      <Table striped bordered hover responsive className="align-middle">
        <thead className="table-dark">
          <tr>
            <th>Sản phẩm</th>
            <th>Mã (SKU)</th>
            {/* --- CẬP NHẬT CỘT DANH MỤC --- */}
            <th>Danh mục / Brand</th> 
            {/* ----------------------------- */}
            <th>Giá (VND)</th>
            <th>SL</th>
            <th>Trạng thái</th>
            <th className="text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((item) => {
            const { totalStock, status, variant, text } = getStockInfo(item.stock);
            
            // Lấy thông tin danh mục từ product đã populate (giả sử backend đã populate)
            // Nếu backend chưa populate sâu (deep populate category), có thể chỉ hiện ID
            // Bạn cần đảm bảo controller backend có .populate('product.category') ...
            
            const catName = item.product?.category?.name || '---';
            const subName = item.product?.subCategory?.name;
            const brandName = item.product?.brand?.name;

            return (
              <tr key={item._id}>
                <td>
                  <div className="d-flex align-items-center">
                    <Image 
                      src={item.imageUrl} 
                      alt={item.sku}
                      rounded 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '15px' }}
                    />
                    <div>
                      <div className="fw-bold">{item.product?.name}</div>
                      <small className="text-muted">
                        {item.attributes.color} - {item.attributes.size}
                      </small>
                    </div>
                  </div>
                </td>
                <td>{item.sku}</td>
                
                {/* --- HIỂN THỊ DANH MỤC ĐA CẤP --- */}
                <td>
                    <div className="d-flex flex-column" style={{fontSize: '0.9rem'}}>
                        <span className="fw-bold text-primary">{catName}</span>
                        {subName && <span className="text-muted"><small>↳ {subName}</small></span>}
                        {brandName && <span className="text-dark fw-bold"><small>↳ {brandName}</small></span>}
                    </div>
                </td>
                {/* -------------------------------- */}

                <td>{item.price.toLocaleString('vi-VN')}₫</td>
                <td>{totalStock}</td>
                <td>
                  <Badge bg={variant} text={text} className="px-2 py-1">
                    {status}
                  </Badge>
                </td>
                <td className="text-center">
                  <Button 
                    as={Link} 
                    to={`/admin/products/edit/${item.product?._id}`} 
                    variant="outline-primary" 
                    size="sm" 
                    className="me-2"
                    title="Chỉnh sửa"
                  >
                    <PencilSquare />
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDeleteClick(item)}
                    title="Xóa"
                  >
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
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="mb-1">Quản lý Sản phẩm</h2>
          <p className="text-muted">Quản lý danh mục và tồn kho của bạn</p>
        </Col>
        <Col xs="auto">
          <Button as={Link} to="/admin/products/add" variant="dark">
            <PlusLg className="me-2" /> Thêm Sản phẩm
          </Button>
        </Col>
      </Row>

      {/* Thanh Tìm kiếm & Lọc */}
      <Row className="mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0">
              <Search className="text-muted" />
            </InputGroup.Text>
            <FormControl 
              placeholder="Tìm kiếm sản phẩm, SKU, hoặc danh mục..." 
              className="border-start-0 ps-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4} className="text-end">
          <Button variant="outline-secondary">
            <Filter className="me-2" /> Bộ lọc
          </Button>
        </Col>
      </Row>

      {renderContent()}

      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Xác nhận Xóa Sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn đang thực hiện xóa biến thể sản phẩm:</p>
          <div className="alert alert-warning">
            <strong>{productToDelete?.product?.name}</strong>
            <br/>
            Màu: {productToDelete?.attributes.color} | Size: {productToDelete?.attributes.size}
          </div>
          <p className="mb-2">
            Để xác nhận, vui lòng nhập chính xác mã SKU: <br/>
            <strong className="text-danger user-select-all">{productToDelete?.sku}</strong>
          </p>
          
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Nhập mã SKU vào đây..."
              value={confirmSku}
              onChange={(e) => {
                setConfirmSku(e.target.value);
                setDeleteError('');
              }}
              isInvalid={!!deleteError}
              autoFocus
            />
            <Form.Control.Feedback type="invalid">
              {deleteError}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy bỏ
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Xóa vĩnh viễn
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ProductListPage;