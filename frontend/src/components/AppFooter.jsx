import { Link } from "react-router-dom";

const footerLinks = {
  booking: [
    { label: "Thuê xe tự lái", to: "/thue-xe-tu-lai" },
    { label: "Thuê xe có lái", to: "/thue-xe-co-lai" },
  ],
  about: [
    { label: "Về chúng tôi", to: "/gioi-thieu" },
    { label: "Tin tức", to: "/tin-tuc" },
  ],
};

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: (
      <>
        <rect x="5" y="5" width="14" height="14" rx="4" />
        <circle cx="12" cy="12" r="3.2" />
        <path d="M16.5 7.5h.01" />
      </>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/",
    icon: (
      <>
        <path d="M21 12s0-3.2-.4-4.5a2.6 2.6 0 0 0-1.8-1.8C17.5 5.3 12 5.3 12 5.3s-5.5 0-6.8.4a2.6 2.6 0 0 0-1.8 1.8C3 8.8 3 12 3 12s0 3.2.4 4.5a2.6 2.6 0 0 0 1.8 1.8c1.3.4 6.8.4 6.8.4s5.5 0 6.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.3.4-4.5.4-4.5Z" />
        <path d="m10 9 5 3-5 3Z" />
      </>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    icon: <path d="M14 8h2V5h-2.4C10.8 5 9 6.8 9 9.6V12H6v3h3v6h3v-6h3l.5-3H12V9.6c0-1 .5-1.6 2-1.6Z" />,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/",
    icon: <path d="M14 4v9.2A4.8 4.8 0 1 1 9.2 8.4c.4 0 .8 0 1.2.1v3.3a2 2 0 1 0 1.4 1.9V4h2.2c.5 2.3 2 3.7 4 4v3.1a7.4 7.4 0 0 1-4-1.2Z" />,
  },
];

function scrollToTop(event) {
  event.preventDefault();
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  document.documentElement.scrollTo?.({ top: 0, left: 0, behavior: "smooth" });
  document.body.scrollTo?.({ top: 0, left: 0, behavior: "smooth" });
}

function MailIcon() {
  return (
    <svg className="footer-mail-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <div className="app-footer-logo">
            <span className="logo-icon footer-header-logo"><img src="/image/brand/logo.png" alt="Phương Đông" /></span>
            <span className="footer-logo-divider" />
            <span className="footer-logo-text">Dịch vụ<br />cho thuê xe<br />linh hoạt</span>
          </div>

          <div className="app-footer-company">
            <h2>Công ty Cổ phần TĐ Phương Đông</h2>
            <p>MST/MSDN: 0110942941, cấp ngày 21/01/2025</p>
            <p>Địa chỉ: 39 Phan Phù Tiên, phường Ô Chợ Dừa, Hà Nội, Việt Nam</p>
          </div>
        </div>

        <nav className="app-footer-column" aria-label="Thuê xe">
          <h3>Thuê xe</h3>
          {footerLinks.booking.map((item) => (
            <Link key={item.label} to={item.to}>{item.label}</Link>
          ))}
        </nav>

        <nav className="app-footer-column" aria-label="Giới thiệu">
          <h3>Giới thiệu</h3>
          {footerLinks.about.map((item) => (
            <Link key={item.label} to={item.to}>{item.label}</Link>
          ))}
        </nav>

        <div className="app-footer-contact">
          <h3>Liên hệ</h3>
          <a className="footer-hotline" href="tel:0979402470">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" />
            </svg>
            0979 402 470
          </a>
          <div className="footer-contact-list">
            <div className="footer-mail-row">
              <MailIcon />
              <div>
                <span>Chăm sóc khách hàng</span>
                <a href="mailto:phuongdongcorp22@gmail.com">phuongdongcorp22@gmail.com</a>
              </div>
            </div>
            <div className="footer-mail-row">
              <MailIcon />
              <div>
                <span>Kinh doanh cho thuê</span>
                <a href="mailto:phuongdongcorp22@gmail.com">phuongdongcorp22@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="app-footer-social" aria-label="Mạng xã hội">
          {socialLinks.map((item) => (
            <a key={item.label} href={item.href} aria-label={item.label} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
            </a>
          ))}
        </div>

        <button className="footer-back-top" type="button" onClick={scrollToTop} aria-label="Lên đầu trang">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 14 6-6 6 6" />
          </svg>
        </button>

        <div className="app-footer-bottom">
          <p>©2025 Phuong Dong Corporation. All rights reserved.</p>
          <Link to="/dieu-khoan-su-dung">Điều khoản sử dụng</Link>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
