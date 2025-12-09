import React, { useState, useCallback, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col, Image, Spinner, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { CloudUpload } from 'react-bootstrap-icons';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

// --- CÁC HẰNG SỐ ---
const AVAILABLE_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#000080" },
  { name: "Red", hex: "#FF0000" },
  { name: "Green", hex: "#008000" },
  { name: "Gray", hex: "#808080" },
  { name: "Beige", hex: "#F5F5DC" }
];

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// --- COMPONENT UPLOAD ẢNH ---
const ColorImageUpload = ({ colorName, currentPreview, onImageSelect }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.[0]) {
      onImageSelect(colorName, acceptedFiles[0]);
    }
  }, [colorName, onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <div className="mb-3 border-bottom pb-3">
      <Form.Label className="fw-bold text-sm">Ảnh cho màu: {colorName} (*)</Form.Label>
      <div className="d-flex gap-3 align-items-start">
        <div 
          {...getRootProps()} 
          className={`flex-grow-1 p-3 text-center border border-2 border-dashed rounded position-relative ${isDragActive ? 'border-primary bg-light' : 'border-secondary'}`}
          style={{ cursor: 'pointer', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
        >
          <input {...getInputProps()} />
          <CloudUpload size={24} className="text-muted mb-1" />
          <p className="text-muted small mb-0">{isDragActive ? 'Thả ảnh vào đây' : 'Kéo thả hoặc click'}</p>
        </div>
        <div 
            className="border rounded d-flex align-items-center justify-content-center bg-light"
            style={{width: '100px', height: '100px', overflow: 'hidden', flexShrink: 0}}
        >
            {currentPreview ? (
                <Image src={currentPreview} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            ) : (
                <span className="text-muted small">Chưa có ảnh</span>
            )}
        </div>
      </div>
    </div>
  );
};

function ProductCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- State 1: Thông tin chung ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState('Men');
  const [basePrice, setBasePrice] = useState(''); 
  const [baseSku, setBaseSku] = useState('');
  
  // --- STATE DANH MỤC 3 CẤP ---
  const [categories, setCategories] = useState([]); // Tất cả danh mục
  const [mainCategory, setMainCategory] = useState(''); // Cấp 1: Chính (VD: Áo)
  const [subCategory, setSubCategory] = useState('');   // Cấp 2: Phụ (VD: Áo Polo)
  const [brandCategory, setBrandCategory] = useState(''); // Cấp 3: Brand (VD: Nike)

  const [skuError, setSkuError] = useState(null); 

  // --- State Biến thể & Ảnh ---
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [generatedVariants, setGeneratedVariants] = useState([]);
  const [colorImages, setColorImages] = useState({}); 
  const [colorPreviews, setColorPreviews] = useState({});

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- 1. LẤY DANH SÁCH DANH MỤC ---
  useEffect(() => {
    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories'); 
            setCategories(data);
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
        }
    };
    fetchCategories();
  }, []);

  // --- LOGIC LỌC DANH MỤC ĐA CẤP ---
  // Cấp 1: Cha = null
  const parentCategories = categories.filter(c => !c.parent);
  
  // Cấp 2: Cha = mainCategory
  const childCategories = categories.filter(c => c.parent && c.parent._id === mainCategory);

  // Cấp 3: Cha = subCategory (Brand)
  const brandCategories = categories.filter(c => c.parent && c.parent._id === subCategory);


  // --- LOGIC CHECK SKU ---
  useEffect(() => {
    if (baseSku.length > 2) {
      setSkuError(null);
      const debouncer = setTimeout(async () => {
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const { data } = await api.post('/admin/products/check-sku', { sku: baseSku }, config);
          if (data.exists) {
            setSkuError('Mã SKU này (hoặc biến thể của nó) đã tồn tại!');
          } else {
            setSkuError(null);
          }
        } catch (err) {
          console.error("Lỗi check SKU", err);
        }
      }, 500);
      return () => clearTimeout(debouncer);
    } else {
      setSkuError(null);
    }
  }, [baseSku, user.token]);

  // --- LOGIC: Tự động sinh biến thể ---
  useEffect(() => {
    const newVariants = [];
    if (selectedColors.length > 0 && selectedSizes.length > 0) {
      selectedColors.forEach(color => {
        selectedSizes.forEach(size => {
          const autoSku = baseSku ? `${baseSku}-${color.toUpperCase()}-${size}` : '';
          const existing = generatedVariants.find(v => v.color === color && v.size === size);
          newVariants.push({
            color: color,
            size: size,
            price: existing ? existing.price : basePrice, 
            sku: existing ? existing.sku : autoSku,       
            quantity: existing ? existing.quantity : 0 
          });
        });
      });
    }
    setGeneratedVariants(newVariants);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColors, selectedSizes, basePrice, baseSku]); 

  // --- Các hàm xử lý sự kiện ---
  const toggleColor = (colorName) => {
    setSelectedColors(prev => {
      const isSelected = prev.includes(colorName);
      if (isSelected) {
        const newColors = prev.filter(c => c !== colorName);
        const newImages = { ...colorImages };
        delete newImages[colorName];
        setColorImages(newImages);
        const newPreviews = { ...colorPreviews };
        delete newPreviews[colorName];
        setColorPreviews(newPreviews);
        return newColors;
      } else {
        return [...prev, colorName];
      }
    });
  };

  const toggleSize = (sizeName) => {
    setSelectedSizes(prev => 
      prev.includes(sizeName) ? prev.filter(s => s !== sizeName) : [...prev, sizeName]
    );
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...generatedVariants];
    updatedVariants[index][field] = value;
    setGeneratedVariants(updatedVariants);
  };

  const handleImageSelect = (color, file) => {
    setColorImages(prev => ({ ...prev, [color]: file }));
    setColorPreviews(prev => ({ ...prev, [color]: URL.createObjectURL(file) }));
  };

  // --- Submit ---
  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    if (!mainCategory) {
        setError('Vui lòng chọn danh mục chính.');
        setLoading(false);
        return;
    }
    if (skuError) {
        setError('Vui lòng sửa mã SKU bị trùng trước khi lưu.');
        setLoading(false);
        return;
    }
    if (selectedColors.length === 0 || selectedSizes.length === 0) {
        setError('Vui lòng chọn ít nhất 1 màu và 1 size.');
        setLoading(false);
        return;
    }
    const missingImages = selectedColors.filter(color => !colorImages[color]);
    if (missingImages.length > 0) {
      setError(`Vui lòng chọn ảnh cho màu: ${missingImages.join(', ')}`);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('gender', gender);
    
    // --- GỬI DANH MỤC ---
    formData.append('category', mainCategory); // Cấp 1
    if (subCategory) formData.append('subCategory', subCategory); // Cấp 2
    if (brandCategory) formData.append('brand', brandCategory); // Cấp 3 (Brand)
    // --------------------

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
      await api.post('/admin/products', formData, config);
      setLoading(false);
      alert('Tạo sản phẩm thành công!');
      navigate('/admin/products');
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || 'Đã có lỗi xảy ra từ server.';
      setError(message);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Thêm Sản phẩm Mới</h2>
        <Button as={Link} to="/admin/products" variant="outline-dark">Quay lại</Button>
      </div>
      
      <Form onSubmit={submitHandler}>
        <Row>
          <Col lg={8}>
            <Card className="mb-4 shadow-sm">
              <Card.Header as="h5" className="bg-white py-3">1. Thông tin chung</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Tên Sản phẩm (*)</Form.Label>
                  <Form.Control type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Áo Polo Coolmate" />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Giới tính (*)</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check type="radio" label="Nam (Men)" name="gender" id="genderMen" checked={gender === 'Men'} onChange={() => setGender('Men')} />
                    <Form.Check type="radio" label="Nữ (Women)" name="gender" id="genderWomen" checked={gender === 'Women'} onChange={() => setGender('Women')} />
                    <Form.Check type="radio" label="Unisex" name="gender" id="genderUnisex" checked={gender === 'Unisex'} onChange={() => setGender('Unisex')} />
                  </div>
                </Form.Group>

                {/* --- KHU VỰC CHỌN DANH MỤC 3 CẤP --- */}
                <Row>
                  {/* CẤP 1: DANH MỤC CHÍNH */}
                  <Col md={4}>
                    <Form.Group className="mb-3">
                        <Form.Label>Danh mục chính (*)</Form.Label>
                        <Form.Select 
                            value={mainCategory} 
                            onChange={e => {
                                setMainCategory(e.target.value);
                                setSubCategory(''); // Reset cấp 2
                                setBrandCategory(''); // Reset cấp 3
                            }}
                            required
                        >
                            <option value="">-- Chọn loại --</option>
                            {parentCategories.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* CẤP 2: DANH MỤC PHỤ */}
                  <Col md={4}>
                    <Form.Group className="mb-3">
                        <Form.Label>Danh mục phụ</Form.Label>
                        <Form.Select 
                            value={subCategory} 
                            onChange={e => {
                                setSubCategory(e.target.value);
                                setBrandCategory(''); // Reset cấp 3
                            }}
                            disabled={!mainCategory}
                        >
                            <option value="">-- Chọn chi tiết --</option>
                            {childCategories.length > 0 ? (
                                childCategories.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))
                            ) : (
                                <option disabled>Không có danh mục con</option>
                            )}
                        </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* CẤP 3: BRAND (ẨN NẾU CHƯA CHỌN CẤP 2 HOẶC CẤP 2 KHÔNG CÓ CON) */}
                  {subCategory && brandCategories.length > 0 && (
                      <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-primary fw-bold">Thương hiệu / Brand</Form.Label>
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

                <Form.Group className="mb-3">
                  <Form.Label>Mô tả chi tiết</Form.Label>
                  <Form.Control as="textarea" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
                </Form.Group>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Giá bán chung (VND)</Form.Label>
                            <Form.Control type="number" required value={basePrice} onChange={e => setBasePrice(e.target.value)} />
                        </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Mã SKU gốc (Prefix)</Form.Label>
                            <Form.Control 
                                type="text" 
                                required 
                                value={baseSku} 
                                onChange={e => setBaseSku(e.target.value)} 
                                placeholder="VD: POLO-01" 
                                isInvalid={!!skuError} 
                            />
                            <Form.Control.Feedback type="invalid">
                                {skuError}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* ... PHẦN CHỌN MÀU/SIZE & BẢNG BIẾN THỂ (GIỮ NGUYÊN) ... */}
            <Card className="mb-4 shadow-sm">
              <Card.Header as="h5" className="bg-white py-3">2. Chọn Màu & Size</Card.Header>
              <Card.Body>
                <div className="mb-4">
                    <Form.Label className="fw-bold d-block mb-2">Chọn các Size có sẵn:</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                        {AVAILABLE_SIZES.map(size => (
                            <div key={size} className="position-relative">
                                <input type="checkbox" className="btn-check" id={`btn-check-size-${size}`} autoComplete="off" checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} />
                                <label className="btn btn-outline-secondary" htmlFor={`btn-check-size-${size}`}>{size}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <hr className="my-4"/>
                <div className="mb-2">
                    <Form.Label className="fw-bold d-block mb-2">Chọn các Màu có sẵn:</Form.Label>
                    <div className="d-flex flex-wrap gap-3">
                        {AVAILABLE_COLORS.map(c => (
                            <Form.Check key={c.name} inline type="checkbox" id={`color-${c.name}`} checked={selectedColors.includes(c.name)} onChange={() => toggleColor(c.name)}
                                label={<span className="d-flex align-items-center"><span className="rounded-circle border me-2" style={{width: 20, height: 20, backgroundColor: c.hex}}></span>{c.name}</span>}
                            />
                        ))}
                    </div>
                </div>
              </Card.Body>
            </Card>

            {generatedVariants.length > 0 && (
                <Card className="mb-4 shadow-sm border-primary">
                    <Card.Header as="h5" className="bg-primary text-white py-3">3. Chi tiết Tồn kho & Giá</Card.Header>
                    <Card.Body className="p-0">
                        <Table responsive hover className="mb-0 text-center align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="py-3">Biến thể</th>
                                    <th style={{width: '25%'}}>SKU (Tự động)</th>
                                    <th style={{width: '25%'}}>Giá (VND)</th>
                                    <th style={{width: '20%'}}>Số lượng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {generatedVariants.map((v, index) => (
                                    <tr key={`${v.color}-${v.size}`}>
                                        <td className="fw-bold text-start ps-4">{v.color} / {v.size}</td>
                                        <td><Form.Control size="sm" type="text" value={v.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} /></td>
                                        <td><Form.Control size="sm" type="number" value={v.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} /></td>
                                        <td><Form.Control size="sm" type="number" value={v.quantity} onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)} className={v.quantity > 0 ? '' : 'border-danger'} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}
          </Col>
          
          <Col lg={4}>
             <Card className="mb-3 shadow-sm sticky-top" style={{top: '20px', zIndex: 100}}>
              <Card.Header as="h5" className="bg-white py-3">4. Ảnh sản phẩm (*)</Card.Header>
              <Card.Body>
                <p className="text-muted small mb-3">Vui lòng chọn 1 ảnh đại diện cho mỗi màu bạn đã chọn.</p>
                {selectedColors.length === 0 ? (
                    <Alert variant="light" className="text-center text-muted border-dashed">Chưa chọn màu nào.</Alert>
                ) : (
                    selectedColors.map(color => (
                        <ColorImageUpload key={color} colorName={color} currentPreview={colorPreviews[color]} onImageSelect={handleImageSelect} />
                    ))
                )}
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                <hr className="my-4" />
                <Button variant="dark" type="submit" size="lg" className="w-100 py-3 fw-bold" disabled={loading || !!skuError}>
                    {loading ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Đang xử lý...</> : 'LƯU SẢN PHẨM'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </>
  );
}

export default ProductCreatePage;