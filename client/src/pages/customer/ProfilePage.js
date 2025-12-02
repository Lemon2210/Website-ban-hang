import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // Gọi API cập nhật
      const { data } = await api.put('/auth/profile', { name, password }, config);
      
      // Cập nhật lại localStorage để hiển thị tên mới ngay lập tức
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      toast.success('Cập nhật thông tin thành công!');
      setLoading(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật.');
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '600px' }}>
        <Card.Header><h4>Thông tin Tài khoản</h4></Card.Header>
        <Card.Body>
          <Form onSubmit={submitHandler}>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Họ tên</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Nhập họ tên" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="Nhập email" 
                value={email} 
                disabled // Không cho sửa email
              />
              <Form.Text className="text-muted">Bạn không thể thay đổi email.</Form.Text>
            </Form.Group>

            <hr />
            <h6 className="mb-3">Đổi mật khẩu (Bỏ trống nếu không đổi)</h6>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Mật khẩu mới</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Nhập mật khẩu mới" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Xác nhận mật khẩu</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Nhập lại mật khẩu mới" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </Form.Group>

            <Button variant="dark" type="submit" className="w-100" disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Cập nhật'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}