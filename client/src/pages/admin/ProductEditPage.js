import React, { useState, useCallback, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col, Image, Spinner, Table, Modal } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { CloudUpload } from 'react-bootstrap-icons';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

// --- HẰNG SỐ ---
const AVAILABLE_COLORS = [
  { name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#000080" }, { name: "Red", hex: "#FF0000" },
  { name: "Green", hex: "#008000" }, { name: "Gray", hex: "#808080" },
  { name: "Beige", hex: "#F5F5DC" }
];
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// --- UPLOAD ẢNH (GIỮ NGUYÊN) ---
const ColorImageUpload = ({ colorName, currentPreview, onImageSelect }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.[0]) onImageSelect(colorName, acceptedFiles[0]);
  }, [colorName, onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  return (
    <div className="mb-3 border-bottom pb-3">
      <Form.Label className="fw-bold text-sm">Ảnh cho màu: {colorName} (*)</Form.Label>
      <div className="d-flex gap-3 align-items-start">
        <div {...getRootProps()} className={`flex-grow-1 p-3 text-center border border-2 border-dashed rounded ${isDragActive ? 'border-primary bg-light' : 'border-secondary'}`} style={{ cursor: 'pointer', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <input {...getInputProps()} />
          <CloudUpload size={24} className="text-muted mb-1" />
          <p className="text-muted small mb-0">{isDragActive ? 'Thả ảnh vào đây' : 'Kéo thả để đổi ảnh'}</p>
        </div>
        <div className="border rounded d-flex align-items-center justify-content-center bg-light" style={{width: '100px', height: '100px', overflow: 'hidden', flexShrink: 0}}>
          {currentPreview ? <Image src={currentPreview} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span className="text-muted small">Chưa có ảnh</span>}
        </div>
      </div>
    </div>
  );
};

function ProductEditPage() {
  const { id: productId } = useParams(); 
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- State Form ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState('Men');
  const [basePrice, setBasePrice] = useState(''); 
  const [baseSku, setBaseSku] = useState(''); 

  // --- STATE DANH MỤC 3 CẤP (ĐÃ SỬA) ---
  const [categories, setCategories] = useState([]); // Tất cả danh mục từ API
  const [mainCategory, setMainCategory] = useState(''); // ID Cấp 1
  const [subCategory, setSubCategory] = useState('');   // ID Cấp 2
  const [brandCategory, setBrandCategory] = useState(''); // ID Cấp 3

  // --- State Biến thể ---
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [generatedVariants, setGeneratedVariants] = useState([]);

  // --- State Ảnh ---
  const [colorImages, setColorImages] = useState({}); 
  const [colorPreviews, setColorPreviews] = useState({});

  // --- State Hệ thống ---
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- 1. TẢI DANH MỤC TỪ API ---
  useEffect(() => {
    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (err) {
            console.error("Lỗi tải danh mục", err);
        }
    };
    fetchCategories();
  }, []);

  // --- 2. LỌC DANH MỤC ---
  const parentCategories = categories.filter(c => !c.parent);
  const childCategories = categories.filter(c => c.parent && c.parent._id === mainCategory);
  const brandCategories = categories.filter(c => c.parent && c.parent._id === subCategory);

  // --- 3. LOAD DỮ LIỆU SẢN PHẨM ---
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const { data } = await api.get(`/products/${productId}`);
        const { product, variants } = data;

        setName(product.name);
        setDescription(product.description);
        setGender(product.gender);
        
        // Load Danh mục (Lấy ID)
        // Giả sử API trả về object populate, ta lấy ._id
        // Nếu API trả về ID string thì lấy luôn
        setMainCategory(product.category?._id || product.category || '');
        setSubCategory(product.subCategory?._id || product.subCategory || '');
        setBrandCategory(product.brand?._id || product.brand || '');
        
        // Load Màu & Size
        const existingColors = [...new Set(variants.map(v => v.attributes.color))];
        const existingSizes = [...new Set(variants.map(v => v.attributes.size))];
        
        setSelectedColors(existingColors);
        setSelectedSizes(existingSizes);

        // Load Biến thể
        const loadedVariants = [];
        const loadedPreviews = {};

        variants.forEach(v => {
          loadedVariants.push({
            color: v.attributes.color,
            size: v.attributes.size,
            price: v.price,
            sku: v.sku,
            quantity: v.stock[0]?.quantity || 0,
            imageUrl: v.imageUrl 
          });

          if (!loadedPreviews[v.attributes.color]) {
            loadedPreviews[v.attributes.color] = v.imageUrl;
          }
        });

        setGeneratedVariants(loadedVariants);
        setColorPreviews(loadedPreviews);
        
        if (variants.length > 0) {
          setBasePrice(variants[0].price);
          // Tách SKU gốc từ SKU biến thể đầu tiên (VD: POLO-BLK-S -> POLO)
          const firstSku = variants[0].sku || '';
          const parts = firstSku.split('-');
          if (parts.length >= 3) {
              setBaseSku(parts.slice(0, parts.length - 2).join('-'));
          } else {
              setBaseSku(firstSku);
          }
        }

        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin sản phẩm.');
        setLoading(false);
      }
    };
    if (categories.length > 0) { // Chỉ load sản phẩm khi đã có danh mục để map ID
        fetchProductData();
    }
  }, [productId, categories.length]); // Phụ thuộc vào categories.length để đảm bảo danh mục load xong mới load sản phẩm

  // --- LOGIC CHỈNH SỬA BIẾN THỂ (GIỮ NGUYÊN) ---
  const toggleColor = (colorName) => {
    const newColors = selectedColors.includes(colorName) 
        ? selectedColors.filter(c => c !== colorName) 
        : [...selectedColors, colorName];
    
    setSelectedColors(newColors);
    regenerateVariants(newColors, selectedSizes);
  };

  const toggleSize = (sizeName) => {
    const newSizes = selectedSizes.includes(sizeName) 
        ? selectedSizes.filter(s => s !== sizeName) 
        : [...selectedSizes, sizeName];
    
    setSelectedSizes(newSizes);
    regenerateVariants(selectedColors, newSizes);
  };

  const regenerateVariants = (colors, sizes) => {
    const newVariants = [];
    colors.forEach(color => {
      sizes.forEach(size => {
        const existing = generatedVariants.find(v => v.color === color && v.size === size);
        if (existing) {
          newVariants.push(existing);
        } else {
          const autoSku = baseSku ? `${baseSku}-${color.toUpperCase()}-${size}` : '';
          newVariants.push({
            color, size,
            price: basePrice || 0,
            sku: autoSku,
            quantity: 0,
            imageUrl: colorPreviews[color] || ''
          });
        }
      });
    });
    setGeneratedVariants(newVariants);
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...generatedVariants];
    updated[index][field] = value;
    setGeneratedVariants(updated);
  };

  const handleImageSelect = (color, file) => {
    setColorImages(prev => ({ ...prev, [color]: file }));
    setColorPreviews(prev => ({ ...prev, [color]: URL.createObjectURL(file) }));
  };

  // --- XỬ LÝ NÚT LƯU ---
  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!mainCategory) {
        setError('Vui lòng chọn danh mục chính');
        return;
    }
    if (generatedVariants.length === 0) {
        setError('Vui lòng chọn ít nhất 1 biến thể.');
        return;
    }
    setShowConfirmModal(true);
  };

  const confirmUpdate = async () => {
    setLoading(true);
    const formData = new FormData();
    
    formData.append('name', name);
    formData.append('description', description);
    formData.append('gender', gender);
    
    // --- GỬI ID DANH MỤC ---
    formData.append('category', mainCategory);
    if(subCategory) formData.append('subCategory', subCategory);
    if(brandCategory) formData.append('brand', brandCategory);
    // -----------------------

    formData.append('variants', JSON.stringify(generatedVariants));

    Object.keys(colorImages).forEach(color => {
      formData.append(`image_${color}`, colorImages[color]);
    });

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
      };
      await api.put(`/admin/products/${productId}`, formData, config);
      
      setShowConfirmModal(false);
      setLoading(false);
      alert('Cập nhật sản phẩm thành công!');
      navigate('/admin/products');
    } catch (err) {
      setLoading(false);
      setShowConfirmModal(false);
      setError(err.response?.data?.message || 'Lỗi cập nhật.');
    }
  };

  if (loading && !name) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Chỉnh sửa Sản phẩm</h2>
        <Button as={Link} to="/admin/products" variant="outline-dark">Quay lại</Button>
      </div>
      
      <Form onSubmit={handleSaveClick}>
        <Row>
          <Col lg={8}>
            <Card className="mb-4 shadow-sm">
              <Card.Header as="h5" className="bg-white py-3">1. Thông tin chung</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Tên Sản phẩm (*)</Form.Label>
                    <Form.Control type="text" required value={name} onChange={e => setName(e.target.value)} />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Giới tính (*)</Form.Label>
                  <div className="d-flex gap-3">
                    {['Men', 'Women', 'Unisex', 'Kids'].map(g => (
                        <Form.Check key={g} inline type="radio" label={g} name="gender" id={`g-${g}`} checked={gender === g} onChange={() => setGender(g)} />
                    ))}
                  </div>
                </Form.Group>

                {/* --- KHU VỰC DANH MỤC 3 CẤP (ĐÃ SỬA) --- */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Danh mục chính</Form.Label>
                            <Form.Select 
                                value={mainCategory} 
                                onChange={e => {
                                    setMainCategory(e.target.value);
                                    setSubCategory('');
                                    setBrandCategory('');
                                }}
                            >
                                <option value="">-- Chọn loại --</option>
                                {parentCategories.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Danh mục phụ</Form.Label>
                            <Form.Select 
                                value={subCategory} 
                                onChange={e => {
                                    setSubCategory(e.target.value);
                                    setBrandCategory('');
                                }}
                                disabled={!mainCategory}
                            >
                                <option value="">-- Chọn chi tiết --</option>
                                {childCategories.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    {/* Hiển thị Brand khi đã chọn cấp 2 và có brand con */}
                    {subCategory && brandCategories.length > 0 && (
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Thương hiệu</Form.Label>
                                <Form.Select 
                                    value={brandCategory} 
                                    onChange={e => setBrandCategory(e.target.value)}
                                >
                                    <option value="">-- Chọn Brand --</option>
                                    {brandCategories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    )}
                </Row>
                {/* ------------------------------------- */}

                <Form.Group className="mb-3"><Form.Label>Mô tả</Form.Label><Form.Control as="textarea" rows={4} value={description} onChange={e => setDescription(e.target.value)} /></Form.Group>
                
                {/* Thêm ô nhập giá gốc để sửa nhanh */}
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Giá bán chung (VND)</Form.Label>
                            <Form.Control type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Mã SKU gốc</Form.Label>
                            <Form.Control type="text" value={baseSku} onChange={e => setBaseSku(e.target.value)} />
                        </Form.Group>
                    </Col>
                </Row>

              </Card.Body>
            </Card>

            {/* 2. Biến thể (Màu & Size) */}
            <Card className="mb-4 shadow-sm">
              <Card.Header as="h5" className="bg-white py-3">2. Biến thể (Màu & Size)</Card.Header>
              <Card.Body>
                  <div className="mb-3">
                    <Form.Label className="fw-bold">Size:</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                        {AVAILABLE_SIZES.map(size => (
                            <Form.Check key={size} inline label={size} type="checkbox" id={`s-${size}`} checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} />
                        ))}
                    </div>
                </div>
                <div className="mb-3">
                    <Form.Label className="fw-bold">Màu:</Form.Label>
                    <div className="d-flex flex-wrap gap-3">
                        {AVAILABLE_COLORS.map(c => (
                            <Form.Check key={c.name} inline type="checkbox" id={`c-${c.name}`} checked={selectedColors.includes(c.name)} onChange={() => toggleColor(c.name)} label={c.name} />
                        ))}
                    </div>
                </div>
              </Card.Body>
            </Card>

            {/* 3. Bảng Chi tiết */}
            <Card className="mb-4 shadow-sm border-primary">
                <Card.Header as="h5" className="bg-primary text-white py-3">3. Chi tiết Tồn kho & Giá</Card.Header>
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 text-center align-middle">
                        <thead className="bg-light"><tr><th>Biến thể</th><th>SKU</th><th>Giá</th><th>Số lượng</th></tr></thead>
                        <tbody>
                            {generatedVariants.map((v, index) => (
                                <tr key={index}>
                                    <td className="fw-bold">{v.color} / {v.size}</td>
                                    <td><Form.Control size="sm" value={v.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} /></td>
                                    <td><Form.Control size="sm" type="number" value={v.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} /></td>
                                    <td><Form.Control size="sm" type="number" value={v.quantity} onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
             <Card className="mb-3 shadow-sm sticky-top" style={{top: '20px', zIndex: 100}}>
              <Card.Header as="h5" className="bg-white py-3">4. Ảnh sản phẩm</Card.Header>
              <Card.Body>
                {selectedColors.map(color => (
                    <ColorImageUpload key={color} colorName={color} currentPreview={colorPreviews[color]} onImageSelect={handleImageSelect} />
                ))}
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                <hr className="my-4" />
                <Button variant="primary" type="submit" size="lg" className="w-100 py-3 fw-bold" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'LƯU THAY ĐỔI'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* --- MODAL XÁC NHẬN --- */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận cập nhật</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn lưu các thay đổi cho sản phẩm <strong>{name}</strong> không?
          <br/>
          <small className="text-danger">Lưu ý: Việc này sẽ cập nhật lại toàn bộ biến thể của sản phẩm.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={confirmUpdate}>
            Xác nhận Lưu
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ProductEditPage;