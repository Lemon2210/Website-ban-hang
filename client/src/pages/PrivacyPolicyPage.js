import React from 'react';
import { Container, Card } from 'react-bootstrap';

export default function PrivacyPolicyPage() {
  return (
    <Container className="py-5">
      <Card className="shadow-sm border-0">
        <Card.Body className="p-5">
          <h2 className="fw-bold mb-4 text-center text-uppercase">Chính sách bảo mật thông tin</h2>
          
          <p className="text-muted text-center mb-5">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>

          <div className="mb-4">
            <h5 className="fw-bold">1. Mục đích thu thập thông tin cá nhân</h5>
            <p>
              Lemon Fashion cam kết bảo mật thông tin của khách hàng. Chúng tôi chỉ thu thập thông tin cần thiết để:
            </p>
            <ul>
              <li>Xử lý đơn hàng và giao hàng đến địa chỉ của bạn.</li>
              <li>Thông báo về việc giao hàng và hỗ trợ khách hàng.</li>
              <li>Cung cấp thông tin liên quan đến sản phẩm (nếu bạn đăng ký nhận tin).</li>
              <li>Xử lý các yêu cầu đổi trả hoặc bảo hành.</li>
            </ul>
          </div>

          <div className="mb-4">
            <h5 className="fw-bold">2. Phạm vi sử dụng thông tin</h5>
            <p>Thông tin cá nhân thu thập được sẽ chỉ được sử dụng trong nội bộ công ty. Chúng tôi có thể chia sẻ tên và địa chỉ của bạn cho dịch vụ chuyển phát nhanh (như Giao Hàng Tiết Kiệm, Ahamove) để giao hàng cho bạn.</p>
          </div>

          <div className="mb-4">
            <h5 className="fw-bold">3. Thời gian lưu trữ thông tin</h5>
            <p>Thông tin của khách hàng sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ từ phía khách hàng. Còn lại trong mọi trường hợp thông tin cá nhân sẽ được bảo mật trên máy chủ của Lemon Fashion.</p>
          </div>

          <div className="mb-4">
            <h5 className="fw-bold">4. Cam kết bảo mật</h5>
            <p>
              Chúng tôi sử dụng các biện pháp kỹ thuật và an ninh để ngăn chặn truy cập trái phép hoặc trái pháp luật. Tuy nhiên, chúng tôi khuyến cáo bạn không nên đưa thông tin chi tiết về việc thanh toán với bất kỳ ai bằng e-mail, chúng tôi không chịu trách nhiệm về những mất mát có thể xảy ra trong việc trao đổi thông tin của bạn qua internet hoặc e-mail.
            </p>
          </div>

          <div className="mt-5 text-center fst-italic text-muted">
            <small>Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ hotline: 1900 xxxx</small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}