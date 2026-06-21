import { useEffect } from "react";
import { Link } from "react-router-dom";
import { selfDriveDetailPath } from "../lib/carUtils.js";

export default function CustomerCarShowcase({
  loggedInUser,
  carGridRef,
  handleGridPointerDown,
  handleGridPointerMove,
  handleGridPointerUp,
  displayCars,
  handleCarCardClick,
  navigate,
  getCarCategory,
  isCarRented,
  getCarSubtitle,
  getCarImageUrl,
  fallbackCars,
  getCarSeats,
  getCarTransmission,
  getCarColorSwatch,
}) {
  useEffect(() => {
    const carouselElement = carGridRef?.current;
    if (!carouselElement) return undefined;

    const resetScroll = () => {
      carouselElement.scrollTo({ left: 0, behavior: "auto" });
    };

    resetScroll();
    const frameId = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(frameId);
  }, [carGridRef, displayCars]);

  return (
    <section className="customer-view">
      <div className="customer-view-header">
        <h2>{loggedInUser ? "Khám phá mẫu xe của chúng tôi" : "Xem mẫu xe cho thuê"}</h2>
        <p>
          {loggedInUser
            ? "Chọn xe, xem thông tin chi tiết và liên hệ để đặt thuê."
            : "Các mẫu xe hiện có"}
        </p>
      </div>
      <div
        ref={carGridRef}
        className="car-grid"
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
        onPointerCancel={handleGridPointerUp}
      >
        {displayCars.map((car) => (
          <div
            key={car.car_id}
            className="car-card car-card-link"
            data-car-detail-path={selfDriveDetailPath(car)}
            role="button"
            tabIndex={0}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            onClick={(event) => handleCarCardClick(event, car)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(selfDriveDetailPath(car));
              }
            }}
          >
            <div className="car-card-top">
              <span className="car-card-badge">{getCarCategory(car)}</span>
              {isCarRented(car) ? <span className="car-card-badge car-card-badge-rented">Đang cho thuê</span> : null}
            </div>
            <h3>{car.name}</h3>
            <p className="car-card-subtitle">{getCarSubtitle(car)}</p>
            <div className="car-card-image car-card-image-img">
              <img src={getCarImageUrl(car, fallbackCars)} alt={car.name} loading="lazy" />
            </div>
            <div className="car-card-info-row">
              <div>
                <div className="car-card-price">{car.price_per_day.toLocaleString()} VND</div>
                <div className="car-card-note">Giá/ngày</div>
              </div>
              <span className="car-card-button" role="button">Xem chi tiết</span>
            </div>
            <div className="car-card-specs">
              <div>
                <span className="car-card-spec-icon" aria-hidden="true">
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
                <span className="car-card-spec-icon" aria-hidden="true">
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
                <span
                  className="car-card-spec-icon color"
                  style={{ "--spec-color": getCarColorSwatch(car.color) }}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3.8s6 6.2 6 10.2a6 6 0 0 1-12 0c0-4 6-10.2 6-10.2Z" />
                    <path d="M9.3 16.7c.8 1.2 2.2 1.9 3.7 1.7" />
                  </svg>
                </span>
                <strong>{car.color || "-"}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="view-all-cars-wrapper">
        <Link to="/thue-xe-tu-lai" className="cta-button view-all-cars-button normal-case-button">
          Xem tất cả các xe
        </Link>
      </div>
    </section>
  );
}
