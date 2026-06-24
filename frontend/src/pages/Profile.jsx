import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStorage } from "../lib/auth.js";
import { canonicalizeBrand } from "../lib/carUtils.js";
import { notifyUser } from "../lib/toast.js";
import { carService, customerService, requestService } from "../services/dashboardService.js";
import { PasswordVisibilityIcon } from "../components/AppIcons.jsx";
import PageHeader from "../components/PageHeader.jsx";

function ProfileUserIcon() {
  return (
    <svg className="profile-avatar-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}

const PASSWORD_PLACEHOLDER = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
const getStoredPassword = () => localStorage.getItem("userPassword") || PASSWORD_PLACEHOLDER;

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [userRentals, setUserRentals] = useState([]);
  const [cars, setCars] = useState([]);
  const [selectedRental, setSelectedRental] = useState(null);
  const [rentalsPage, setRentalsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    password: getStoredPassword()
  });

  const mergeCustomerProfile = useCallback((customer) => {
    const profile = {
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      password: getStoredPassword()
    };

    setEditData(profile);
    setUserData((current) => {
      const merged = { ...(current || {}), ...customer };
      authStorage.setItem("userData", JSON.stringify(merged));
      return merged;
    });
    if (customer.customer_id) {
      authStorage.setItem("customerId", String(customer.customer_id));
    }
  }, []);

  const fetchCars = useCallback(async () => {
    try {
      const data = await carService.getAll();
      setCars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  }, []);

  const fetchCustomerByEmail = useCallback(async (email) => {
    try {
      const customer = await customerService.findByEmail(email).catch(() => null);
      if (!customer) return null;
      mergeCustomerProfile(customer);
      return customer;
    } catch (error) {
      console.error('Error fetching customer by email:', error);
      return null;
    }
  }, [mergeCustomerProfile]);

  const fetchCustomerProfile = useCallback(async (customerId, shouldMerge = true) => {
    try {
      const customer = await customerService.getById(customerId);
      if (shouldMerge) {
        mergeCustomerProfile(customer);
      }
      return customer;
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      return null;
    }
  }, [mergeCustomerProfile]);

  const fetchUserRentals = useCallback(async (customerId = authStorage.getItem('customerId')) => {
    try {
      if (!customerId) {
        setUserRentals([]);
        return;
      }

      const rentals = await requestService.getCustomerDetails(customerId);
      const sortedRentals = Array.isArray(rentals)
        ? [...rentals].sort((a, b) => {
          const dateDiff = new Date(b?.start_date || 0).getTime() - new Date(a?.start_date || 0).getTime();
          if (dateDiff !== 0) return dateDiff;
          return Number(b?.request_id || 0) - Number(a?.request_id || 0);
        })
        : [];
      setUserRentals(sortedRentals);
      setRentalsPage(1);
    } catch (error) {
      console.error('Error fetching user rentals:', error);
    }
  }, []);

  const loadProfileData = useCallback(async () => {
    const storedCustomerId = authStorage.getItem('customerId');
    const savedUserData = JSON.parse(authStorage.getItem('userData') || "{}");
    const userEmail = savedUserData.email || savedUserData.username;
    let customerId = storedCustomerId;

    if (customerId) {
      const customer = await fetchCustomerProfile(customerId, false);
      if (!customer || (userEmail?.includes("@") && customer.email !== userEmail)) {
        authStorage.removeItem('customerId');
        customerId = null;
      } else {
        mergeCustomerProfile(customer);
      }
    }

    if (!customerId && userEmail?.includes("@")) {
      const customer = await fetchCustomerByEmail(userEmail);
      customerId = customer?.customer_id ? String(customer.customer_id) : null;
    }

    await Promise.all([
      fetchUserRentals(customerId),
      fetchCars(),
    ]);
    setLoading(false);
  }, [fetchCars, fetchCustomerByEmail, fetchCustomerProfile, fetchUserRentals, mergeCustomerProfile]);

  useEffect(() => {
    const savedUserData = authStorage.getItem('userData');
    if (savedUserData) {
      try {
        const user = JSON.parse(savedUserData);
        const normalizedUser = {
          ...user,
          email: user.email || (user.username?.includes("@") ? user.username : ""),
        };
        setUserData(normalizedUser);
      setEditData({
        name: normalizedUser.name || '',
        phone: normalizedUser.phone || '',
        email: normalizedUser.email || '',
        address: normalizedUser.address || '',
        password: getStoredPassword()
      });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    loadProfileData();
  }, [loadProfileData]);

  const getRentalCar = (rental) => cars.find((car) => Number(car.car_id) === Number(rental?.car_id));

  const getRentalCode = (rental) => `YC${String(rental?.request_id || "-").padStart(3, "0")}`;

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
    const normalized = String(status || "").toLowerCase();
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
    const normalized = String(status || "").toLowerCase();
    if (["active", "approved", "completed"].includes(normalized)) return "status-approved";
    if (normalized === "ready_contract") return "status-ready";
    if (normalized === "rejected") return "status-rejected";
    return "status-pending";
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

  const RentalViewIcon = () => (
    <svg className="rental-view-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.7 12s3.4-5.8 9.3-5.8S21.3 12 21.3 12s-3.4 5.8-9.3 5.8S2.7 12 2.7 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      const submitData = { ...editData };
      const storedPw = getStoredPassword();
      if (submitData.password === storedPw || submitData.password === PASSWORD_PLACEHOLDER) {
        submitData.password = '';
      }

      const storedCustomerId = authStorage.getItem('customerId');
      if (!storedCustomerId) {
        const createdCustomer = await customerService.createPublic(submitData);
        mergeCustomerProfile(createdCustomer);
        if (submitData.password) {
          localStorage.setItem("userPassword", submitData.password);
        }
        setEditMode(false);
        setShowProfilePassword(false);
        notifyUser("Cập nhật thông tin thành công!", "success");
        return;
      }

      const role = String(userData?.role || "").toLowerCase();
      const updatedCustomer = role === "admin" || role === "staff"
        ? await customerService.update(storedCustomerId, submitData)
        : await customerService.updateProfile(storedCustomerId, submitData);
      setEditData({
        name: updatedCustomer.name || '',
        phone: updatedCustomer.phone || '',
        email: updatedCustomer.email || '',
        address: updatedCustomer.address || '',
        password: getStoredPassword()
      });
      const merged = { ...userData, ...updatedCustomer };
      setUserData(merged);
      authStorage.setItem("userData", JSON.stringify(merged));
      if (submitData.password) {
        localStorage.setItem("userPassword", submitData.password);
      }
      setEditMode(false);
      setShowProfilePassword(false);
      notifyUser("Cập nhật thông tin thành công!", "success");
    } catch (error) {
      console.error('Error updating profile:', error);
      notifyUser(error.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.', "error");
    }
  };

  const handleCancelEdit = async () => {
    setEditMode(false);
    setShowProfilePassword(false);
    const storedCustomerId = authStorage.getItem("customerId");
    if (storedCustomerId) {
      await fetchCustomerProfile(storedCustomerId);
      return;
    }
    if (userData) {
      setEditData({
        name: userData.name || "",
        phone: userData.phone || "",
        email: userData.email || "",
        address: userData.address || "",
        password: getStoredPassword(),
      });
    }
  };

  const rentalsPerPage = 10;
  const completedRentalsCount = userRentals.filter((rental) => (
    getRentalDisplayStatus(rental) === "completed"
  )).length;
  const activeRentalsCount = userRentals.filter((rental) => (
    getRentalDisplayStatus(rental) === "active"
  )).length;
  const totalRentalPages = Math.max(1, Math.ceil(userRentals.length / rentalsPerPage));
  const safeRentalsPage = Math.min(rentalsPage, totalRentalPages);
  const pagedRentals = userRentals.slice(
    (safeRentalsPage - 1) * rentalsPerPage,
    safeRentalsPage * rentalsPerPage
  );

  if (loading) {
    return (
      <div className="gf-page">
        <div className="gf-main">
          <div className="loading">Đang tải thông tin...</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="gf-page">
        <div className="gf-main">
          <div className="error-message">
            <h2>Không tìm thấy thông tin người dùng</h2>
            <p>Vui lòng đăng nhập lại.</p>
            <button className="cta-button" onClick={() => navigate('/')}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gf-page">
      <PageHeader />

      <main className="gf-main">
        <div className="gf-main-inner">
          <div className="profile-container">
            <div className="profile-header">
              <div className="profile-avatar">
                <ProfileUserIcon />
              </div>
              <div className="profile-info">
                <h1>{userData.name || userData.username}</h1>
                <p className="profile-role">
                  Vai trò: {userData.role === 'admin' ? 'Quản trị viên' :
                    userData.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                </p>
              </div>
            </div>

            {editMode ? (
              <>
                <div className="modal-overlay" onClick={handleCancelEdit} />
                <div className="profile-edit-modal">
                  <form className="profile-form profile-edit-card" onSubmit={handleUpdateProfile}>
                    <div className="profile-edit-modal-header">
                      <div>
                        <h3>Chỉnh sửa thông tin</h3>
                        <p>Cập nhật thông tin cá nhân.</p>
                      </div>
                      <button type="button" className="modal-close" onClick={handleCancelEdit}>×</button>
                    </div>
                    <div className="profile-form-grid">
                      <div className="form-group">
                        <label>Họ và tên</label>
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Số điện thoại</label>
                        <input
                          type="tel"
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Mật khẩu</label>
                        <div className="password-input-wrapper profile-password-wrapper">
                          <input
                            type={showProfilePassword ? "text" : "password"}
                            value={editData.password}
                            onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                            placeholder="Nhập mật khẩu mới"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowProfilePassword((current) => !current)}
                            aria-label={showProfilePassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            title={showProfilePassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          >
                            <PasswordVisibilityIcon visible={showProfilePassword} />
                          </button>
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label>Địa chỉ</label>
                        <input
                          type="text"
                          value={editData.address}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="profile-form-actions">
                      <button type="button" className="login-btn secondary" onClick={handleCancelEdit}>
                        Hủy
                      </button>
                      <button type="submit" className="cta-button">
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : null}

            <div className="profile-details">
                <div className="profile-overview-card">
                  <section className="profile-overview-section">
                    <div className="profile-overview-top">
                      <h3>Thông tin cá nhân</h3>
                      <button
                        className="profile-edit-btn"
                        onClick={() => setEditMode(true)}
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                    <div className="profile-overview-list">
                      <div>
                        <span>Họ tên</span>
                        <strong>{userData.name || "Chưa cập nhật"}</strong>
                      </div>
                      <div>
                        <span>Email</span>
                        <strong>{userData.email || "Chưa cập nhật"}</strong>
                      </div>
                      <div>
                        <span>SĐT</span>
                        <strong>{userData.phone || "Chưa cập nhật"}</strong>
                      </div>
                      <div>
                        <span>Địa chỉ</span>
                        <strong>{userData.address || "Chưa cập nhật"}</strong>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="profile-overview-card profile-stats-card">
                  <section className="profile-overview-stats" aria-label="Thống kê thuê xe">
                    <div>
                      <span>Tổng đơn thuê</span>
                      <strong>{userRentals.length}</strong>
                    </div>
                    <div>
                      <span>Đã hoàn thành</span>
                      <strong>{completedRentalsCount}</strong>
                    </div>
                    <div>
                      <span>Đang thuê</span>
                      <strong>{activeRentalsCount}</strong>
                    </div>
                  </section>
                </div>

                <div className="profile-overview-card">
                  <section className="profile-overview-section">
                    <h3>Lịch sử thuê gần đây</h3>
                    {userRentals.length > 0 ? (
                      <>
                        <div className="rentals-table-wrap">
                          <table className="rentals-table">
                            <thead>
                              <tr>
                                <th>STT</th>
                                <th>Xe</th>
                                <th>Thời gian thuê</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedRentals.map((rental, index) => {
                                const car = getRentalCar(rental);
                                const displayIndex = (safeRentalsPage - 1) * rentalsPerPage + index + 1;
                                return (
                                  <tr key={rental.request_id}>
                                    <td>{displayIndex}</td>
                                    <td>{rental.car_name || car?.name || `Xe #${rental.car_id}`}</td>
                                    <td>{rental.start_date} → {rental.end_date}</td>
                                    <td>
                                      <span className={`rental-status-pill ${getRentalStatusClass(getRentalDisplayStatus(rental))}`}>
                                        {formatRentalStatus(getRentalDisplayStatus(rental))}
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className="rental-view-button"
                                        title="Xem chi tiết"
                                        aria-label="Xem chi tiết"
                                        onClick={() => setSelectedRental({ ...rental, displayIndex })}
                                      >
                                        <RentalViewIcon />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {userRentals.length > rentalsPerPage ? (
                          <div className="table-pagination rentals-pagination">
                            <span>
                              Hiển thị {(safeRentalsPage - 1) * rentalsPerPage + 1}
                              {" - "}
                              {Math.min(safeRentalsPage * rentalsPerPage, userRentals.length)} / {userRentals.length} yêu cầu
                            </span>
                            <div className="table-pagination-actions">
                              <button
                                type="button"
                                className="action-button secondary"
                                disabled={safeRentalsPage <= 1}
                                onClick={() => setRentalsPage((page) => Math.max(1, page - 1))}
                              >
                                Trước
                              </button>
                              {(() => {
                                const getPaginationItems = (currentPage, totalPages) => {
                                  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
                                  if (currentPage <= 3) return [1, 2, 3, 4, "ellipsis", totalPages];
                                  if (currentPage >= totalPages - 2) return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                                  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
                                };
                                return getPaginationItems(safeRentalsPage, totalRentalPages).map((pageItem, index) => pageItem === "ellipsis" ? (
                                  <span key={`ellipsis-${index}`} className="table-page-ellipsis">...</span>
                                ) : (
                                  <button
                                    key={pageItem}
                                    type="button"
                                    className={`table-page-number ${pageItem === safeRentalsPage ? "active" : ""}`}
                                    onClick={() => setRentalsPage(pageItem)}
                                    aria-current={pageItem === safeRentalsPage ? "page" : undefined}
                                  >
                                    {pageItem}
                                  </button>
                                ));
                              })()}
                              <button
                                type="button"
                                className="action-button"
                                disabled={safeRentalsPage >= totalRentalPages}
                                onClick={() => setRentalsPage((page) => Math.min(totalRentalPages, page + 1))}
                              >
                                Sau
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="no-rentals">Chưa có lịch sử thuê xe.</p>
                    )}
                  </section>
                </div>
            </div>
          </div>
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
                        <strong>{userData.name || "-"}</strong>
                      </div>
                      <div className="rental-receipt-line">
                        <span>Số điện thoại</span>
                        <strong>{userData.phone || "-"}</strong>
                      </div>
                      <div className="rental-receipt-line">
                        <span>Email</span>
                        <strong>{userData.email || "-"}</strong>
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
