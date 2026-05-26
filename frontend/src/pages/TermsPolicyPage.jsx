import { Link } from "react-router-dom";
import AppFooter from "../components/AppFooter.jsx";

function TermsPolicyPage() {
  return (
    <div className="policy-page">
      <header className="policy-header">
        <div className="policy-header-inner">
          <Link to="/" className="gf-brand policy-brand">
            <span className="logo-icon"><img src="/image/brand/logo.png" alt="Phương Đông" /></span>
            <span className="gf-brand-text">Phương Đông</span>
          </Link>
          <nav className="policy-nav">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <strong>Điều khoản sử dụng</strong>
          </nav>
          <a className="login-btn" href="tel:0566999666">Hotline: 0566 999 666</a>
        </div>
      </header>

      <main className="policy-main">
        <section className="policy-hero">
          <p>Phương Đông Car Rental</p>
          <h1>Điều khoản sử dụng</h1>
          <span>Cập nhật lần cuối: 21/05/2026</span>
        </section>

        <section className="policy-content">
          <article>
            <h2>1. Phạm vi áp dụng</h2>
            <p>
              Các điều khoản này áp dụng cho việc truy cập website, tìm kiếm thông tin xe,
              gửi yêu cầu thuê xe và sử dụng các dịch vụ hỗ trợ trực tuyến của Công ty Cổ phần TĐ Phương Đông.
            </p>
          </article>

          <article>
            <h2>2. Thông tin tài khoản</h2>
            <p>
              Khách hàng cần cung cấp thông tin chính xác khi đăng ký, đặt xe hoặc gửi yêu cầu hỗ trợ.
              Người dùng tự chịu trách nhiệm bảo mật tài khoản và thông báo cho chúng tôi khi phát hiện
              việc sử dụng trái phép.
            </p>
          </article>

          <article>
            <h2>3. Đặt xe và xác nhận dịch vụ</h2>
            <p>
              Yêu cầu đặt xe trên website là bước ghi nhận nhu cầu thuê xe. Đơn đặt xe chỉ được xác nhận
              sau khi nhân viên liên hệ, kiểm tra tình trạng xe, thời gian thuê và các điều kiện liên quan.
            </p>
          </article>

          <article>
            <h2>4. Giá thuê và thanh toán</h2>
            <p>
              Giá thuê hiển thị trên website là giá tham khảo theo ngày và có thể thay đổi theo thời điểm,
              loại xe, thời gian thuê hoặc yêu cầu phát sinh. Phương thức thanh toán mặc định là thanh toán
              khi nhận xe, trừ khi hai bên có thỏa thuận khác.
            </p>
          </article>

          <article>
            <h2>5. Trách nhiệm của khách hàng</h2>
            <p>
              Khách hàng cần sử dụng xe đúng mục đích, tuân thủ quy định pháp luật, bảo quản tài sản thuê
              và cung cấp đầy đủ giấy tờ cần thiết khi làm thủ tục nhận xe.
            </p>
          </article>

          <article>
            <h2>6. Bảo mật thông tin</h2>
            <p>
              Chúng tôi thu thập và sử dụng thông tin khách hàng nhằm phục vụ đặt xe, chăm sóc khách hàng,
              quản lý hợp đồng và nâng cao chất lượng dịch vụ. Thông tin không được chia sẻ cho bên thứ ba
              nếu không có sự đồng ý của khách hàng, trừ trường hợp pháp luật yêu cầu.
            </p>
          </article>

          <article>
            <h2>7. Thay đổi điều khoản</h2>
            <p>
              Phương Đông có thể cập nhật điều khoản sử dụng theo nhu cầu vận hành hoặc quy định pháp luật.
              Phiên bản mới sẽ được công bố trên website và có hiệu lực từ thời điểm đăng tải.
            </p>
          </article>

          <article>
            <h2>8. Liên hệ</h2>
            <p>
              Nếu có câu hỏi về điều khoản sử dụng, vui lòng liên hệ hotline 0566 999 666 hoặc email
              phuongdongcorp22@gmail.com để được hỗ trợ.
            </p>
          </article>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}

export default TermsPolicyPage;
