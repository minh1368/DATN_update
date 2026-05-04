import { useState } from "react";
import "./App.css";

function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-icon">PDC</span>
            <div className="logo-text">
              <p className="logo-main">Dịch vụ cho thuê xe linh hoạt</p>
            </div>
          </div>

          <nav className="nav">
            <button className="nav-item">Dịch vụ ▼</button>
            <button className="nav-item">Mua xe cũ chính hãng</button>
            <button className="nav-item">HRV</button>
            <button className="nav-item">Giới thiệu</button>
            <button className="nav-item">Tin tức</button>
          </nav>

          <button className="login-btn">Đăng nhập</button>
        </div>
      </header>

      {/* HERO SECTION - FULL VIEWPORT */}
      <section className="hero" style={{backgroundImage: "url('https://otohondaconghoa.net/wp-content/uploads/2018/01/z6493854182270_16484f33d6f8a8b474c1f6e1ff93fc19.jpg')"}}>
        <div className="hero-content">
          <h1 className="hero-title">Đáp ứng mọi nhu cầu thuê xe</h1>
          <p className="hero-subtitle">Cung cấp dịch vụ thuê xe tự lái và có tài xế, phục vụ mọi nhu cầu di chuyển của bạn</p>
          <button className="cta-button">Thuê xe tự lái</button>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="services">
        <div className="services-container">
          <h2 className="section-title">Dịch vụ của chúng tôi</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">🚗</div>
              <h3>Thuê xe tự lái</h3>
              <p>Đa dạng loại xe, giá cả phải chăng, hỗ trợ 24/7</p>
            </div>
            <div className="service-card">
              <div className="service-icon">👨‍💼</div>
              <h3>Thuê xe có tài xế</h3>
              <p>Tài xế chuyên nghiệp, an toàn và thoải mái</p>
            </div>
            <div className="service-card">
              <div className="service-icon">💳</div>
              <h3>Thanh toán linh hoạt</h3>
              <p>Nhiều hình thức thanh toán, không giữ giấy tờ</p>
            </div>
            <div className="service-card">
              <div className="service-icon">⚡</div>
              <h3>Xe điện hiện đại</h3>
              <p>Công nghệ tiên tiến, thân thiện với môi trường</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className="why-choose">
        <div className="why-choose-container">
          <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
          <div className="why-choose-grid">
            <div className="why-item">
              <h3>✓ Giá cả cạnh tranh</h3>
              <p>Cung cấp giá tốt nhất trên thị trường</p>
            </div>
            <div className="why-item">
              <h3>✓ Hỗ trợ 24/7</h3>
              <p>Đội ngũ hỗ trợ luôn sẵn sàng</p>
            </div>
            <div className="why-item">
              <h3>✓ Xe mới chất lượng</h3>
              <p>Bảo trì định kỳ, an toàn và hiện đại</p>
            </div>
            <div className="why-item">
              <h3>✓ Quy trình nhanh</h3>
              <p>Thuê xe chỉ trong 5 phút</p>
            </div>
          </div>
        </div>
      </section>

      {/* FLEET SECTION */}
      <section className="fleet">
        <div className="fleet-container">
          <h2 className="section-title">Các loại xe của chúng tôi</h2>
          <div className="fleet-grid">
            <div className="fleet-card">
              <div className="fleet-image">🚗</div>
              <h3>Xe Sedan</h3>
              <p>Từ 150.000 VND/ngày</p>
            </div>
            <div className="fleet-card">
              <div className="fleet-image">🚙</div>
              <h3>Xe SUV</h3>
              <p>Từ 250.000 VND/ngày</p>
            </div>
            <div className="fleet-card">
              <div className="fleet-image">🚐</div>
              <h3>Xe 7 chỗ</h3>
              <p>Từ 400.000 VND/ngày</p>
            </div>
            <div className="fleet-card">
              <div className="fleet-image">⚡</div>
              <h3>Xe Điện</h3>
              <p>Từ 300.000 VND/ngày</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials">
        <div className="testimonials-container">
          <h2 className="section-title">Cảm nhận từ khách hàng</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p>"Dịch vụ rất tuyệt vời, xe mới, giá hợp lý. Sẽ thuê lại!"</p>
              <h4>Nguyễn Văn A</h4>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
            <div className="testimonial-card">
              <p>"Tài xế chuyên nghiệp, xe sạch sẽ, thoải mái cho chuyến đi"</p>
              <h4>Trần Thị B</h4>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
            <div className="testimonial-card">
              <p>"Quá tuyệt vời, từ đặt lịch đến giao xe rất nhanh chóng"</p>
              <h4>Phạm Văn C</h4>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="contact">
        <div className="contact-container">
          <h2 className="section-title">Liên hệ với chúng tôi</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>📱 Điện thoại</h3>
                <p>0566 999 666</p>
              </div>
              <div className="contact-item">
                <h3>📧 Email</h3>
                <p>phuongdongcorp22@gmail.com</p>
              </div>
              <div className="contact-item">
                <h3>📍 Địa chỉ</h3>
                <p> Ô Chợ Dừa, Hà Nội</p>
              </div>
            </div>
            <form className="contact-form">
              <input type="text" placeholder="Họ tên" required />
              <input type="email" placeholder="Email" required />
              <textarea placeholder="Tin nhắn" rows="5" required></textarea>
              <button type="submit" className="cta-button">Gửi tin nhắn</button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2024 Phuong Dong Corporation. Tất cả quyền được bảo lưu.</p>
          <div className="social-links">
            <a href="#">Facebook</a>
            <a href="#">Twitter</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;