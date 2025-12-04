import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Spinner, Button } from 'react-bootstrap';
import { CheckCircleFill, XCircleFill } from 'react-bootstrap-icons';
import api from '../../api';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, failed

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy toàn bộ query params từ URL (vnp_Amount, vnp_ResponseCode...)
        const params = Object.fromEntries([...searchParams]);

        // Gọi Backend để check checksum và update DB
        const { data } = await api.get('/payment/vnpay_return', { params });

        if (data.code === '00') {
          setStatus('success');
        } else {
          setStatus('failed');
        }
      } catch (error) {
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card className="p-5 shadow text-center" style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body>
          {status === 'loading' && (
            <>
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h4>Đang xác thực giao dịch...</h4>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleFill className="text-success mb-3" size={60} />
              <h3 className="text-success mb-3">Thanh toán thành công!</h3>
              <p className="text-muted">Đơn hàng của bạn đã được thanh toán và đang chờ xử lý.</p>
              <Button as={Link} to="/my-orders" variant="dark" className="mt-3">
                Xem đơn hàng của tôi
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircleFill className="text-danger mb-3" size={60} />
              <h3 className="text-danger mb-3">Thanh toán thất bại</h3>
              <p className="text-muted">Có lỗi xảy ra hoặc bạn đã hủy giao dịch. Đơn hàng vẫn được lưu ở trạng thái "Chưa thanh toán".</p>
              <Button as={Link} to="/" variant="outline-dark" className="mt-3">
                Về trang chủ
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}