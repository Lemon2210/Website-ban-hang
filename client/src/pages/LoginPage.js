import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Alert, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ReCAPTCHA from "react-google-recaptcha"; // <-- IMPORT RECAPTCHA

export function LoginPage() {
  const [key, setKey] = useState('login'); 
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState(null); 
  const [emailError, setEmailError] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  // --- STATE CHO CAPTCHA ---
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRefLogin = useRef(null);
  const captchaRefRegister = useRef(null);
  // ------------------------

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // --- Thay SITE KEY Của BẠN vào đây ---
  const SITE_KEY = "6LdU-hksAAAAALlHLeFR41LkcNCYo1FmqnVeyuFp"; 

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


  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onCaptchaChange = (token) => {
    setCaptchaToken(token); // Lưu token khi user click "I'm not a robot"
  };

  // --- XỬ LÝ LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!captchaToken) {
        setError('Vui lòng xác thực: Bạn không phải là người máy!');
        return;
    }

    setError(null);
    setLoading(true);
    
    // Gửi captchaToken kèm theo
    const result = await login(email, password, captchaToken);
    
    setLoading(false);
    if (!result.success) {
      setError(result.message); 
      setPassword('');
      // Reset Captcha khi lỗi để bắt user bấm lại
      if (captchaRefLogin.current) captchaRefLogin.current.reset();
      setCaptchaToken(null);
    } else {
      navigate('/'); 
    }
  };

  // --- XỬ LÝ REGISTER ---
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return; 
    }
    if (emailError) {
      setError('Email đã tồn tại.');
      return;
    }
    if (!captchaToken) {
        setError('Vui lòng xác thực: Bạn không phải là người máy!');
        return;
    }

    setError(null);
    setLoading(true);

    // Gửi captchaToken kèm theo
    const result = await register(name, email, password, captchaToken);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      setPassword('');
      setConfirmPassword('');
      // Reset Captcha
      if (captchaRefRegister.current) captchaRefRegister.current.reset();
      setCaptchaToken(null);
    } else {
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      setName('');
      setPassword('');
      setConfirmPassword('');
      setKey('login');
      setCaptchaToken(null); // Reset token
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={6} lg={4}>
          <Tabs
            id="login-register-tabs"
            activeKey={key}
            onSelect={(k) => { 
                setKey(k); 
                setError(null); 
                setEmailError(null); 
                setCaptchaToken(null); // Reset captcha khi chuyển tab
            }}
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

                    {/* --- CAPTCHA LOGIN --- */}
                    <div className="mb-3 d-flex justify-content-center">
                        <ReCAPTCHA
                            ref={captchaRefLogin}
                            sitekey={SITE_KEY}
                            onChange={onCaptchaChange}
                        />
                    </div>
                    
                    <Button variant="dark" type="submit" className="w-100" disabled={loading}>
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
                    {/* Các ô nhập liệu giữ nguyên */}
                    <Form.Group className="mb-3" controlId="name-register">
                      <Form.Label>Tên của bạn</Form.Label>
                      <Form.Control type="text" placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="email-register">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required isInvalid={!!emailError} />
                      <Form.Control.Feedback type="invalid">{emailError}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="password-register">
                      <Form.Label>Mật khẩu</Form.Label>
                      <InputGroup>
                        <Form.Control type={showPassword ? 'text' : 'password'} placeholder="Mật khẩu của bạn" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <Button variant="outline-secondary" onClick={togglePasswordVisibility}>{showPassword ? <EyeSlash /> : <Eye />}</Button>
                      </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="confirm-password-register">
                      <Form.Label>Xác nhận mật khẩu</Form.Label>
                      <InputGroup>
                        <Form.Control type={showPassword ? 'text' : 'password'} placeholder="Xác nhận lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        <Button variant="outline-secondary" onClick={togglePasswordVisibility}>{showPassword ? <EyeSlash /> : <Eye />}</Button>
                      </InputGroup>
                    </Form.Group>
                    
                    {/* --- CAPTCHA REGISTER --- */}
                    <div className="mb-3 d-flex justify-content-center">
                        <ReCAPTCHA
                            ref={captchaRefRegister}
                            sitekey={SITE_KEY}
                            onChange={onCaptchaChange}
                        />
                    </div>

                    <Button variant="dark" type="submit" className="w-100" disabled={loading || !!emailError}>
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