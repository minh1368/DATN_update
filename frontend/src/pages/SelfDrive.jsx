import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppFooter from "../components/AppFooter.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useCars } from "../context/CarsContext.jsx";
import { canonicalizeBrand, getCarImageUrl, selfDriveDetailPath, uniqueCanonicalBrands } from "../lib/carUtils.js";
import { fallbackCars } from "../lib/carData.js";

function uniqueValues(list, getter) {
  return Array.from(new Set(list.map(getter).filter(Boolean)));
}

const CARS_PER_PAGE = 8;

function getCarCategory(car) {
  return (car.fuel_type || "Self-drive").toUpperCase();
}

function getCarSeats(car) {
  return car.seats ? `${car.seats} chỗ` : "-";
}

function getCarTransmission(car) {
  return car.transmission || "-";
}

export default function SelfDrivePage() {
  const navigate = useNavigate();
  const { displayCars, loading } = useCars();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    brand: "",
    seats: "",
    transmission: "",
    fuelType: "",
    status: "",
    priceMax: "",
    sort: "popular",
  });

  const brands = useMemo(() => uniqueCanonicalBrands(displayCars), [displayCars]);
  const seatsOptions = useMemo(() => uniqueValues(displayCars, (c) => c.seats).sort((a, b) => a - b), [displayCars]);
  const transmissionOptions = useMemo(
    () => uniqueValues(displayCars, (c) => c.transmission).sort((a, b) => String(a).localeCompare(String(b), "vi")),
    [displayCars]
  );
  const fuelTypeOptions = useMemo(
    () => uniqueValues(displayCars, (c) => c.fuel_type).sort((a, b) => String(a).localeCompare(String(b), "vi")),
    [displayCars]
  );

  const filteredCars = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    const max = filters.priceMax ? Number(filters.priceMax) : null;
    const seats = filters.seats ? Number(filters.seats) : null;

    let result = [...displayCars];
    if (keyword) {
      result = result.filter((c) => [
        c.name,
        c.brand,
        canonicalizeBrand(c.brand),
        c.license_plate,
        c.color,
        c.transmission,
        c.fuel_type,
        c.year,
        c.seats ? `${c.seats} chỗ` : "",
      ].join(" ").toLowerCase().includes(keyword));
    }
    if (filters.brand) result = result.filter((c) => canonicalizeBrand(c.brand) === filters.brand);
    if (seats) result = result.filter((c) => Number(c.seats) === seats);
    if (filters.transmission) result = result.filter((c) => String(c.transmission || "") === filters.transmission);
    if (filters.fuelType) result = result.filter((c) => String(c.fuel_type || "") === filters.fuelType);
    if (filters.status) result = result.filter((c) => String(c.status || "").toLowerCase() === filters.status);
    if (max !== null && !Number.isNaN(max)) result = result.filter((c) => Number(c.price_per_day) <= max);

    if (filters.sort === "price_asc") result = [...result].sort((a, b) => a.price_per_day - b.price_per_day);
    if (filters.sort === "price_desc") result = [...result].sort((a, b) => b.price_per_day - a.price_per_day);
    if (filters.sort === "newest") result = [...result].sort((a, b) => (b.year || 0) - (a.year || 0));
    return result;
  }, [displayCars, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / CARS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * CARS_PER_PAGE,
    currentPage * CARS_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [filters, displayCars]);

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    document.getElementById("gf-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isCarRented = (car) => String(car?.status || "").toLowerCase() === "rented";

  return (
    <div className="gf-page">
      <PageHeader />

      <section className="gf-hero">
        <div className="gf-hero-inner">
          <div className="gf-hero-copy">
            <h1>Thuê xe tự lái</h1>
            <p>Chọn mẫu xe phù hợp. Giá theo ngày, quy trình nhanh, hỗ trợ <span className="nowrap">24/7</span>.</p>
          </div>

          <div className="gf-search">
            <div className="gf-search-grid">
              <label className="gf-field">
                <span>Hãng xe</span>
                <select value={filters.brand} onChange={(e) => setFilters((p) => ({ ...p, brand: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="gf-field">
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
              <label className="gf-field">
                <span>Hộp số</span>
                <select value={filters.transmission} onChange={(e) => setFilters((p) => ({ ...p, transmission: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {transmissionOptions.map((item) => (
                    <option key={String(item)} value={String(item)}>
                      {item}
                    </option>
                  ))}
                </select>
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
            <div className="gf-page-status">
              Trang {currentPage}/{totalPages}
            </div>
            <div className="gf-toolbar-right">
              <label className="gf-inline gf-search-inline">
                <span>Tìm kiếm</span>
                <input
                  type="search"
                  placeholder="Tìm theo tên xe, hãng..."
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                />
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
                <span>Loại xe</span>
                <select value={filters.fuelType} onChange={(e) => setFilters((p) => ({ ...p, fuelType: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {fuelTypeOptions.map((item) => (
                    <option key={String(item)} value={String(item)}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="gf-inline">
                <span>Trạng thái</span>
                <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                  <option value="">Tất cả</option>
                  <option value="available">Còn xe</option>
                  <option value="rented">Đang cho thuê</option>
                </select>
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
            {paginatedCars.map((car) => (
              <Link
                key={car.car_id}
                className="gf-card gf-card-link"
                to={selfDriveDetailPath(car)}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(selfDriveDetailPath(car));
                }}
              >
                <div className="gf-card-top">
                  <div className="gf-chip">{getCarCategory(car)}</div>
                  {isCarRented(car) ? <div className="gf-chip subtle rented">Đang cho thuê</div> : null}
                </div>
                <div className="gf-card-title">
                  <h3>{car.name}</h3>
                  <p className="gf-muted">{canonicalizeBrand(car.brand) || "Hãng xe"}</p>
                </div>
                <div className="gf-card-media gf-card-media-img">
                  <img src={getCarImageUrl(car, fallbackCars)} alt={car.name} loading="lazy" />
                </div>
                <div className="gf-card-bottom">
                  <div>
                    <div className="gf-price">{Number(car.price_per_day || 0).toLocaleString()} VND</div>
                    <span className="gf-price-unit">Giá/ngày</span>
                  </div>
                  <span className="car-card-button" role="button">
                    Xem chi tiết
                  </span>
                </div>
                <div className="gf-card-specs">
                  <div>
                    <span className="gf-card-spec-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path d="M3.8 19.5c.7-3 2.2-4.5 4.2-4.5s3.5 1.5 4.2 4.5" />
                        <path d="M11.8 19.5c.7-3 2.2-4.5 4.2-4.5s3.5 1.5 4.2 4.5" />
                      </svg>
                    </span>
                    <strong>{getCarSeats(car)}</strong>
                  </div>
                  <div>
                    <span className="gf-card-spec-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M7 5v14" />
                        <path d="M17 5v14" />
                        <path d="M7 12h10" />
                        <path d="M7 5h4" />
                        <path d="M17 19h-4" />
                        <circle cx="7" cy="5" r="2" />
                        <circle cx="17" cy="12" r="2" />
                        <circle cx="17" cy="19" r="2" />
                      </svg>
                    </span>
                    <strong>{getCarTransmission(car)}</strong>
                  </div>
                  <div>
                    <span className="gf-card-spec-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 3.8s6 6.2 6 10.2a6 6 0 0 1-12 0c0-4 6-10.2 6-10.2Z" />
                        <path d="M9.3 16.7c.8 1.2 2.2 1.9 3.7 1.7" />
                      </svg>
                    </span>
                    <strong>{car.color || "-"}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </section>

          {filteredCars.length > CARS_PER_PAGE ? (
            <nav className="self-drive-pagination" aria-label="Phân trang danh sách xe">
              <button
                type="button"
                className="news-page-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`news-page-btn ${pageNumber === currentPage ? "active" : ""}`}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                className="news-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              >
                Sau
              </button>
            </nav>
          ) : null}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}



