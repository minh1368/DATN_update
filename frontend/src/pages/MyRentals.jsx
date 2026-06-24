import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { authStorage } from "../lib/auth.js";
import { canonicalizeBrand } from "../lib/carUtils.js";
import { carService, customerService, requestService } from "../services/dashboardService.js";
const PAGE_SIZE = 10;

export default function MyRentalsPage() {
  const [customerId, setCustomerId] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({});
  const [rentals, setRentals] = useState([]);
  const [rentalsSearch, setRentalsSearch] = useState("");
  const [rentalsStatusFilter, setRentalsStatusFilter] = useState("");
  const [cars, setCars] = useState([]);
  const [rentalsPage, setRentalsPage] = useState(1);
  const [selectedRental, setSelectedRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function readStoredUser() {
    try {
      return JSON.parse(authStorage.getItem("userData") || "{}");
    } catch {
      return {};
    }
  }

  async function fetchCustomerInfo(id) {
    try {
      const data = await customerService.getById(id);
      setCustomerInfo((current) => ({ ...current, ...data }));
    } catch {
      // Session data is enough as a fallback.
    }
  }

  async function fetchCars() {
    try {
      const data = await carService.getAll();
      setCars(Array.isArray(data) ? data : []);
    } catch {
      setCars([]);
    }
  }

  async function fetchRentals(id) {
    setLoading(true);
    setError(null);
    try {
      const data = await requestService.getCustomerDetails(id);
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => {
            const dateDiff = new Date(b?.start_date || 0).getTime() - new Date(a?.start_date || 0).getTime();
            if (dateDiff !== 0) return dateDiff;
            return Number(b?.request_id || 0) - Number(a?.request_id || 0);
          })
        : [];
      setRentals(sorted);
      setRentalsPage(1);
    } catch (err) {
      setError(err.message || "Lỗi khi tải lịch sử thuê xe");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedCustomerId = authStorage.getItem("customerId");
    setCustomerInfo(readStoredUser());
    fetchCars();
    if (storedCustomerId) {
      setCustomerId(storedCustomerId);
      fetchCustomerInfo(storedCustomerId);
      fetchRentals(storedCustomerId);
    } else {
      setLoading(false);
    }
  }, []);

  const getRentalDisplayStatus = (rental) => {
    const contractStatus = String(rental?.contract_status || "").trim().toLowerCase();
    const requestStatus = String(rental?.status || "").trim().toLowerCase();
    const depositStatus = String(rental?.payments?.deposit?.status || "").trim().toLowerCase();
    const remainingStatus = String(rental?.payments?.remaining?.status || "").trim().toLowerCase();
    if (["approved", "active", "rented"].includes(contractStatus)) return "active";
    if (contractStatus === "completed") return "completed";
    if (requestStatus === "rejected" || depositStatus === "rejected" || remainingStatus === "rejected") return "rejected";
    if (requestStatus === "pending") return "pending";
    if (depositStatus === "paid" && remainingStatus === "paid") return "ready_contract";
    if (requestStatus === "approved") return "payment_pending";
    return requestStatus || "-";
  };

  const formatRentalStatus = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "pending") return "Chờ duyệt";
    if (normalized === "awaiting_payment" || normalized === "payment_pending") return "Chờ xác nhận thanh toán";
    if (normalized === "ready_contract") return "Chờ tạo hợp đồng";
    if (normalized === "active") return "Đang thuê";
    if (normalized === "approved") return "Hoàn thành";
    if (normalized === "rejected") return "Bị từ chối";
    if (normalized === "completed") return "Hoàn thành";
    return status || "-";
  };

  const getRentalStatusClass = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    if (["active", "approved", "completed"].includes(normalized)) return "status-approved";
    if (normalized === "ready_contract") return "status-ready";
    if (normalized === "rejected") return "status-rejected";
    return "status-pending";
  };

  const rentalStatusOptions = ["pending", "payment_pending", "ready_contract", "active", "completed", "rejected"];

  const getRentalCar = (rental) => cars.find((car) => Number(car.car_id) === Number(rental?.car_id));

  const getRentalCode = (rental) => `YC${String(rental?.request_id || "-").padStart(3, "0")}`;

  const getRentalDays = (rental) => {
    const start = new Date(rental?.start_date);
    const end = new Date(rental?.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";
    const days = Math.max(1, Math.floor((end - start) / 86400000) + 1);
    return `${days} ngày`;
  };

  const getRentalTotalPrice = (rental, car) => {
    if (!rental || !car?.price_per_day) return "-";
    const start = new Date(rental.start_date);
    const end = new Date(rental.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";
    const days = Math.max(1, Math.floor((end - start) / 86400000) + 1);
    return `${Number(days * Number(car.price_per_day || 0)).toLocaleString("vi-VN")} VND`;
  };

  const formatRentalPaymentStatus = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "paid") return "Đã thanh toán";
    if (normalized === "rejected") return "Chưa nhận được";
    if (normalized === "unpaid") return "Chờ xác nhận thanh toán";
    return status || "-";
  };

  const getRentalPaymentMarker = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    return normalized === "paid" ? "✓" : "○";
  };

  const getRejectReasonFromRental = (rental) => {
    const cleanReason = (value) => {
      let reason = String(value || "").trim();
      if (!reason) return "";
      const prefix = "Lý do từ chối:";
      if (reason.startsWith(prefix)) reason = reason.slice(prefix.length).trim();
      return reason.trim();
    };

    return cleanReason(rental?.reject_reason) ||
      cleanReason(rental?.payments?.remaining?.note) ||
      cleanReason(rental?.payments?.deposit?.note);
  };

  const filteredRentals = useMemo(() => {
    const keyword = rentalsSearch.trim().toLowerCase();
    return rentals.filter((rental) => {
      const displayStatus = getRentalDisplayStatus(rental);
      if (rentalsStatusFilter && displayStatus !== rentalsStatusFilter) {
        return false;
      }
      if (!keyword) return true;
      const searchable = [
        getRentalCode(rental),
        rental.request_id,
        rental.car_name,
        rental.car_id,
        rental.start_date,
        rental.end_date,
        getRentalDays(rental),
        formatRentalStatus(displayStatus),
        rental.status,
        rental.contract_status,
        rental.reject_reason,
      ].join(" ").toLowerCase();
      return searchable.includes(keyword);
    });
  }, [rentals, rentalsSearch, rentalsStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRentals.length / PAGE_SIZE));
  const safePage = Math.min(rentalsPage, totalPages);
  const pagedRentals = useMemo(
    () => filteredRentals.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredRentals, safePage]
  );

  const selectedCar = selectedRental ? getRentalCar(selectedRental) : null;
  const selectedDetails = selectedRental
    ? [
        ["Họ và tên", customerInfo.name || "-"],
        ["Mã yêu cầu", getRentalCode(selectedRental)],
        ["Email", customerInfo.email || customerInfo.username || "-"],
        ["Số điện thoại", customerInfo.phone || "-"],
        ["Địa điểm nhận xe", selectedRental.pickup_location || "-"],
        ["Xe", selectedRental.car_name || selectedCar?.name || `Xe #${selectedRental.car_id}`],
        ["Hãng xe", canonicalizeBrand(selectedCar?.brand) || "-"],
        ["Biển số", selectedCar?.license_plate || "-"],
        ["Ngày thuê", getRentalDays(selectedRental)],
        ["Thời gian thuê", `${selectedRental.start_date} → ${selectedRental.end_date}`],
        ["Giá thuê", getRentalTotalPrice(selectedRental, selectedCar)],
        ["Trạng thái", formatRentalStatus(getRentalDisplayStatus(selectedRental))],
      ]
    : [];

  if (selectedRental && String(selectedRental.status || "").toLowerCase() === "rejected") {
    selectedDetails.push([
      "Lý do từ chối",
      selectedRental.reject_reason ||
        "Yêu cầu thuê xe không được duyệt. Vui lòng liên hệ nhân viên để biết thêm chi tiết.",
      true,
    ]);
  }

  return (
    <div className="gf-page">
      <PageHeader />

      <main className="gf-main">
        <div className="gf-main-inner">
          <section className="gf-toolbar">
            <div className="gf-toolbar-left">
              <h2>Lịch sử thuê xe của bạn</h2>
              <p className="gf-muted">Xem trạng thái yêu cầu thuê xe và tiến trình xử lý.</p>
            </div>
            <div className="gf-toolbar-right">
              <Link to="/thue-xe-tu-lai" className="login-btn secondary">Xem xe khác</Link>
            </div>
          </section>

          {!customerId ? (
            <div className="empty-state">
              <h3>Bạn chưa có thông tin khách hàng.</h3>
              <p>Đăng ký hoặc đặt xe lần đầu để lưu lịch sử thuê và quản lý đơn hàng.</p>
              <Link to="/thue-xe-tu-lai" className="cta-button">Bắt đầu thuê xe</Link>
            </div>
          ) : loading ? (
            <div className="loading">Đang tải lịch sử...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : rentals.length === 0 ? (
            <div className="empty-state">
              <h3>Chưa có yêu cầu thuê xe.</h3>
              <p>Bạn có thể đặt xe và lịch sử sẽ được cập nhật ở đây.</p>
              <Link to="/thue-xe-tu-lai" className="cta-button">Đặt xe ngay</Link>
            </div>
          ) : (
            <div className="table-section">
              <div className="my-rentals-toolbar">
                <input
                  className="table-search-input my-rentals-search"
                  type="search"
                  value={rentalsSearch}
                  onChange={(event) => {
                    setRentalsSearch(event.target.value);
                    setRentalsPage(1);
                  }}
                  placeholder="Tìm theo mã, xe, ngày thuê..."
                />
              </div>
              <table className="my-rentals-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã</th>
                    <th>Xe</th>
                    <th>Thời gian thuê</th>
                    <th>Bắt đầu</th>
                    <th>Kết thúc</th>
                    <th>
                      <select
                        value={rentalsStatusFilter}
                        onChange={(event) => {
                          setRentalsStatusFilter(event.target.value);
                          setRentalsPage(1);
                        }}
                        className="header-filter-select my-rentals-status-filter"
                        aria-label="Lọc theo trạng thái"
                      >
                        <option value="">Trạng thái</option>
                        {rentalStatusOptions.map((status) => (
                          <option key={status} value={status}>{formatRentalStatus(status)}</option>
                        ))}
                      </select>
                    </th>
                    <th>Xem</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRentals.map((item, index) => (
                    <tr key={item.request_id}>
                      <td>{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                      <td>{getRentalCode(item)}</td>
                      <td>{item.car_name || `Xe #${item.car_id}`}</td>
                      <td>{getRentalDays(item)}</td>
                      <td>{item.start_date}</td>
                      <td>{item.end_date}</td>
                      <td>
                        <span className={`rental-status-pill ${getRentalStatusClass(getRentalDisplayStatus(item))}`}>
                          {formatRentalStatus(getRentalDisplayStatus(item))}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-icon-button"
                          type="button"
                          title="Xem chi tiết"
                          aria-label="Xem chi tiết"
                          onClick={() => setSelectedRental(item)}
                        >
                          <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M2.7 12s3.4-5.8 9.3-5.8S21.3 12 21.3 12s-3.4 5.8-9.3 5.8S2.7 12 2.7 12Z" />
                            <circle cx="12" cy="12" r="2.8" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pagedRentals.length === 0 ? (
                    <tr>
                      <td colSpan="8">Không tìm thấy yêu cầu thuê xe phù hợp.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              <div className="table-pagination">
                <span>
                  Hiển thị {filteredRentals.length ? (safePage - 1) * PAGE_SIZE + 1 : 0} - {Math.min(safePage * PAGE_SIZE, filteredRentals.length)} / {filteredRentals.length} yêu cầu
                </span>
                <div className="table-pagination-actions">
                  <button
                    className="action-button secondary"
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setRentalsPage((page) => Math.max(1, page - 1))}
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      className={`action-button secondary ${page === safePage ? "active" : ""}`}
                      type="button"
                      onClick={() => setRentalsPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="action-button secondary"
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setRentalsPage((page) => Math.min(totalPages, page + 1))}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedRental ? (
        <>
          <div className="modal-overlay" onClick={() => setSelectedRental(null)} />
          <div className="rental-detail-modal receipt-style">
            <button className="modal-close" type="button" onClick={() => setSelectedRental(null)}>×</button>
            {(() => {
              const car = getRentalCar(selectedRental);
              const displayStatus = getRentalDisplayStatus(selectedRental);
              const depositStatus = selectedRental.payments?.deposit?.status;
              const remainingStatus = selectedRental.payments?.remaining?.status;
              const rejectReason = getRejectReasonFromRental(selectedRental);
              const hasRejectReason = displayStatus === "rejected";
              return (
                <div className="rental-detail-receipt">
                  <section className="rental-receipt-block rental-receipt-heading">
                    <h3>Chi tiết đơn thuê</h3>
                    <strong>{selectedRental.car_name || car?.name || `Xe #${selectedRental.car_id}`}</strong>
                    <span>Mã yêu cầu: {getRentalCode(selectedRental)}</span>
                    {selectedRental.contract_id ? (
                      <span>Mã hợp đồng: HD{String(selectedRental.contract_id).padStart(3, "0")}</span>
                    ) : null}
                  </section>

                  <section className="rental-receipt-block rental-receipt-totals">
                    <div>
                      <span>Giá thuê:</span>
                      <strong>{getRentalTotalPrice(selectedRental, car)}</strong>
                    </div>
                    <div>
                      <span>Thời gian thuê:</span>
                      <strong>{selectedRental.start_date} → {selectedRental.end_date}</strong>
                    </div>
                    <div>
                      <span>Trạng thái:</span>
                      <strong>{formatRentalStatus(displayStatus)}</strong>
                    </div>
                    {hasRejectReason ? (
                      <div className="rental-receipt-reason">
                        <span>Lý do từ chối</span>
                        <strong>
                          {rejectReason ||
                            "Yêu cầu thuê xe không được duyệt. Vui lòng liên hệ nhân viên để biết thêm chi tiết."}
                        </strong>
                      </div>
                    ) : null}
                  </section>

                  <section className="rental-receipt-block rental-receipt-info">
                    <div className="rental-receipt-column">
                      <h4>Khách hàng</h4>
                      <div className="rental-receipt-line">
                        <span>Tên</span>
                        <strong>{customerInfo.name || "-"}</strong>
                      </div>
                      <div className="rental-receipt-line">
                        <span>Số điện thoại</span>
                        <strong>{customerInfo.phone || "-"}</strong>
                      </div>
                      <div className="rental-receipt-line">
                        <span>Email</span>
                        <strong>{customerInfo.email || customerInfo.username || "-"}</strong>
                      </div>
                    </div>
                    <div className="rental-receipt-column">
                      <h4>Thông tin thuê xe</h4>
                      <div className="rental-receipt-line">
                        <span>Tên xe</span>
                        <strong>{selectedRental.car_name || car?.name || `Xe #${selectedRental.car_id}`}</strong>
                      </div>
                      <div className="rental-receipt-line">
                        <span>Hãng xe</span>
                        <strong>{canonicalizeBrand(car?.brand) || "-"}</strong>
                      </div>
                      <div className="rental-receipt-line">
                        <span>Biển số</span>
                        <strong>{car?.license_plate || "-"}</strong>
                      </div>
                      <div className="rental-receipt-line">
                        <span>Địa điểm nhận xe</span>
                        <strong>{selectedRental.pickup_location || "-"}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="rental-receipt-block rental-receipt-payments">
                    <h4>Thanh toán</h4>
                    <div className="rental-receipt-payment">
                      <div className="rental-receipt-payment-main">
                        <span>{getRentalPaymentMarker(depositStatus)} Đặt cọc</span>
                        <strong>{formatRentalPaymentStatus(depositStatus)}</strong>
                      </div>
                    </div>
                    <div className="rental-receipt-payment">
                      <div className="rental-receipt-payment-main">
                        <span>{getRentalPaymentMarker(remainingStatus)} Còn lại khi nhận xe</span>
                        <strong>{formatRentalPaymentStatus(remainingStatus)}</strong>
                      </div>
                    </div>
                  </section>
                </div>
              );
            })()}
          </div>
        </>
      ) : null}
    </div>
  );
}
