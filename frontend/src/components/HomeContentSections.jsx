import { useState } from "react";
import { HomeSectionIcon } from "./AppIcons.jsx";
import RatingRow from "./RatingRow.jsx";

export default function HomeContentSections({
  servicesRef,
  selectedRentalType,
  visibleTestimonials,
  hasMoreTestimonials,
  canCollapseTestimonials,
  handleLoadMoreTestimonials,
  handleCollapseTestimonials,
  isLoadingTestimonials,
  loggedInUser,
  reviewForm,
  setReviewForm,
  reviewNotice,
  setReviewNotice,
  handleReviewSubmit,
}) {
  const [hoveredReviewRating, setHoveredReviewRating] = useState(0);
  const displayedReviewRating = hoveredReviewRating || Number(reviewForm.rating) || 0;

  return (
    <>
      {/* SERVICES SECTION */}
      <section className="services" ref={servicesRef}>
        <div className="services-container">
          <h2 className="section-title">Dịch vụ của chúng tôi</h2>
          <div className="services-grid">
            <div className={`service-card ${selectedRentalType === "tự lái" ? "active" : ""}`}>
              <HomeSectionIcon type="selfDrive" className="service-icon" />
              <h3>Thuê xe tự lái</h3>
              <p>Chủ động hành trình, đa dạng dòng xe từ phổ thông đến cao cấp</p>
            </div>
            <div className={`service-card ${selectedRentalType === "có lái" ? "active" : ""}`}>
              <HomeSectionIcon type="chauffeur" className="service-icon" />
              <h3>Thuê xe có lái</h3>
              <p>Tài xế giàu kinh nghiệm, an toàn và thoải mái trên mọi chuyến đi</p>
            </div>
            <div className="service-card">
              <HomeSectionIcon type="enterprise" className="service-icon" />
              <h3>Đưa đón doanh nghiệp</h3>
              <p>Phục vụ nhân viên, chuyên gia tại khu công nghiệp theo tháng hoặc dài hạn</p>
            </div>
            <div className="service-card">
              <HomeSectionIcon type="route" className="service-icon" />
              <h3>Chuyến lẻ &amp; dự án</h3>
              <p>Du lịch, công tác, sân bay và xe phục vụ dự án theo yêu cầu</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className="why-choose">
        <div className="why-choose-container">
          <h2 className="section-title">Tại sao chọn Phương Đông?</h2>
          <div className="why-choose-grid">
            <div className="why-item">
              <h3>Uy tín &amp; chuyên nghiệp</h3>
              <p>Đội ngũ lái xe và nhân viên tận tâm, dịch vụ chất lượng ổn định</p>
            </div>
            <div className="why-item">
              <h3>An toàn trên mọi hành trình</h3>
              <p>Xe được bảo dưỡng định kỳ, giám sát GPS và hỗ trợ kịp thời</p>
            </div>
            <div className="why-item">
              <h3>Đa dạng đội xe</h3>
              <p>Từ sedan đến xe 45 chỗ, đáp ứng cá nhân và doanh nghiệp</p>
            </div>
            <div className="why-item">
              <h3>Đồng hành lâu dài</h3>
              <p>Hợp tác với nhiều đối tác trong và ngoài nước từ năm 2017</p>
            </div>
          </div>
        </div>
      </section>

      {/* FLEET SECTION */}
      <section className="fleet">
        <div className="fleet-container">
          <h2 className="section-title">Các loại xe của chúng tôi</h2>
          <p className="fleet-intro">
            Cung cấp nhiều hãng và dòng xe tùy nhu cầu — từ sedan cao cấp đến xe khách 45 chỗ.
            Liên hệ để được tư vấn thêm các mẫu xe khác.
          </p>
          <div className="fleet-grid">
            <div className="fleet-card">
              <HomeSectionIcon type="sedan" className="fleet-image" />
              <h3>Toyota Camry / Vios</h3>
              <p>Sedan cao cấp &amp; tiết kiệm — công tác, sân bay, nội thành</p>
            </div>
            <div className="fleet-card">
              <HomeSectionIcon type="van" className="fleet-image" />
              <h3>Kia Sedona / Carnival</h3>
              <p>7 chỗ rộng rãi — đưa đón sếp, chuyên gia, du lịch</p>
            </div>
            <div className="fleet-card">
              <HomeSectionIcon type="limousine" className="fleet-image" />
              <h3>Dcar / Limousine</h3>
              <p>Sang trọng, thoải mái — du lịch công ty, gia đình</p>
            </div>
            <div className="fleet-card">
              <HomeSectionIcon type="bus" className="fleet-image" />
              <h3>Transit / Universe / Aero</h3>
              <p>16–45 chỗ — du lịch, đưa đón nhân viên doanh nghiệp</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials">
        <div className="testimonials-container">
          <h2 className="section-title">Cảm nhận từ khách hàng</h2>
          <div className="testimonials-grid">
            {visibleTestimonials.map((testimonial) => (
              <div className="testimonial-card" key={testimonial.review_id || testimonial.id}>
                <HomeSectionIcon type="quote" className="testimonial-icon" />
                <p>"{testimonial.message}"</p>
                <h4>{testimonial.name}</h4>
                <RatingRow rating={testimonial.rating} />
              </div>
            ))}
          </div>
          {(hasMoreTestimonials || canCollapseTestimonials) ? (
            <div className="testimonial-load-more">
              {hasMoreTestimonials ? (
                <button
                  type="button"
                  className="cta-button normal-case-button"
                  onClick={handleLoadMoreTestimonials}
                  disabled={isLoadingTestimonials}
                >
                  {isLoadingTestimonials ? "Đang tải..." : "Xem thêm"}
                </button>
              ) : null}
              {canCollapseTestimonials ? (
                <button
                  type="button"
                  className="cta-button normal-case-button secondary"
                  onClick={handleCollapseTestimonials}
                >
                  Thu gọn
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* REVIEW SECTION */}
      <section className="contact">
        <div className="contact-container">
          <h2 className="section-title">Đánh giá dịch vụ</h2>
          <p className="review-subtitle">
            Chia sẻ cảm nhận của bạn giúp chúng tôi nâng cao chất lượng dịch vụ.
          </p>
          <div className="review-meta-bar">
            <span className="review-meta-item">
              <HomeSectionIcon type="account" className="review-meta-icon" />
              {loggedInUser ? `Xin chào, ${loggedInUser}` : "Vui lòng đăng nhập để gửi đánh giá"}
            </span>
            <span className="review-meta-divider" />
            <span className="review-meta-item">
              <HomeSectionIcon type="support" className="review-meta-icon" />
              Hỗ trợ: 0566 999 666
            </span>
          </div>
          <form className="contact-form review-form review-form-centered" onSubmit={handleReviewSubmit}>
            <div className="review-form-row">
              <div className="review-form-rating-input">
                <label>Mức đánh giá</label>
                <div
                  className="interactive-rating-wrapper"
                  onMouseLeave={() => setHoveredReviewRating(0)}
                >
                  <div className="interactive-rating">
                    {Array.from({ length: 5 }, (_, index) => {
                      const starValue = index + 1;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          className={`rating-star-btn ${displayedReviewRating >= starValue ? "active" : ""}`}
                          onMouseEnter={() => setHoveredReviewRating(starValue)}
                          onFocus={() => setHoveredReviewRating(starValue)}
                          onBlur={() => setHoveredReviewRating(0)}
                          onClick={() => setReviewForm({ ...reviewForm, rating: String(starValue) })}
                          title={`${starValue} sao`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m12 3.8 2.2 4.45 4.9.72-3.55 3.46.84 4.88L12 15l-4.39 2.31.84-4.88L4.9 8.97l4.9-.72L12 3.8Z" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                  <span className="rating-label-text">
                    {String(reviewForm.rating) === "5" ? "Rất hài lòng" :
                      String(reviewForm.rating) === "4" ? "Hài lòng" :
                        String(reviewForm.rating) === "3" ? "Bình thường" :
                          String(reviewForm.rating) === "2" ? "Chưa hài lòng" : "Cần cải thiện"}
                  </span>
                </div>
              </div>
            </div>
            <label>
              Nội dung đánh giá
              <textarea
                placeholder="Nhập cảm nhận của bạn về dịch vụ thuê xe..."
                rows="4"
                value={reviewForm.message}
                onChange={(event) => {
                  setReviewNotice("");
                  setReviewForm({ ...reviewForm, message: event.target.value });
                }}
              />
            </label>
            {reviewNotice ? <div className="review-notice">{reviewNotice}</div> : null}
            <button type="submit" className="cta-button normal-case-button">Gửi đánh giá</button>
          </form>
        </div>
      </section>
    </>
  );
}
