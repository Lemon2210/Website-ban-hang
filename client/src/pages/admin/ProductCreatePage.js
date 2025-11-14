import React, { useState, useCallback } from 'react';
import { Form, Button, Card, Alert, Row, Col, Image, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; // <-- THÊM useNavigate
import { useDropzone } from 'react-dropzone';
import { CloudUpload } from 'react-bootstrap-icons';
import api from '../../api'; // <-- THÊM "BỘ NÃO" API
import { useAuth } from '../../context/AuthContext'; // <-- THÊM "BỘ NHỚ" AUTH

function ProductCreatePage() {
  // --- State cho Form ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mainCategory, setMainCategory] = useState('Áo');
  const [subCategory, setSubCategory] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('');

  // --- State cho Ảnh ---
  const [selectedFile, setSelectedFile] = useState(null); 
  const [preview, setPreview] = useState(''); 

  // --- State điều khiển ---
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- Lấy Token và Điều hướng ---
  const { user } = useAuth(); // Lấy thông tin user (để lấy token)
  const navigate = useNavigate(); // Dùng để chuyển trang sau khi tạo

  // --- Cấu hình React Dropzone ---
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file)); 
      setError(null); 
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1, 
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <div key={file.path} className="text-danger mt-2">
      {file.path} - {file.size / 1024 / 1024} MB.
      {errors.map(e => <span key={e.code}> {e.message}</span>)}
    </div>
  ));

  // --- (HÀM SUBMIT FORM - ĐÃ CẬP NHẬT HOÀN CHỈNH) ---
  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Kiểm tra xem có file ảnh không
    if (!selectedFile) {
        setError('Vui lòng chọn một hình ảnh sản phẩm.');
        setLoading(false);
        return;
    }
    
    // 2. Tạo FormData
    // (Chúng ta phải dùng FormData vì chúng ta gửi file, không phải JSON)
    const formData = new FormData();
    
    // Thêm các trường dữ liệu text
    formData.append('name', name);
    formData.append('description', description);
    formData.append('mainCategory', mainCategory);
    formData.append('subCategory', subCategory);
    formData.append('sku', sku);
    formData.append('price', price);
    formData.append('color', color);
    formData.append('size', size);
    formData.append('quantity', quantity);
    
    // Thêm file ảnh (tên trường phải là "image" như backend mong đợi)
    formData.append('image', selectedFile);

    try {
      // 3. Cấu hình (gửi token)
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data', // Quan trọng: Báo cho server biết đây là form-data
          Authorization: `Bearer ${user.token}`,
        },
      };

      // 4. Gửi request đến API
      await api.post('/admin/products', formData, config);

      // 5. Xử lý thành công
      setLoading(false);
      alert('Tạo sản phẩm thành công!');
      navigate('/admin/products'); // Chuyển về trang danh sách
      
    } catch (err) {
      // 6. Xử lý lỗi
      setLoading(false);
      const message = err.response?.data?.message || 'Đã có lỗi xảy ra từ server.';
      setError(message);
      console.error(err);
    }
  };

  return (
    <>
      <Button as={Link} to="/admin/products" variant="outline-dark" className="mb-3">
        Quay lại Danh sách
      </Button>
      <h1 className="mb-4">Thêm Sản phẩm Mới</h1>
      
      {/* Quan trọng: Chúng ta KHÔNG dùng <Form onSubmit={...}> của React-Bootstrap 
        vì nó không hỗ trợ 'enctype' dễ dàng. Chúng ta dùng thẻ <form> HTML 
        thông thường.
      */}
      <form onSubmit={submitHandler}>
        <Row>
          {/* ============ CỘT TRÁI (Thông tin chính) ============ */}
          <Col md={8}>
            {/* --- Thông tin Cơ bản (Sản phẩm Gốc) --- */}
            <Card className="mb-3">
              <Card.Header as="h5">Thông tin Cơ bản (Sản phẩm Gốc)</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3" controlId="productName">
                  <Form.Label>Tên Sản phẩm (*)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Ví dụ: Áo Polo Thể Thao Promax" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="productDescription">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={5} 
                    placeholder="Mô tả chi tiết, chất liệu,..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="mainCategory">
                      <Form.Label>Danh mục chính (*)</Form.Label>
                      <Form.Select 
                        value={mainCategory}
                        onChange={(e) => setMainCategory(e.target.value)}
                      >
                        <option value="Áo">Áo</option>
                        <option value="Quần">Quần</option>
                        <option value="Phụ kiện">Phụ kiện</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="subCategory">
                      <Form.Label>Danh mục phụ (*)</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Ví dụ: Áo Polo, Quần Jean" 
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* --- Biến thể đầu tiên (Inventory) --- */}
            <Card className="mb-3">
              <Card.Header as="h5">Biến thể đầu tiên (Inventory)</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="sku">
                      <Form.Label>SKU (Mã sản phẩm) (*)</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="POLO-BLK-S" 
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        required 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                     <Form.Group className="mb-3" controlId="price">
                      <Form.Label>Giá (VND) (*)</Form.Label>
                      <Form.Control 
                        type="number" 
                        placeholder="349000" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required 
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="color">
                      <Form.Label>Màu sắc (*)</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Đen" 
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        required 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                     <Form.Group className="mb-3" controlId="size">
                      <Form.Label>Kích cỡ (*)</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="S" 
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        required 
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          
          {/* ============ CỘT PHẢI (Ảnh & Tồn kho) ============ */}
          <Col md={4}>
            <Card className="mb-3">
              <Card.Header as="h5">Ảnh sản phẩm (*)</Card.Header>
              <Card.Body>
                {/* --- Dropzone Component --- */}
                <div 
                  {...getRootProps()} 
                  className={`dropzone p-5 text-center border border-2 border-dashed rounded ${isDragActive ? 'border-primary bg-light' : 'border-secondary'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <input {...getInputProps()} />
                  <CloudUpload size={48} className="text-muted mb-3 mx-auto" />
                  <p className="text-muted mb-1">Kéo thả ảnh vào đây hoặc</p>
                  <Button variant="outline-dark" size="sm">Chọn ảnh</Button>
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.8rem' }}>
                    PNG, JPG, WEBP lên đến 10MB
                  </p>
                </div>
                {fileRejectionItems.length > 0 && (
                  <Alert variant="danger" className="mt-3">
                    {fileRejectionItems}
                  </Alert>
                )}
                {/* --- Hiển thị Preview ảnh --- */}
                {preview && (
                  <div className="mt-3 text-center">
                    <p className="mb-2">Xem trước ảnh:</p>
                    <Image src={preview} fluid thumbnail style={{ maxHeight: '200px', objectFit: 'contain' }} />
                  </div>
                )}
              </Card.Body>
            </Card>
            
            <Card className="mb-3">
              <Card.Header as="h5">Tồn kho ban đầu (*)</Card.Header>
              <Card.Body>
                <Form.Group controlId="quantity">
                  <Form.Label>Số lượng (tại kho chính)</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="100" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required 
                  />
                  <Form.Text className="text-muted">
                    (Sẽ gán vào cửa hàng đầu tiên tìm thấy)
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Nút Submit */}
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="mt-3 text-end">
          <Button 
            variant="dark" 
            type="submit" 
            disabled={loading}
          >
            {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Tạo Sản phẩm'}
          </Button>
        </div>
      </form>
    </>
  );
}

export default ProductCreatePage;