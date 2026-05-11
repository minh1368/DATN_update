import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../App.css";
import { fallbackCars } from "../lib/carData.js";
import { carIdFromSlug, getCarImageUrl, selfDriveDetailPath } from "../lib/carUtils.js";
import { useCars } from "../context/CarsContext.jsx";

function findFallbackCarById(carId) {
  const id = Number(carId);
  if (!Number.isFinite(id)) return null;
  return fallbackCars.find((c) => Number(c.car_id) === id) || null;
}

export default function SelfDriveDetailPage() {
  const params = useParams();
  const carId = useMemo(() => carIdFromSlug(params.carSlug), [params.carSlug]);
  const { displayCars } = useCars();
  const [car, setCar] = useState(() => (carId ? findFallbackCarById(carId) : null));
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    start_date: '',
    end_date: '',
    pickup_location: '',
    message: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (!carId) {
      setLoading(false);
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      "X-User-Role": "customer",
    };

    setLoading(true);
    fetch(`http://localhost:8000/cars/${carId}`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object") setCar(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carId]);

  const title = car?.name || "Chi tiết xe";
  const brand = car?.brand || "-";
  const price = Number(car?.price_per_day || 0).toLocaleString();

  const otherCars = useMemo(() => {
    const id = Number(car?.car_id);
    return displayCars.filter((c) => Number(c.car_id) !== id).slice(0, 4);
  }, [car, displayCars]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess(false);

    // Validate form
    if (!bookingData.customer_name || !bookingData.customer_phone || !bookingData.start_date || !bookingData.end_date) {
      setBookingError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    try {
      // First create customer
      const customerResponse = await fetch('http://localhost:8000/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookingData.customer_name,
          phone: bookingData.customer_phone,
          email: bookingData.customer_email,
          address: bookingData.pickup_location
        })
      });

      if (!customerResponse.ok) {
        throw new Error('Không thể tạo thông tin khách hàng');
      }

      const customer = await customerResponse.json();

      // Then create rental request
      const rentalResponse = await fetch('http://localhost:8000/rental_requests/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.customer_id,
          car_id: car.car_id,
          start_date: bookingData.start_date,
          end_date: bookingData.end_date
        })
      });

      if (!rentalResponse.ok) {
        const errorData = await rentalResponse.json().catch(() => null);
        throw new Error(errorData?.detail || 'Không thể tạo yêu cầu thuê xe');
      }

      setBookingSuccess(true);
      setShowBookingForm(false);
      setBookingData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        start_date: '',
        end_date: '',
        pickup_location: '',
        message: ''
      });
      
      alert('Yêu cầu thuê xe đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
    } catch (error) {
      setBookingError(error.message || 'Đặt xe thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="gf-page gf-detail-page">
      <header className="gf-header">
        <div className="gf-header-inner">
          <Link to="/" className="gf-brand">
            <span className="logo-icon">PDC</span>
            <span className="gf-brand-text">Thuê xe</span>
          </Link>
          <nav className="gf-nav">
            <Link to="/" className="gf-nav-link">
              Trang chủ
            </Link>
            <span className="gf-nav-sep">/</span>
            <Link to="/thue-xe-tu-lai" className="gf-nav-link">
              Thuê xe tự lái
            </Link>
            <span className="gf-nav-sep">/</span>
            <span className="gf-nav-current">{title}</span>
          </nav>
          <div className="gf-header-cta">
            <a className="login-btn" href="tel:0566999666">
              Đặt xe: 0566 999 666
            </a>
          </div>
        </div>
      </header>

      <main className="gf-main">
        <div className="gf-main-inner">
          <section className="gf-detail-hero">
            <div className="gf-detail-hero-left">
              <div className="gf-detail-badges">
                <span className="gf-chip">{(car?.fuel_type || "Self-drive").toUpperCase()}</span>
                <span className="gf-chip subtle">{car?.transmission || "Tự động"}</span>
                <span className="gf-chip subtle">{car?.seats ? `${car.seats} chỗ` : "— chỗ"}</span>
              </div>
              <h1 className="gf-detail-title">{title}</h1>
              <p className="gf-muted">{brand}</p>

              <div className="gf-detail-price">
                <div>
                  <div className="gf-price">{price} VND</div>
                  <div className="gf-muted">/ ngày</div>
                </div>
                <button 
                  className="cta-button gf-detail-book" 
                  onClick={() => setShowBookingForm(true)}
                >
                  Đặt xe
                </button>
              </div>

              <p className="gf-detail-desc">{car?.description || "Xe phù hợp di chuyển hàng ngày, đi tỉnh, du lịch gia đình."}</p>
            </div>

            <div className="gf-detail-hero-right">
              <div className="gf-detail-media gf-card-media-img">
                <img src={getCarImageUrl(car, fallbackCars)} alt={title} />
              </div>
              <div className="gf-detail-specgrid">
                <div className="gf-spec">
                  <span>🎨</span>
                  <div>
                    <div className="gf-muted">Màu</div>
                    <strong>{car?.color || "-"}</strong>
                  </div>
                </div>
                <div className="gf-spec">
                  <span>📅</span>
                  <div>
                    <div className="gf-muted">Năm</div>
                    <strong>{car?.year || "-"}</strong>
                  </div>
                </div>
                <div className="gf-spec">
                  <span>🧾</span>
                  <div>
                    <div className="gf-muted">Trạng thái</div>
                    <strong>{car?.status || "-"}</strong>
                  </div>
                </div>
                <div className="gf-spec">
                  <span>⚡</span>
                  <div>
                    <div className="gf-muted">Loại</div>
                    <strong>{car?.fuel_type || "-"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="gf-detail-sections">
            <div className="gf-detail-section">
              <h2>Các tiện nghi khác</h2>
              <ul className="gf-list">
                <li>Điều hoà, màn hình giải trí, kết nối Bluetooth</li>
                <li>Cảm biến hỗ trợ đỗ xe (tuỳ xe)</li>
                <li>Camera hành trình (tuỳ xe)</li>
                <li>Cổng sạc USB, giá đỡ điện thoại</li>
              </ul>
              <p className="gf-muted gf-note">
                Nội dung bố cục tham khảo trang Green Future, ví dụ:{" "}
                <a className="gf-nav-link" href="https://greenfuture.tech/thue-xe-tu-lai/vinfast-vf3" target="_blank" rel="noreferrer">
                  VinFast VF 3
                </a>
                .
              </p>
            </div>

            <div className="gf-detail-section">
              <h2>Điều kiện thuê xe</h2>
              <ul className="gf-list">
                <li>CCCD/CMND còn hiệu lực</li>
                <li>Bằng lái B1/B2 (tuỳ loại xe)</li>
                <li>Đặt cọc theo quy định (tiền mặt/chuyển khoản)</li>
              </ul>
            </div>

            <div className="gf-detail-section">
              <h2>Thông tin cần có khi nhận xe</h2>
              <ul className="gf-list">
                <li>Họ tên, số điện thoại</li>
                <li>Ngày giờ nhận & trả xe</li>
                <li>Địa điểm nhận xe</li>
              </ul>
            </div>

            <div className="gf-detail-section">
              <h2>Hình thức thanh toán</h2>
              <ul className="gf-list">
                <li>Tiền mặt</li>
                <li>Chuyển khoản</li>
              </ul>
            </div>

            <div className="gf-detail-section">
              <h2>Chính sách đặt cọc (thế chân)</h2>
              <ul className="gf-list">
                <li>Đặt cọc trước khi nhận xe</li>
                <li>Hoàn cọc sau khi đối soát tình trạng xe</li>
                <li>Khấu trừ nếu phát sinh vi phạm/hư hỏng (nếu có)</li>
              </ul>
            </div>
          </section>

          <section className="gf-detail-more">
            <div className="gf-toolbar" style={{ borderBottom: "none", marginBottom: 10 }}>
              <div className="gf-toolbar-left">
                <h2>Xe khác</h2>
                <p className="gf-muted">Gợi ý thêm để bạn so sánh nhanh</p>
              </div>
              <div className="gf-toolbar-right">
                <Link to="/thue-xe-tu-lai" className="login-btn secondary">
                  Quay lại danh sách
                </Link>
              </div>
            </div>
            <div className="gf-grid gf-grid-4">
              {otherCars.map((c) => (
                <Link key={c.car_id} className="gf-card gf-card-link" to={selfDriveDetailPath(c)}>
                  <div className="gf-card-top">
                    <div className="gf-chip">{(c.fuel_type || "Self-drive").toUpperCase()}</div>
                    <div className="gf-chip subtle">{c.transmission || "Tự động"}</div>
                  </div>
                  <div className="gf-card-title">
                    <h3>{c.name}</h3>
                    <p className="gf-muted">{c.brand}</p>
                  </div>
                  <div className="gf-card-media gf-card-media-img">
                    <img src={getCarImageUrl(c, fallbackCars)} alt={c.name} loading="lazy" />
                  </div>
                  <div className="gf-card-bottom">
                    <div>
                      <div className="gf-price">{Number(c.price_per_day || 0).toLocaleString()} VND</div>
                      <div className="gf-muted">/ ngày</div>
                    </div>
                    <span className="car-card-button" role="button">
                      Xem
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {loading && !car ? <p className="gf-muted">Đang tải chi tiết...</p> : null}
          {!loading && !car ? <p className="gf-muted">Không tìm thấy xe.</p> : null}
        </div>
      </main>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="modal-overlay" onClick={() => setShowBookingForm(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h3>Đặt xe: {car?.name}</h3>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setShowBookingForm(false)}
              >
                ×
              </button>
            </div>
            
            <form className="booking-form" onSubmit={handleBookingSubmit}>
              <div className="booking-form-grid">
                <div className="form-group">
                  <label>Họ tên *</label>
                  <input
                    type="text"
                    value={bookingData.customer_name}
                    onChange={(e) => setBookingData({...bookingData, customer_name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    value={bookingData.customer_phone}
                    onChange={(e) => setBookingData({...bookingData, customer_phone: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={bookingData.customer_email}
                    onChange={(e) => setBookingData({...bookingData, customer_email: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Ngày bắt đầu *</label>
                  <input
                    type="date"
                    value={bookingData.start_date}
                    onChange={(e) => setBookingData({...bookingData, start_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Ngày kết thúc *</label>
                  <input
                    type="date"
                    value={bookingData.end_date}
                    onChange={(e) => setBookingData({...bookingData, end_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Địa điểm nhận xe</label>
                  <input
                    type="text"
                    value={bookingData.pickup_location}
                    onChange={(e) => setBookingData({...bookingData, pickup_location: e.target.value})}
                    placeholder="Ví dụ: Sân bay Tân Sơn Nhất"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <textarea
                    value={bookingData.message}
                    onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                    rows="3"
                    placeholder="Yêu cầu đặc biệt hoặc ghi chú thêm..."
                  />
                </div>
              </div>
              
              {bookingError && (
                <div className="booking-error">{bookingError}</div>
              )}
              
              <div className="booking-form-actions">
                <button 
                  type="button" 
                  className="login-btn secondary" 
                  onClick={() => setShowBookingForm(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="cta-button">
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

