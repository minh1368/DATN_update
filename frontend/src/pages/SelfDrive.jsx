import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import { useCars } from "../context/CarsContext.jsx";
import { getCarImageUrl, selfDriveDetailPath } from "../lib/carUtils.js";
import { fallbackCars } from "../lib/carData.js";

function uniqueValues(list, getter) {
  return Array.from(new Set(list.map(getter).filter(Boolean)));
}

export default function SelfDrivePage() {
  const { displayCars, loading } = useCars();
  const [filters, setFilters] = useState({
    location: "Hà Nội",
    startDate: "",
    endDate: "",
    brand: "",
    seats: "",
    priceMax: "",
    sort: "popular",
  });

  const brands = useMemo(() => uniqueValues(displayCars, (c) => c.brand), [displayCars]);
  const seatsOptions = useMemo(() => uniqueValues(displayCars, (c) => c.seats).sort((a, b) => a - b), [displayCars]);

  const filteredCars = useMemo(() => {
    const max = filters.priceMax ? Number(filters.priceMax) : null;
    const seats = filters.seats ? Number(filters.seats) : null;

    let result = displayCars.filter((c) => c.status !== "rented");
    if (filters.brand) result = result.filter((c) => c.brand === filters.brand);
    if (seats) result = result.filter((c) => Number(c.seats) === seats);
    if (max !== null && !Number.isNaN(max)) result = result.filter((c) => Number(c.price_per_day) <= max);

    if (filters.sort === "price_asc") result = [...result].sort((a, b) => a.price_per_day - b.price_per_day);
    if (filters.sort === "price_desc") result = [...result].sort((a, b) => b.price_per_day - a.price_per_day);
    if (filters.sort === "newest") result = [...result].sort((a, b) => (b.year || 0) - (a.year || 0));
    return result;
  }, [displayCars, filters]);

  return (
    <div className="gf-page">
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
            <span className="gf-nav-current">Thuê xe tự lái</span>
          </nav>
          <div className="gf-header-cta">
            <a className="login-btn" href="tel:0566999666">
              Hotline: 0566 999 666
            </a>
          </div>
        </div>
      </header>

      <section className="gf-hero">
        <div className="gf-hero-inner">
          <div className="gf-hero-copy">
            <h1>Thuê xe tự lái</h1>
            <p>Chọn địa điểm, thời gian và mẫu xe phù hợp. Giá theo ngày, quy trình nhanh, hỗ trợ 24/7.</p>
          </div>

          <div className="gf-search">
            <div className="gf-search-grid">
              <label className="gf-field">
                <span>Địa điểm</span>
                <select value={filters.location} onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </label>
              <label className="gf-field">
                <span>Nhận xe</span>
                <input type="date" value={filters.startDate} onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))} />
              </label>
              <label className="gf-field">
                <span>Trả xe</span>
                <input type="date" value={filters.endDate} onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))} />
              </label>
              <button type="button" className="cta-button gf-search-btn" onClick={() => document.getElementById("gf-results")?.scrollIntoView({ behavior: "smooth" })}>
                Tìm xe
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="gf-main" id="gf-results">
        <div className="gf-main-inner">
          <section className="gf-toolbar">
            <div className="gf-toolbar-left">
              <h2>Danh sách xe</h2>
              <p className="gf-muted">{loading ? "Đang tải..." : `${filteredCars.length} xe phù hợp`}</p>
            </div>
            <div className="gf-toolbar-right">
              <label className="gf-inline">
                <span>Hãng</span>
                <select value={filters.brand} onChange={(e) => setFilters((p) => ({ ...p, brand: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="gf-inline">
                <span>Số chỗ</span>
                <select value={filters.seats} onChange={(e) => setFilters((p) => ({ ...p, seats: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {seatsOptions.map((s) => (
                    <option key={String(s)} value={String(s)}>
                      {s} chỗ
                    </option>
                  ))}
                </select>
              </label>
              <label className="gf-inline">
                <span>Giá tối đa/ngày</span>
                <input
                  type="number"
                  min="0"
                  placeholder="VD: 1500000"
                  value={filters.priceMax}
                  onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))}
                />
              </label>
              <label className="gf-inline">
                <span>Sắp xếp</span>
                <select value={filters.sort} onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}>
                  <option value="popular">Phổ biến</option>
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </label>
            </div>
          </section>

          <section className="gf-grid">
            {filteredCars.map((car) => (
              <Link key={car.car_id} className="gf-card gf-card-link" to={selfDriveDetailPath(car)}>
                <div className="gf-card-top">
                  <div className="gf-chip">{(car.fuel_type || "Self-drive").toUpperCase()}</div>
                  <div className="gf-chip subtle">{car.transmission || "Tự động"}</div>
                </div>
                <div className="gf-card-title">
                  <h3>{car.name}</h3>
                  <p className="gf-muted">{car.brand || "Hãng xe"}</p>
                </div>
                <div className="gf-card-media gf-card-media-img">
                  <img src={getCarImageUrl(car, fallbackCars)} alt={car.name} loading="lazy" />
                </div>
                <div className="gf-card-meta">
                  <div className="gf-meta">
                    <span>🪑</span>
                    <strong>{car.seats ? `${car.seats} chỗ` : "-"}</strong>
                  </div>
                  <div className="gf-meta">
                    <span>🎨</span>
                    <strong>{car.color || "-"}</strong>
                  </div>
                  <div className="gf-meta">
                    <span>📅</span>
                    <strong>{car.year || "-"}</strong>
                  </div>
                </div>
                <div className="gf-card-bottom">
                  <div>
                    <div className="gf-price">{Number(car.price_per_day || 0).toLocaleString()} VND</div>
                    <div className="gf-muted">/ ngày</div>
                  </div>
                  <span className="car-card-button" role="button">
                    Xem chi tiết
                  </span>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2024 Phuong Dong Corporation. Tất cả quyền được bảo lưu.</p>
          <div className="social-links">
            <Link to="/">Trang chủ</Link>
            <a href="tel:0566999666">Hotline</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

