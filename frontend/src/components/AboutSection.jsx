import { HomeSectionIcon } from "./AppIcons.jsx";

export default function AboutSection({ aboutRef }) {
  return (
    <section className="about" id="gioi-thieu" ref={aboutRef}>
      <div className="about-container">
        <p className="about-eyebrow">Công ty Cổ phần TĐ Phương Đông</p>
        <h2 className="section-title about-title">Giới thiệu</h2>
        <p className="about-lead">
          Thành lập năm 2017, Phương Đông là doanh nghiệp chuyên cho thuê xe ô tô tự lái và có lái,
          phục vụ khách hàng cá nhân và doanh nghiệp trong và ngoài nước với đội xe đa dạng từ phổ thông
          đến cao cấp: 4 chỗ, 7 chỗ, 16 chỗ, 29 chỗ và 45 chỗ.
        </p>

        <div className="about-services-grid">
          <article className="about-service-card">
            <HomeSectionIcon type="enterprise" className="about-service-icon" />
            <h3>Đưa đón cán bộ, nhân viên</h3>
            <p>
              Dịch vụ được các doanh nghiệp lựa chọn để đưa đón lãnh đạo, chuyên gia nước ngoài và
              nhân viên tại khu công nghiệp hoặc đi công tác. Khách hàng chủ động sử dụng xe cho từng
              chuyến mà không lo bảo hiểm, đăng kiểm hay chi phí bảo dưỡng.
            </p>
          </article>
          <article className="about-service-card">
            <HomeSectionIcon type="airport" className="about-service-icon" />
            <h3>Du lịch &amp; công tác theo chuyến</h3>
            <p>
              Thuê xe chuyến lẻ (tự lái hoặc có lái) khi không cần tần suất cao: du lịch, công tác,
              đưa đón sân bay, sử dụng xe theo ngày trong thành phố và nhiều mục đích khác.
            </p>
          </article>
          <article className="about-service-card">
            <HomeSectionIcon type="customService" className="about-service-icon" />
            <h3>Dịch vụ xe theo yêu cầu</h3>
            <p>
              Cho thuê xe cưới, quay phim, chụp mẫu, trưng bày triển lãm… Liên hệ trực tiếp để được
              tư vấn và hỗ trợ cho mọi nhu cầu về ô tô.
            </p>
          </article>
        </div>

        <div className="about-split">
          <article className="about-panel">
            <HomeSectionIcon type="history" className="about-panel-icon" />
            <h3>Lịch sử phát triển</h3>
            <p>
              Công ty được thành lập ngày 22/5/2017 với dịch vụ vận tải hành khách – cho thuê ô tô theo
              hợp đồng. Khởi đầu với quy mô nhỏ, chuyên phục vụ các chuyến lẻ; sau đó mở rộng sang khách
              hàng doanh nghiệp với nhiều hình thức cho thuê xe đưa đón và phục vụ dài hạn.
            </p>
          </article>
          <article className="about-panel">
            <HomeSectionIcon type="mission" className="about-panel-icon" />
            <h3>Tầm nhìn &amp; sứ mệnh</h3>
            <p>
              Trở thành người bạn đồng hành đáng tin cậy mà khách hàng nghĩ tới đầu tiên cho mỗi chuyến đi.
            </p>
            <p>
              Mang tới sự thoải mái, an tâm và hài lòng trên mọi phương diện nhờ sự chuyên nghiệp và nhiệt
              tình của đội ngũ nhân viên và lái xe.
            </p>
          </article>
        </div>

        <h3 className="about-subtitle">Giá trị cốt lõi</h3>
        <div className="about-values-grid">
          <article className="about-value-card">
            <div className="about-value-tags">
              <span>Uy tín</span>
              <span>Chuyên nghiệp</span>
            </div>
            <p>
              Nỗ lực tạo dựng và giữ gìn uy tín với khách hàng, đối tác và nhân viên. Dịch vụ chất lượng
              nhờ đội ngũ lái xe và nhân viên chuyên nghiệp.
            </p>
          </article>
          <article className="about-value-card">
            <div className="about-value-tags">
              <span>An toàn</span>
              <span>Trải nghiệm</span>
            </div>
            <p>
              Lái xe giàu kinh nghiệm, xe chất lượng cao được theo dõi và bảo dưỡng thường xuyên — mang lại
              sự an tâm và trải nghiệm hài lòng trên mỗi hành trình.
            </p>
          </article>
          <article className="about-value-card">
            <div className="about-value-tags">
              <span>Đồng hành</span>
              <span>Kết nối</span>
            </div>
            <p>
              Giao tiếp hiệu quả với khách hàng và đối tác, môi trường làm việc thoải mái trong nội bộ —
              nâng cao chất lượng dịch vụ từng ngày.
            </p>
          </article>
        </div>

        <div className="about-highlights">
          <div className="about-highlight">
            <HomeSectionIcon type="gps" className="about-highlight-icon" />
            <strong>GPS &amp; giám sát</strong>
            <span>Kiểm soát vị trí, tình trạng xe và hỗ trợ kịp thời</span>
          </div>
          <div className="about-highlight">
            <HomeSectionIcon type="fuel" className="about-highlight-icon" />
            <strong>Quản lý nhiên liệu</strong>
            <span>Mua xăng dầu qua thẻ, vận hành minh bạch</span>
          </div>
          <div className="about-highlight">
            <HomeSectionIcon type="team" className="about-highlight-icon" />
            <strong>Đội ngũ</strong>
            <span>CSKH tận tâm, nhân sự văn phòng đúng chuyên ngành</span>
          </div>
        </div>
      </div>
    </section>
  );
}
