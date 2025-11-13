import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Alert, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export function LoginPage() {
  const [key, setKey] = useState('login'); // State cho Tab
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState(null); 
  const [emailError, setEmailError] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // (useEffect cho Real-time Validation giữ nguyên)
  useEffect(() => {
    if (key === 'register' && email.length > 3) {
      setEmailError(null); 
      const debouncer = setTimeout(async () => {
        try {
          const { data } = await api.post('/auth/check-email', { email });
          if (data.exists) {
            setEmailError('Email đã tồn tại');
          } else {
            setEmailError(null);
          }
        } catch (err) {
          setEmailError(null);
        }
      }, 500); 
      return () => clearTimeout(debouncer);
    } else {
      setEmailError(null);
    }
  }, [email, key]); 


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Hàm Đăng nhập (Giữ nguyên)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const result = await login(email, password);
    
    setLoading(false);
    if (!result.success) {
      setError(result.message); 
      setEmail('');
      setPassword('');
    } else {
      navigate('/'); 
    }
  };

  // --- HÀM ĐĂNG KÝ (ĐÃ CẬP NHẬT THEO YÊU CẦU CỦA BẠN) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return; 
    }
    
    if (emailError) {
      setError('Email đã tồn tại. Vui lòng chọn email khác.');
      return;
    }

    setError(null);
    setLoading(true);

    const result = await register(name, email, password);
    setLoading(false);

    if (!result.success) {
      // Đăng ký thất bại
      setError(result.message);
      setPassword('');
      setConfirmPassword('');
    } else {
      // --- ĐĂNG KÝ THÀNH CÔNG ---
      
      // 1. (Tùy chọn) Thông báo cho người dùng
      alert('Đăng ký thành công! Vui lòng đăng nhập.');

      // 2. Dọn dẹp các ô
      setName('');
      setPassword('');
      setConfirmPassword('');
      // (Chúng ta giữ lại email để người dùng tiện đăng nhập)
      
      // 3. TỰ ĐỘNG CHUYỂN SANG TAB ĐĂNG NHẬP
      setKey('login');
    }
  };
  // --- HẾT HÀM ĐĂNG KÝ ---

  return (
    <Container className="my-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={6} lg={4}>
          <Tabs
            id="login-register-tabs"
            activeKey={key}
            onSelect={(k) => { setKey(k); setError(null); setEmailError(null); }}
            className="mb-3"
            justify
          >
            {/* === Tab Đăng Nhập === */}
            <Tab eventKey="login" title="Đăng nhập">
              <Card>
                <Card.Body>
                  {error && key === 'login' && <Alert variant="danger">{error}</Alert>}
                  <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-3" controlId="email-login">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="email@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="password-login">
                      <Form.Label>Mật khẩu</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mật khẩu của bạn" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button variant="outline-secondary" onClick={togglePasswordVisibility}>
                          {showPassword ? <EyeSlash /> : <Eye />}
                        </Button>
                      </InputGroup>
                    </Form.Group>
                    <Button 
                      variant="dark" 
                      type="submit" 
                      className="w-100"
                      disabled={loading}
                    >
                      {loading && key === 'login' ? 'Đang xử lý...' : 'Đăng nhập'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            {/* === Tab Đăng Ký === */}
            <Tab eventKey="register" title="Đăng ký">
              <Card>
                <Card.Body>
                  {error && key === 'register' && <Alert variant="danger">{error}</Alert>}
                  <Form onSubmit={handleRegister}>
                    <Form.Group className="mb-3" controlId="name-register">
                      <Form.Label>Tên của bạn</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Tên của bạn"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="email-register">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        isInvalid={!!emailError} 
                      />
                      <Form.Control.Feedback type="invalid">
                        {emailError}
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="password-register">
                      <Form.Label>Mật khẩu</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mật khẩu của bạn"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button variant="outline-secondary" onClick={togglePasswordVisibility}>
                          {showPassword ? <EyeSlash /> : <Eye />}
                        </Button>
                      </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="confirm-password-register">
                      <Form.Label>Xác nhận mật khẩu</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Xác nhận lại mật khẩu"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <Button variant="outline-secondary" onClick={togglePasswordVisibility}>
                          {showPassword ? <EyeSlash /> : <Eye />}
                        </Button>
                      </InputGroup>
                    </Form.Group>
                    <Button 
                      variant="dark" 
                      type="submit" 
                      className="w-100"
                      disabled={loading || !!emailError}
                    >
                      {loading && key === 'register' ? 'Đang xử lý...' : 'Đăng ký'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
}