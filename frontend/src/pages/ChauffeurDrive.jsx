import { Link } from "react-router-dom";
import "../App.css";
import AppFooter from "../components/AppFooter.jsx";

const benefits = [
  {
    title: "Đúng giờ, ổn định",
    text: "Lịch trình đưa đón được thống nhất theo ca làm, điểm đón và tuyến đường thực tế của doanh nghiệp.",
  },
  {
    title: "Lái xe chuyên nghiệp",
    text: "Đội ngũ tài xế có kinh nghiệm phục vụ cán bộ, chuyên gia, khách công tác và các đoàn sự kiện.",
  },
  {
    title: "Tối ưu chi phí",
    text: "Thuê theo chuyến, theo tháng hoặc theo hợp đồng dài hạn giúp doanh nghiệp chủ động ngân sách vận hành.",
  },
  {
    title: "Xe đa dạng chỗ ngồi",
    text: "Từ sedan, MPV, limousine đến xe 16-45 chỗ, phù hợp nhóm nhỏ, tuyến nhân viên và đoàn đông.",
  },
];

const vehicleGroups = [
  "Xe 4-5 chỗ: sedan phục vụ lãnh đạo, chuyên gia, công tác nội thành.",
  "Xe 7 chỗ: phù hợp nhóm nhỏ, đón sân bay, đi tỉnh hoặc lịch trình linh hoạt.",
  "Xe 16 chỗ: đưa đón nhân viên theo tuyến, đoàn công tác, sự kiện doanh nghiệp.",
  "Xe 29-45 chỗ: phục vụ nhà máy, khu công nghiệp, hội nghị, du lịch công ty.",
];

export default function ChauffeurDrivePage() {
  return (
    <div className="gf-page chauffeur-page">
      <header className="gf-header">
        <div className="gf-header-inner">
          <Link to="/" className="gf-brand">
            <span className="logo-icon">PDC</span>
            <span className="gf-brand-text">Thuê xe</span>
          </Link>
          <nav className="gf-nav">
            <Link to="/" className="gf-nav-link">Trang chủ</Link>
            <span className="gf-nav-sep">/</span>
            <span className="gf-nav-current">Thuê xe có lái</span>
          </nav>
          <div className="gf-header-cta">
            <a className="login-btn" href="tel:0566999666">Hotline: 0566 999 666</a>
          </div>
        </div>
      </header>

      <section className="chauffeur-hero">
        <div className="chauffeur-hero-overlay" />
        <div className="chauffeur-hero-inner">
          <div>
            <span className="chauffeur-eyebrow">Dịch vụ xe đưa đón</span>
            <h1>Thuê xe có lái cho doanh nghiệp và cá nhân</h1>
            <p>
              Giải pháp đưa đón cán bộ nhân viên, chuyên gia, khách công tác và đoàn sự kiện với xe chất lượng,
              tài xế chuyên nghiệp và lịch trình linh hoạt.
            </p>
            <div className="chauffeur-hero-actions">
              <a className="cta-button" href="tel:0566999666">Tư vấn ngay</a>
              <a className="login-btn secondary" href="#chauffeur-contact">Nhận báo giá</a>
            </div>
          </div>
        </div>
      </section>

      <main className="chauffeur-main">
        <section className="chauffeur-intro">
          <div>
            <span className="chauffeur-section-kicker">Tổng quan dịch vụ</span>
            <h2>Đưa đón đúng giờ, an toàn và tiết kiệm thời gian</h2>
          </div>
          <p>
            Phương Đông cung cấp dịch vụ thuê xe có lái cho các nhu cầu đi làm, công tác, đưa đón sân bay,
            hội nghị, du lịch doanh nghiệp và hợp đồng dài hạn. Dịch vụ phù hợp với doanh nghiệp cần tuyến
            xe ổn định cũng như khách hàng cá nhân muốn có tài xế đồng hành trong suốt hành trình.
          </p>
        </section>

        <section className="chauffeur-benefits">
          {benefits.map((item, index) => (
            <article key={item.title} className="chauffeur-benefit-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="chauffeur-split">
          <div className="chauffeur-panel">
            <span className="chauffeur-section-kicker">Các dòng xe phục vụ</span>
            <h2>Lựa chọn xe theo quy mô đoàn</h2>
            <div className="chauffeur-vehicle-list">
              {vehicleGroups.map((item) => (
                <div key={item}>
                  <span>✓</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="chauffeur-image-card">
            <img
              src="https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80"
              alt="Xe có lái phục vụ doanh nghiệp"
            />
          </div>
        </section>

        <section className="chauffeur-process">
          <span className="chauffeur-section-kicker">Quy trình</span>
          <h2>Triển khai nhanh theo nhu cầu thực tế</h2>
          <div className="chauffeur-process-grid">
            <div><strong>01</strong><span>Tiếp nhận lịch trình, số lượng người, điểm đón trả.</span></div>
            <div><strong>02</strong><span>Tư vấn dòng xe, báo giá theo chuyến/tháng/hợp đồng.</span></div>
            <div><strong>03</strong><span>Sắp xếp xe và tài xế, xác nhận thông tin trước chuyến.</span></div>
            <div><strong>04</strong><span>Theo dõi hành trình, hỗ trợ điều chỉnh khi phát sinh.</span></div>
          </div>
        </section>

        <section className="chauffeur-contact" id="chauffeur-contact">
          <div>
            <span className="chauffeur-section-kicker">Liên hệ</span>
            <h2>Nhận tư vấn thuê xe có lái</h2>
            <p>Gửi yêu cầu hoặc gọi trực tiếp để được tư vấn dòng xe, tuyến đường và chi phí phù hợp.</p>
          </div>
          <div className="chauffeur-contact-box">
            <a href="tel:0566999666">0566 999 666</a>
            <a href="tel:0979402470">0979 402 470</a>
            <a href="mailto:phuongdongcorp22@gmail.com">phuongdongcorp22@gmail.com</a>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
