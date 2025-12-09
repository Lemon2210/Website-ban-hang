import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Table, Row, Col, Card, Spinner, ListGroup, Badge, Modal , Alert } from 'react-bootstrap';
import { Trash, FolderPlus, Search, CheckCircleFill, ExclamationTriangle } from 'react-bootstrap-icons';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export default function CategoryPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- STATE FORM ---
  const [name, setName] = useState('');
  const [isRoot, setIsRoot] = useState(true); 
  const [parentId, setParentId] = useState(null);
  
  // --- STATE TÌM KIẾM (AUTOCOMPLETE) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // --- STATE MODAL XÓA (MỚI) ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // Lưu object danh mục cần xóa

  // 1. Tải danh sách
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (error) {
      toast.error('Lỗi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    function handleClickOutside(event) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const createCategoryList = (categories, parentId = null) => {
    const categoryList = [];
    let category;
    if (parentId == null) {
      category = categories.filter(cat => cat.parent == null);
    } else {
      category = categories.filter(cat => cat.parent?._id === parentId || cat.parent === parentId);
    }
    for (let cat of category) {
      categoryList.push({
        _id: cat._id,
        name: cat.name,
        children: createCategoryList(categories, cat._id)
      });
    }
    return categoryList;
  };

  // 3. Xử lý Submit Thêm mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isRoot && !parentId) {
        toast.error('Vui lòng tìm và chọn một danh mục cha!');
        return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = { 
        name, 
        parent: isRoot ? null : parentId 
      };
      
      await api.post('/categories', payload, config);
      toast.success('Thêm danh mục thành công');
      setName('');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm');
    }
  };

  // --- 4. CÁC HÀM XỬ LÝ XÓA (LOGIC MỚI) ---

  // Bước 1: Kích hoạt khi bấm nút thùng rác -> Mở Modal
  const handleDeleteClick = (category) => {
      setItemToDelete(category);
      setShowDeleteModal(true);
  }

  // Bước 2: Kích hoạt khi bấm "Xóa ngay" trong Modal -> Gọi API
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await api.delete(`/categories/${itemToDelete._id}`, config);
        
        toast.success(`Đã xóa: ${itemToDelete.name}`);
        fetchCategories();
        setShowDeleteModal(false); // Đóng modal
        setItemToDelete(null);     // Reset state
    } catch (error) {
        toast.error('Lỗi khi xóa danh mục');
        setShowDeleteModal(false);
    }
  }

  // ----------------------------------------

  const filteredParents = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectParent = (cat) => {
      setParentId(cat._id);
      setSearchTerm(cat.name); 
      setShowDropdown(false); 
  }

  const renderTableRows = (categories) => {
    let myCategories = createCategoryList(categories);
    let rows = [];
    const pushRows = (comms, level = 0) => {
        for(let item of comms) {
            rows.push(
                <tr key={item._id}>
                    <td className="ps-4">
                        <div style={{ marginLeft: level * 20, display: 'flex', alignItems: 'center' }}>
                            {level > 0 && <span className="text-muted me-2" style={{borderLeft: '1px solid #ccc', borderBottom: '1px solid #ccc', width: '10px', height: '10px', display: 'inline-block'}}></span>}
                            <span className={level === 0 ? "fw-bold text-primary" : "fw-medium"}>
                                {item.name}
                            </span>
                        </div>
                    </td>
                    <td>
                        {level === 0 ? <Badge bg="success">Cấp 1</Badge> : <Badge bg="secondary">Cấp {level + 1}</Badge>}
                    </td>
                    <td className="text-end pe-4">
                        {/* Thay đổi ở đây: Gọi handleDeleteClick thay vì handleDelete */}
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(item)}>
                            <Trash/>
                        </Button>
                    </td>
                </tr>
            );
            if(item.children && item.children.length > 0) pushRows(item.children, level + 1);
        }
    }
    pushRows(myCategories);
    return rows;
  }

  return (
    <div>
      <h2 className="mb-4">Quản lý Danh mục</h2>
      
      <Row>
        <Col md={4}>
          <Card className="shadow-sm border-0 mb-4 sticky-top" style={{top: '20px', zIndex: 100}}>
              <Card.Header className="bg-white py-3 fw-bold text-uppercase text-primary">
                  <FolderPlus className="me-2"/> Thêm mới
              </Card.Header>
              <Card.Body>
                  <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Tên Danh mục</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            placeholder="VD: Áo, Gucci..." 
                          />
                      </Form.Group>

                      <Form.Group className="mb-3">
                          <Form.Check 
                            type="checkbox"
                            id="isRoot"
                            label="Đây là Danh mục gốc (Cấp 1)"
                            checked={isRoot}
                            onChange={(e) => {
                                setIsRoot(e.target.checked);
                                if(e.target.checked) {
                                    setParentId(null);
                                    setSearchTerm('');
                                }
                            }}
                            className="fw-bold text-success user-select-none"
                          />
                      </Form.Group>

                      {!isRoot && (
                          <div className="mb-3 position-relative" ref={wrapperRef}>
                              <Form.Label className="fw-bold">Thuộc danh mục nào?</Form.Label>
                              <div className="input-group">
                                  <span className="input-group-text bg-white"><Search/></span>
                                  <Form.Control
                                      type="text"
                                      placeholder="Gõ để tìm cha (VD: Áo...)"
                                      value={searchTerm}
                                      onChange={(e) => {
                                          setSearchTerm(e.target.value);
                                          setShowDropdown(true);
                                          setParentId(null);
                                      }}
                                      onFocus={() => setShowDropdown(true)}
                                      className={parentId ? "is-valid" : ""}
                                  />
                              </div>
                              {showDropdown && (
                                  <ListGroup className="position-absolute w-100 shadow-lg" style={{zIndex: 1000, maxHeight: '200px', overflowY: 'auto'}}>
                                      {filteredParents.length > 0 ? (
                                          filteredParents.map(cat => (
                                              <ListGroup.Item 
                                                  key={cat._id} 
                                                  action 
                                                  onClick={() => handleSelectParent(cat)}
                                                  className="d-flex justify-content-between align-items-center"
                                              >
                                                  {cat.name}
                                                  {cat.parent && <small className="text-muted ms-2">({cat.parent.name})</small>}
                                              </ListGroup.Item>
                                          ))
                                      ) : (
                                          <ListGroup.Item disabled>Không tìm thấy danh mục nào</ListGroup.Item>
                                      )}
                                  </ListGroup>
                              )}
                              {parentId && <Form.Text className="text-success"><CheckCircleFill/> Đã chọn cha: <strong>{searchTerm}</strong></Form.Text>}
                          </div>
                      )}
                      
                      <div className="d-grid mt-4">
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? <Spinner size="sm"/> : 'Lưu Danh mục'}
                        </Button>
                      </div>
                  </Form>
              </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm border-0">
              <Card.Header className="bg-white py-3 fw-bold">Cấu trúc Danh mục</Card.Header>
              <Card.Body className="p-0">
                  <Table hover responsive className="mb-0 align-middle">
                      <thead className="bg-light">
                        <tr>
                            <th className="ps-4">Tên Danh mục</th>
                            <th>Cấp độ</th>
                            <th className="text-end pe-4">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                          {loading && categories.length === 0 ? (
                              <tr><td colSpan="3" className="text-center py-4"><Spinner animation="border"/></td></tr>
                          ) : (
                              renderTableRows(categories)
                          )}
                      </tbody>
                  </Table>
              </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- MODAL XÁC NHẬN XÓA --- */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)}
        centered
        backdrop="static" // Bắt buộc bấm nút mới đóng được (tránh lỡ tay click ra ngoài)
      >
        <Modal.Header closeButton className="bg-light">
            <Modal.Title className="text-danger d-flex align-items-center">
                <ExclamationTriangle className="me-2"/> Xác nhận xóa
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>Bạn có chắc chắn muốn xóa danh mục: <strong className="text-primary">{itemToDelete?.name}</strong>?</p>
            
            <Alert variant="warning" className="d-flex align-items-start">
                <ExclamationTriangle className="mt-1 me-2 flex-shrink-0"/>
                <div className="small">
                    <strong>Cảnh báo:</strong> Nếu đây là danh mục cha (Cấp 1, Cấp 2...), tất cả các danh mục con bên trong nó cũng có thể bị mất hoặc trở thành danh mục mồ côi. Hãy cân nhắc kỹ!
                </div>
            </Alert>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Hủy bỏ
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
                Xóa ngay
            </Button>
        </Modal.Footer>
      </Modal>
      {/* ------------------------- */}

    </div>
  );
}