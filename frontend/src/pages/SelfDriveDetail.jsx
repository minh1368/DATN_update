import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppFooter from "../components/AppFooter.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useCars } from "../context/CarsContext.jsx";
import { authStorage } from "../lib/auth.js";
import { fallbackCars } from "../lib/carData.js";
import { canonicalizeBrand, carIdFromSlug, carNameFromSlug, getCarImageUrl, selfDriveDetailPath, slugify } from "../lib/carUtils.js";
import { getReadableErrorMessage, notifyUser } from "../lib/toast.js";
import { carService, customerService, requestService, userService } from "../services/dashboardService.js";

const DEPOSIT_RATE = 0.2;
const MIN_DEPOSIT_AMOUNT = 300000;
const VAT_RATE = 0.08;
const DEPOSIT_BANK_CODE = "MB";
const DEPOSIT_ACCOUNT_NO = "0030920046789";
const DEPOSIT_ACCOUNT_NAME = "PHAM CONG MINH";

function calculateDepositAmount(totalAmount) {
  const total = Number(totalAmount || 0);
  if (total <= 0) return 0;
  return Math.min(total, Math.max(MIN_DEPOSIT_AMOUNT, Math.round(total * DEPOSIT_RATE)));
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
}

function formatDateValue(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatCountdown(seconds) {
  const safeSeconds = Math.max(Number(seconds || 0), 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
}

function formatRequestCode(requestId) {
  const normalized = Number(requestId);
  return Number.isFinite(normalized) && normalized > 0
    ? `YC${String(normalized).padStart(3, "0")}`
    : "YC---";
}

function getDepositQrUrl(amount, transferNote = "Dat coc tien thue xe") {
  const params = new URLSearchParams({
    amount: String(Math.round(Number(amount || 0))),
    addInfo: transferNote,
    accountName: DEPOSIT_ACCOUNT_NAME,
  });
  return `https://img.vietqr.io/image/${DEPOSIT_BANK_CODE}-${DEPOSIT_ACCOUNT_NO}-compact2.png?${params.toString()}`;
}

function PasswordVisibilityIcon({ visible }) {
  return visible ? (
    <svg className="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 5.18A10.56 10.56 0 0 1 12 5c6.25 0 9.75 7 9.75 7a17.16 17.16 0 0 1-2.8 3.62" />
      <path d="M6.61 6.61C3.76 8.42 2.25 12 2.25 12s3.5 7 9.75 7a9.87 9.87 0 0 0 4.34-.99" />
    </svg>
  );
}

function DetailSpecIcon({ type }) {
  const icons = {
    color: (
      <>
        <circle cx="9" cy="9" r="4" />
        <circle cx="15" cy="9" r="4" />
        <circle cx="12" cy="15" r="4" />
        <circle className="gf-spec-icon-dot" cx="12" cy="12" r="1.5" />
      </>
    ),
    seats: (
      <>
        <path d="M8.2 10.4a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" />
        <path d="M15.8 10.4a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" />
        <path d="M3.8 19c.4-3 2.1-5 4.4-5s4 2 4.4 5" />
        <path d="M11.4 19c.4-3 2.1-5 4.4-5s4 2 4.4 5" />
      </>
    ),
    type: (
      <>
        <path d="M13 2.8 5.8 13.1h5.2L10 21.2l7.9-11.4h-5.5L13 2.8Z" />
      </>
    ),
    transmission: (
      <>
        <circle cx="7" cy="7" r="2.4" />
        <circle cx="17" cy="7" r="2.4" />
        <circle cx="7" cy="17" r="2.4" />
        <circle cx="17" cy="17" r="2.4" />
        <path d="M7 9.4v5.2M9.4 7h5.2M17 9.4v5.2" />
      </>
    ),
    year: (
      <>
        <rect x="4.5" y="5.5" width="15" height="14" rx="2.3" />
        <path d="M8 3.5v4M16 3.5v4M4.5 10h15" />
        <path d="M8 13h2M12 13h2M16 13h.2M8 16h2M12 16h2M16 16h.2" />
      </>
    ),
    status: (
      <>
        <path d="M7.2 12.4 10.5 15.7 17.3 8.9" />
        <path d="M12 3.6 5.2 6.2v5.5c0 4.2 2.8 7.2 6.8 8.7 4-1.5 6.8-4.5 6.8-8.7V6.2L12 3.6Z" />
      </>
    ),
  };

  return (
    <span className={`gf-spec-icon gf-spec-icon-${type}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        {icons[type]}
      </svg>
    </span>
  );
}

function findFallbackCarById(carId) {
  const id = Number(carId);
  if (!Number.isFinite(id)) return null;
  return fallbackCars.find((c) => Number(c.car_id) === id) || null;
}

export default function SelfDriveDetailPage() {
  const params = useParams();
  const carId = useMemo(() => carIdFromSlug(params.carSlug), [params.carSlug]);
  const carNameSlug = useMemo(() => carNameFromSlug(params.carSlug), [params.carSlug]);
  const { displayCars } = useCars();
  const [car, setCar] = useState(() => {
    if (carId) return findFallbackCarById(carId);
    return fallbackCars.find((c) => slugify(c?.name) === carNameSlug) || null;
  });
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const todayValue = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const sanitizeDateString = (value) => {
    if (typeof value !== "string") return "";
    const cleaned = value.replace(/[^\d-]/g, "");
    const parts = cleaned.split("-");
    if (parts.length === 1) return parts[0].slice(0, 4);
    if (parts.length === 2) return `${parts[0].slice(0, 4)}-${parts[1].slice(0, 2)}`;
    return `${parts[0].slice(0, 4)}-${parts[1].slice(0, 2)}-${parts[2].slice(0, 2)}`.slice(0, 10);
  };
  const [bookingData, setBookingData] = useState({
    start_date: todayValue,
    end_date: '',
    pickup_location: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [showDepositTransfer, setShowDepositTransfer] = useState(false);
  const [depositTransferData, setDepositTransferData] = useState(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositCountdown, setDepositCountdown] = useState(15 * 60);

  useEffect(() => {
    if (!carId) {
      const foundByName = displayCars.find((c) => slugify(c?.name) === carNameSlug);
      if (foundByName) {
        setCar(foundByName);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    carService.getById(carId)
      .then((data) => {
        if (data && typeof data === "object") setCar(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carId, carNameSlug, displayCars]);

  useEffect(() => {
    if (!showDepositTransfer) return undefined;

    setDepositCountdown(15 * 60);
    const timer = window.setInterval(() => {
      setDepositCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showDepositTransfer, depositTransferData?.bookingCode]);

  const title = car?.name || "Chi tiết xe";
  const brand = canonicalizeBrand(car?.brand) || "-";
  const price = Number(car?.price_per_day || 0).toLocaleString();
  const unitPrice = Number(car?.price_per_day || 0);
  const isCarRented = String(car?.status || "").toLowerCase() === "rented";
  const rentalDays = useMemo(() => {
    if (!bookingData.start_date || !bookingData.end_date) return 0;
    const start = new Date(bookingData.start_date);
    const end = new Date(bookingData.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    return Math.floor((end - start) / 86400000) + 1;
  }, [bookingData.start_date, bookingData.end_date]);
  const rentalFee = rentalDays * unitPrice;
  const vatAmount = Math.round(rentalFee * VAT_RATE);
  const totalRentalPrice = rentalFee + vatAmount;
  const depositAmount = calculateDepositAmount(totalRentalPrice);
  const remainingPayment = Math.max(totalRentalPrice - depositAmount, 0);

  const otherCars = useMemo(() => {
    const id = Number(car?.car_id);
    return displayCars.filter((c) => Number(c.car_id) !== id).slice(0, 4);
  }, [car, displayCars]);

  const getStoredUser = () => {
    try {
      return JSON.parse(authStorage.getItem("userData") || "{}");
    } catch {
      return {};
    }
  };
  const bookingUser = getStoredUser();

  const fetchCustomerByEmail = async (email) => {
    if (!email) return null;
    return customerService.findByEmail(email).catch(() => null);
  };

  const handleBookClick = () => {
    if (!authStorage.getItem("userData")) {
      setLoginError("");
      setAuthMode("login");
      setShowLoginForm(true);
      return;
    }
    setShowBookingForm(true);
  };

  const handleDetailLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");

    try {
      const user = await userService.login(loginData);
      const customer = user.role === "customer" ? await fetchCustomerByEmail(user.username) : null;
      const userProfile = customer
        ? { ...user, ...customer }
        : { ...user, email: user.username?.includes("@") ? user.username : "" };

      authStorage.setItem("loggedInUser", userProfile.name || user.username);
      authStorage.setItem("userRole", user.role);
      authStorage.setItem("userData", JSON.stringify(userProfile));
      if (user.token) authStorage.setItem("authToken", user.token);
      if (customer?.customer_id) {
        authStorage.setItem("customerId", String(customer.customer_id));
      }
      localStorage.setItem("userPassword", loginData.password);

      setShowLoginForm(false);
      setLoginData({ username: "", password: "" });
      setShowBookingForm(true);
      notifyUser("Đăng nhập thành công", "success");
    } catch (error) {
      setLoginError(getReadableErrorMessage(error, "Đăng nhập thất bại"));
    }
  };

  const handleDetailRegisterSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");

    if (!registerData.fullName || !registerData.email || !registerData.phone || !registerData.password) {
      setLoginError("Vui lòng nhập đầy đủ họ và tên, email, số điện thoại và mật khẩu.");
      return;
    }

    try {
      await userService.register({
        username: registerData.email,
        password: registerData.password,
      });

      await customerService.createPublic({
        name: registerData.fullName,
        phone: registerData.phone,
        email: registerData.email,
        password: registerData.password,
        address: registerData.address || "",
      });

      setAuthMode("login");
      setLoginData({ username: registerData.email, password: "" });
      setRegisterData({ fullName: "", email: "", phone: "", address: "", password: "" });
      notifyUser("Đăng ký thành công. Vui lòng đăng nhập để đặt xe.", "success");
    } catch (error) {
      setLoginError(getReadableErrorMessage(error, "Đăng ký thất bại"));
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    const customerName = String(bookingUser.name || bookingUser.fullName || "").trim();
    const customerPhone = String(bookingUser.phone || "").trim();
    const customerEmail = String(bookingUser.email || bookingUser.username || "").trim();
    const pickupLocation = String(bookingData.pickup_location || "").trim();

    if (!customerName || !customerPhone || !customerEmail || !pickupLocation || !bookingData.start_date || !bookingData.end_date) {
      setBookingError('Vui lòng điền đầy đủ tất cả thông tin bắt buộc.');
      return;
    }
    if (bookingData.start_date < todayValue) {
      setBookingError('Không được chọn ngày bắt đầu trước ngày hiện tại.');
      return;
    }
    if (bookingData.end_date < bookingData.start_date) {
      setBookingError('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.');
      return;
    }

    try {
      let customerId = authStorage.getItem('customerId');
      if (!customerId) {
        const userData = getStoredUser();
        const customer = await fetchCustomerByEmail(userData.email || userData.username);
        if (customer?.customer_id) {
          customerId = customer.customer_id;
          authStorage.setItem('customerId', String(customerId));
        }
      }

      if (!customerId) {
        throw new Error('Tài khoản chưa có thông tin khách hàng. Vui lòng cập nhật thông tin cá nhân trước khi đặt xe.');
      }

      const rentalRequest = await requestService.createCustomerRequest({
        customer_id: Number(customerId),
        car_id: Number(car.car_id),
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        pickup_location: pickupLocation,
      });
      const requestCode = formatRequestCode(rentalRequest?.request_id);

      setDepositTransferData({
        requestId: rentalRequest?.request_id,
        bookingCode: requestCode,
        customerId: Number(customerId),
        customerName,
        customerPhone,
        customerEmail,
        carId: car.car_id,
        carName: car?.name || "-",
        carBrand: canonicalizeBrand(car?.brand) || "-",
        carPlate: car?.license_plate || "-",
        carImage: getCarImageUrl(car, fallbackCars),
        startDate: bookingData.start_date,
        endDate: bookingData.end_date,
        pickupLocation,
        rentalFee,
        vatAmount,
        depositAmount,
        totalRentalPrice,
        remainingPayment,
        rentalDays,
      });
      setShowBookingForm(false);
      setShowDepositTransfer(true);
    } catch (error) {
      setBookingError(error.message || 'Đặt xe thất bại. Vui lòng thử lại.');
    }
  };

  const handleDepositPaidClick = async () => {
    if (!depositTransferData || isSubmittingDeposit) return;

    setIsSubmittingDeposit(true);
    try {
      setShowDepositTransfer(false);
      setDepositTransferData(null);
      setBookingData({
        start_date: todayValue,
        end_date: '',
        pickup_location: ''
      });
      notifyUser("Đã gửi yêu cầu thuê xe. Chúng tôi sẽ kiểm tra thanh toán và phản hồi sớm nhất.", "success");
    } catch (error) {
      notifyUser(getReadableErrorMessage(error, "Không thể gửi yêu cầu thuê xe"), "error");
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleCopyDepositText = async (value, label = "Thông tin") => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      notifyUser(`Đã sao chép ${label}.`, "success");
    } catch {
      notifyUser("Không thể sao chép tự động, vui lòng copy thủ công.", "error");
    }
  };

  const depositTransferNote = depositTransferData?.bookingCode
    ? `Dat coc ${depositTransferData.bookingCode}`
    : "Dat coc tien thue xe";

  return (
    <div className="gf-page gf-detail-page">
      <PageHeader />

      <main className="gf-main">
        <div className="gf-main-inner">
          <section className="gf-detail-hero">
            <div className="gf-detail-hero-left">
              <div className="gf-detail-media gf-card-media-img">
                <img src={getCarImageUrl(car, fallbackCars)} alt={title} />
              </div>
            </div>

            <div className="gf-detail-hero-right">
              <h1 className="gf-detail-title">{title}</h1>
              <p className="gf-muted">{brand}</p>

              <div className="gf-detail-price">
                <div className="gf-detail-price-row">
                  <div>
                    <div className="gf-price">{price} VND / ngày</div>
                  </div>
                  <button 
                    className="cta-button gf-detail-book" 
                    disabled={isCarRented}
                    onClick={handleBookClick}
                  >
                    {isCarRented ? "Xe đang cho thuê" : "Đặt xe"}
                  </button>
                </div>
                <div className="gf-detail-price-note">
                  Giá đã bao gồm bảo hiểm cơ bản, hỗ trợ 24/7 và giao nhận nhanh chóng.
                </div>
              </div>

              <div className="gf-detail-specgrid">
                <div className="gf-spec">
                  <DetailSpecIcon type="color" />
                  <div>
                    <div className="gf-muted">Màu</div>
                    <strong>{car?.color || "-"}</strong>
                  </div>
                </div>
                <div className="gf-spec">
                  <DetailSpecIcon type="seats" />
                  <div>
                    <div className="gf-muted">Chỗ</div>
                    <strong>{car?.seats ? `${car.seats} chỗ` : "-"}</strong>
                  </div>
                </div>
                <div className="gf-spec">
                  <DetailSpecIcon type="type" />
                  <div>
                    <div className="gf-muted">Loại xe</div>
                    <strong>{car?.fuel_type || "-"}</strong>
                  </div>
                </div>
                <div className="gf-spec">
                  <DetailSpecIcon type="transmission" />
                  <div>
                    <div className="gf-muted">Hộp số</div>
                    <strong>{car?.transmission || "-"}</strong>
                  </div>
                </div>
                <div className="gf-spec">
                  <DetailSpecIcon type="year" />
                  <div>
                    <div className="gf-muted">Năm sản xuất</div>
                    <strong>{car?.year || "-"}</strong>
                  </div>
                </div>
                <div className="gf-spec">
                  <DetailSpecIcon type="status" />
                  <div>
                    <div className="gf-muted">Trạng thái</div>
                    <strong>{car?.status || "-"}</strong>
                  </div>
                </div>
              </div>

              <p className="gf-detail-desc">{car?.description || "Xe phù hợp di chuyển hàng ngày, đi tỉnh, du lịch gia đình."}</p>
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
            </div>

            <div className="gf-detail-section">
              <h2>Điều kiện thuê xe</h2>
              <ul className="gf-list">
                <li>CCCD/CMND còn hiệu lực</li>
                <li>Bằng lái B1/B2 (tuỳ loại xe)</li>
                <li>Đặt cọc giữ chỗ theo quy định (chuyển khoản)</li>
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
                <li>Khách hàng thanh toán giữ chỗ sau khi xác nhận thông tin đặt xe</li>
                <li>Khách hàng kiểm tra tình trạng xe, giấy tờ và lịch thuê trước khi thanh toán</li>
                <li>Hỗ trợ thanh toán linh hoạt tại điểm nhận xe theo hướng dẫn của nhân viên</li>
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
                <Link to="/thue-xe-tu-lai" className="login-btn secondary gf-no-underline">
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
                    <p className="gf-muted">{canonicalizeBrand(c.brand) || "Hãng xe"}</p>
                  </div>
                  <div className="gf-card-media gf-card-media-img">
                    <img src={getCarImageUrl(c, fallbackCars)} alt={c.name} loading="lazy" />
                  </div>
                  <div className="gf-card-bottom gf-card-bottom-simple">
                    <div className="gf-price-row">
                      <div className="gf-price">{Number(c.price_per_day || 0).toLocaleString()} VND / ngày</div>
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

      {showLoginForm && (
        <div className="modal-overlay" onClick={() => setShowLoginForm(false)}>
          <div className="detail-login-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowLoginForm(false)}>×</button>
            <div className="auth-card">
              <div className="auth-panel">
                <div className="auth-header">
                  <h3>{authMode === "login" ? "Đăng nhập" : "Đăng ký"}</h3>
                  <p>{authMode === "login" ? "Nhập tài khoản để tiếp tục." : "Tạo tài khoản mới để đặt xe."}</p>
                </div>
                <div className="auth-switch">
                  <button className={`auth-toggle ${authMode === "login" ? "active" : ""}`} type="button" onClick={() => {
                    setLoginError("");
                    setAuthMode("login");
                  }}>Đăng nhập</button>
                  <button className={`auth-toggle ${authMode === "register" ? "active" : ""}`} type="button" onClick={() => {
                    setLoginError("");
                    setAuthMode("register");
                  }}>
                    Đăng ký
                  </button>
                </div>
                {authMode === "login" ? (
                  <form className="auth-form" onSubmit={handleDetailLoginSubmit}>
                    <label>
                      Email
                      <input
                        type="email"
                        placeholder="Nhập email"
                        value={loginData.username}
                        onChange={(event) => setLoginData({ ...loginData, username: event.target.value })}
                        required
                      />
                    </label>
                    <label className="password-field">
                      Mật khẩu
                      <div className="password-input-wrapper">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu"
                          value={loginData.password}
                          onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          aria-label={showLoginPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          <PasswordVisibilityIcon visible={showLoginPassword} />
                        </button>
                      </div>
                    </label>
                    {loginError ? <div className="booking-error">{loginError}</div> : null}
                    <button type="submit" className="cta-button auth-submit">Đăng nhập</button>
                    <button type="button" className="auth-secondary" onClick={() => notifyUser("Chức năng quên mật khẩu chưa có.", "info")}>Quên mật khẩu</button>
                    <div className="auth-footer">
                      <span>Bạn chưa có tài khoản?</span>
                      <button type="button" className="auth-link" onClick={() => {
                        setLoginError("");
                        setAuthMode("register");
                      }}>
                        Đăng ký tài khoản
                      </button>
                    </div>
                  </form>
                ) : (
                  <form className="auth-form" onSubmit={handleDetailRegisterSubmit}>
                    <label>
                      Họ và tên*
                      <input
                        type="text"
                        placeholder="Nhập họ và tên"
                        value={registerData.fullName}
                        onChange={(event) => setRegisterData({ ...registerData, fullName: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Email*
                      <input
                        type="email"
                        placeholder="Nhập email"
                        value={registerData.email}
                        onChange={(event) => setRegisterData({ ...registerData, email: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Số điện thoại*
                      <input
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        value={registerData.phone}
                        onChange={(event) => setRegisterData({ ...registerData, phone: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Địa chỉ
                      <input
                        type="text"
                        placeholder="Nhập địa chỉ"
                        value={registerData.address}
                        onChange={(event) => setRegisterData({ ...registerData, address: event.target.value })}
                      />
                    </label>
                    <label className="password-field">
                      Mật khẩu*
                      <div className="password-input-wrapper">
                        <input
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu"
                          value={registerData.password}
                          onChange={(event) => setRegisterData({ ...registerData, password: event.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowRegisterPassword((prev) => !prev)}
                          aria-label={showRegisterPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          <PasswordVisibilityIcon visible={showRegisterPassword} />
                        </button>
                      </div>
                    </label>
                    {loginError ? <div className="booking-error">{loginError}</div> : null}
                    <button type="submit" className="cta-button auth-submit">Đăng ký</button>
                    <div className="auth-footer">
                      <span>Đã có tài khoản?</span>
                      <button type="button" className="auth-link" onClick={() => {
                        setLoginError("");
                        setAuthMode("login");
                      }}>
                        Đăng nhập
                      </button>
                    </div>
                  </form>
                )}
              </div>
              <div className="auth-image" />
            </div>
          </div>
        </div>
      )}

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
            
            <form className="booking-form" onSubmit={handleBookingSubmit} noValidate>
              <div className="booking-form-grid">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    value={bookingUser.name || bookingUser.fullName || ""}
                    readOnly
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="text"
                    value={bookingUser.phone || ""}
                    readOnly
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={bookingUser.email || bookingUser.username || ""}
                    readOnly
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Địa điểm nhận xe *</label>
                  <input
                    type="text"
                    value={bookingData.pickup_location}
                    onChange={(e) => setBookingData({...bookingData, pickup_location: e.target.value})}
                    placeholder="Ví dụ: Sân bay Tân Sơn Nhất"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ngày bắt đầu thuê *</label>
                  <input
                    type="date"
                    min={todayValue}
                    value={bookingData.start_date}
                    onChange={(e) => setBookingData({...bookingData, start_date: sanitizeDateString(e.target.value)})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Ngày kết thúc thuê *</label>
                  <input
                    type="date"
                    min={bookingData.start_date || todayValue}
                    value={bookingData.end_date}
                    onChange={(e) => setBookingData({...bookingData, end_date: sanitizeDateString(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div className="booking-summary">
                <span>Tên xe</span>
                <strong>{car?.name || "-"}</strong>
                <span>Đơn giá</span>
                <strong>{unitPrice.toLocaleString()} VND / ngày</strong>
                <span>Số ngày thuê</span>
                <strong>{rentalDays || "-"}{rentalDays ? " ngày" : ""}</strong>
                <span>Phí thuê xe</span>
                <strong>{rentalFee ? `${rentalFee.toLocaleString()} VND` : "-"}</strong>
                <span>Thuế VAT (8%)</span>
                <strong>{vatAmount ? `${vatAmount.toLocaleString()} VND` : "-"}</strong>
                <span>Tổng cộng tiền thuê</span>
                <strong>{totalRentalPrice ? `${totalRentalPrice.toLocaleString()} VND` : "-"}</strong>
                <span>Thanh toán giữ chỗ</span>
                <strong>{depositAmount ? `${depositAmount.toLocaleString()} VND` : "-"}</strong>
                <span>Thanh toán khi nhận xe</span>
                <strong>{totalRentalPrice ? `${remainingPayment.toLocaleString()} VND` : "-"}</strong>
              </div>
              <div className="booking-deposit-note">
                <strong>Hướng dẫn thanh toán giữ chỗ</strong>
                <span>
                  Sau khi bấm Xác nhận, bạn sẽ thấy mã QR chuyển khoản tiền thanh toán giữ chỗ.
                </span>
                <span>
                  Khi chuyển khoản xong, bấm Đã thanh toán để chúng tôi kiểm tra và phản hồi yêu cầu thuê xe.
                </span>
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
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDepositTransfer && depositTransferData ? (
        <div className="modal-overlay" onClick={() => setShowDepositTransfer(false)}>
          <div className="deposit-transfer-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowDepositTransfer(false)}
              aria-label="Đóng"
            >
              ×
            </button>
            <div className="deposit-transfer-layout">
              <section className="deposit-payment-panel">
                <div className="deposit-hold-card">
                  <span>Thanh toán phí giữ chỗ</span>
                  <strong>{formatMoney(depositTransferData.depositAmount)}</strong>
                  <p>Thời gian giữ chỗ còn lại</p>
                  <div className="deposit-countdown">{formatCountdown(depositCountdown)}</div>
                  <small>
                    Mã yêu cầu của bạn <b>{depositTransferData.bookingCode}</b>
                  </small>
                  <div className="deposit-mini-summary">
                    <div>
                      <span>Loại xe:</span>
                      <b>{depositTransferData.carName}</b>
                    </div>
                    <div>
                      <span>Ngày nhận trả xe:</span>
                      <b>{formatDateValue(depositTransferData.startDate)} tới {formatDateValue(depositTransferData.endDate)}</b>
                    </div>
                  </div>
                </div>

                <div className="deposit-qr-section">
                  <h4>Thanh toán bằng mã QR</h4>
                  <p>Quét mã QR hoặc chụp màn hình QRCode để thanh toán bằng ứng dụng ngân hàng.</p>
                  <div className="deposit-qr-card">
                    <img
                      src={getDepositQrUrl(depositTransferData.depositAmount, depositTransferNote)}
                      alt="Mã QR chuyển khoản đặt cọc"
                    />
                  </div>
                  <div className="deposit-or">hoặc</div>
                  <h4>Chuyển khoản qua ngân hàng</h4>
                  <p className="deposit-warning">Vui lòng nhập chính xác cú pháp chuyển khoản để hệ thống ghi nhận thông tin đơn hàng.</p>
                  <div className="deposit-bank-card">
                    <div>
                      <span>Chủ tài khoản:</span>
                      <strong>{DEPOSIT_ACCOUNT_NAME}</strong>
                    </div>
                    <div>
                      <span>Ngân hàng:</span>
                      <strong>MBBank ({DEPOSIT_BANK_CODE})</strong>
                    </div>
                    <div className="deposit-copy-row">
                      <span>Số tài khoản:</span>
                      <strong>{DEPOSIT_ACCOUNT_NO}</strong>
                      <button type="button" onClick={() => handleCopyDepositText(DEPOSIT_ACCOUNT_NO, "số tài khoản")}>
                        Sao chép
                      </button>
                    </div>
                    <div className="deposit-copy-row">
                      <span>Cú pháp CK:</span>
                      <strong>{depositTransferNote}</strong>
                      <button type="button" onClick={() => handleCopyDepositText(depositTransferNote, "nội dung chuyển khoản")}>
                        Sao chép
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="deposit-order-panel">
                <h3>Thông tin đơn thuê</h3>
                <img className="deposit-order-image" src={depositTransferData.carImage} alt={depositTransferData.carName} />
                <div className="deposit-order-info">
                  <div>
                    <span>Mã yêu cầu</span>
                    <strong>{depositTransferData.bookingCode}</strong>
                  </div>
                  <div>
                    <span>Tên khách thuê</span>
                    <strong>{depositTransferData.customerName}</strong>
                  </div>
                  <div>
                    <span>Số điện thoại</span>
                    <strong>{depositTransferData.customerPhone}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{depositTransferData.customerEmail}</strong>
                  </div>
                  <div>
                    <span>Địa điểm nhận xe</span>
                    <strong>{depositTransferData.pickupLocation}</strong>
                  </div>
                  <div>
                    <span>Ngày nhận</span>
                    <strong>{formatDateValue(depositTransferData.startDate)}</strong>
                  </div>
                  <div>
                    <span>Ngày trả</span>
                    <strong>{formatDateValue(depositTransferData.endDate)}</strong>
                  </div>
                  <div>
                    <span>Hãng xe</span>
                    <strong>{depositTransferData.carBrand}</strong>
                  </div>
                  <div>
                    <span>Xe</span>
                    <strong>{depositTransferData.carName}</strong>
                  </div>
                  <div>
                    <span>Biển số</span>
                    <strong>{depositTransferData.carPlate}</strong>
                  </div>
                  <div>
                    <span>Phí thuê xe</span>
                    <strong>{formatMoney(depositTransferData.rentalFee)}</strong>
                  </div>
                  <div>
                    <span>Thuế VAT (8%)</span>
                    <strong>{formatMoney(depositTransferData.vatAmount)}</strong>
                  </div>
                  <div className="deposit-total-row">
                    <span>Tổng cộng tiền thuê xe</span>
                    <strong>{formatMoney(depositTransferData.totalRentalPrice)}</strong>
                    <small>Bạn sẽ thanh toán phần còn lại khi nhận xe.</small>
                  </div>
                </div>

                <div className="deposit-steps">
                  <h4>Các bước thanh toán</h4>
                  <div className="deposit-step">
                    <span>1</span>
                    <div>
                      <strong>Thanh toán giữ chỗ</strong>
                      <small>Tiền này để xác nhận nhu cầu thuê xe và giữ xe.</small>
                    </div>
                    <b>{formatMoney(depositTransferData.depositAmount)}</b>
                  </div>
                  <div className="deposit-step">
                    <span>2</span>
                    <div>
                      <strong>Thanh toán khi nhận xe</strong>
                      <small>Phần tiền thuê còn lại thanh toán trực tiếp khi nhận xe.</small>
                    </div>
                    <b>{formatMoney(depositTransferData.remainingPayment)}</b>
                  </div>
                </div>
              </section>
            </div>
            <div className="deposit-transfer-actions">
              <button
                type="button"
                className="login-btn secondary"
                onClick={() => {
                  setShowDepositTransfer(false);
                  setShowBookingForm(true);
                }}
              >
                Quay lại
              </button>
              <button type="button" className="cta-button" onClick={handleDepositPaidClick} disabled={isSubmittingDeposit}>
                {isSubmittingDeposit ? "Đang gửi..." : "Đã thanh toán"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <AppFooter />
    </div>
  );
}
