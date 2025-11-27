import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth(); // Lấy thông tin admin đang đăng nhập

  // 1. Hàm lấy danh sách user
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      };
      const { data } = await api.get('/admin/users', config);
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách tài khoản.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  // 2. Hàm đổi quyền (Phân quyền)
  const handleChangeRole = async (userId, newRole) => {
    if (userId === currentUser._id) {
      alert("Bạn không thể tự thay đổi quyền của chính mình!");
      // Reset lại select box (bằng cách fetch lại data)
      fetchUsers(); 
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn đổi quyền của user này thành "${newRole}"?`)) {
      fetchUsers(); // Reset nếu hủy
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      };
      
      await api.put(`/admin/users/${userId}/role`, { role: newRole }, config);
      
      alert('Cập nhật quyền thành công!');
      fetchUsers(); // Tải lại danh sách để cập nhật giao diện
    } catch (err) {
      alert('Lỗi khi cập nhật quyền.');
      console.error(err);
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h1 className="mb-4">Quản lý Tài khoản</h1>
      <Table striped bordered hover responsive className="align-middle">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Tên người dùng</th>
            <th>Email</th>
            <th>Vai trò hiện tại</th>
            <th>Phân quyền (Thay đổi)</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u._id.substring(0, 10)}...</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                {u.role === 'admin' ? (
                  <Badge bg="danger">Admin</Badge>
                ) : (
                  <Badge bg="primary">User</Badge>
                )}
              </td>
              <td>
                {/* Dropdown để chọn quyền */}
                <Form.Select 
                  size="sm" 
                  value={u.role} 
                  onChange={(e) => handleChangeRole(u._id, e.target.value)}
                  style={{ maxWidth: '150px' }}
                  disabled={u._id === currentUser._id} // Vô hiệu hóa nếu là chính mình
                >
                  <option value="user">User (Khách hàng)</option>
                  <option value="admin">Admin (Quản trị)</option>
                </Form.Select>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default UserListPage;