import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { notifyUser } from "../lib/toast.js";

const authStorage = window.sessionStorage;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getStoredRole() {
  const fromStorage = authStorage.getItem("userRole");
  if (fromStorage) return fromStorage;
  try {
    const user = JSON.parse(authStorage.getItem("userData") || "{}");
    return user.role || "customer";
  } catch {
    return "customer";
  }
}

function buildCustomerHeaders(includeJson = false) {
  const role = getStoredRole();
  const headers = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (role === "admin" || role === "staff") {
    headers["X-User-Role"] = role;
  }
  return headers;
}

function getCustomerUpdateUrl(customerId) {
  const role = getStoredRole();
  const base = `${API_BASE_URL}/customers/${customerId}`;
  if (role === "admin" || role === "staff") return base;
  return `${base}/profile`;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [userRentals, setUserRentals] = useState([]);
  const [cars, setCars] = useState([]);
  const [selectedRental, setSelectedRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const mergeCustomerProfile = (customer) => {
    const profile = {
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
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
  };

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
          address: normalizedUser.address || ''
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    loadProfileData();
  }, []);

  const loadProfileData = async () => {
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

    if (!customerId) {
      if (userEmail?.includes("@")) {
        const customer = await fetchCustomerByEmail(userEmail);
        customerId = customer?.customer_id ? String(customer.customer_id) : null;
      }
    }

    await Promise.all([
      fetchUserRentals(customerId),
      fetchCars(),
    ]);
    setLoading(false);
  };

  const fetchCars = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars`);
      if (!response.ok) return;
      const data = await response.json();
      setCars(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const fetchCustomerByEmail = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/by-email/${encodeURIComponent(email)}`);
      if (!response.ok) return null;
      const customer = await response.json();
      mergeCustomerProfile(customer);
      return customer;
    } catch (error) {
      console.error('Error fetching customer by email:', error);
      return null;
    }
  };

  const fetchCustomerProfile = async (customerId, shouldMerge = true) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}`);
      if (!response.ok) {
        throw new Error('Không thể tải thông tin khách hàng');
      }
      const customer = await response.json();
      if (shouldMerge) {
        mergeCustomerProfile(customer);
      }
      return customer;
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      return null;
    }
  };

  const fetchUserRentals = async (customerId = authStorage.getItem('customerId')) => {
    try {
      if (!customerId) {
        setUserRentals([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/rental_requests/customer/${customerId}`);
      if (!response.ok) {
        throw new Error('Không thể tải lịch sử thuê xe');
      }

      const rentals = await response.json();
      const sortedRentals = Array.isArray(rentals)
        ? [...rentals].sort((a, b) => Number(a?.request_id || 0) - Number(b?.request_id || 0))
        : [];
      setUserRentals(sortedRentals);
    } catch (error) {
      console.error('Error fetching user rentals:', error);
    }
  };

  const getRentalCar = (rental) => cars.find((car) => Number(car.car_id) === Number(rental?.car_id));

  const formatRentalStatus = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "pending") return "Chờ duyệt";
    if (normalized === "approved") return "Đã duyệt";
    if (normalized === "rejected") return "Bị từ chối";
    if (normalized === "completed") return "Hoàn thành";
    return status || "-";
  };

  const getRentalTotalPrice = (rental, car) => {
    if (!rental || !car?.price_per_day) return "-";
    const start = new Date(rental.start_date);
    const end = new Date(rental.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";
    const days = Math.max(1, Math.floor((end - start) / 86400000) + 1);
    return `${Number(days * Number(car.price_per_day || 0)).toLocaleString("vi-VN")} VND`;
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
      const storedCustomerId = authStorage.getItem('customerId');
      if (!storedCustomerId) {
        const response = await fetch(`${API_BASE_URL}/customers/public`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || 'Tạo thông tin khách hàng thất bại');
        }

        const createdCustomer = await response.json();
        mergeCustomerProfile(createdCustomer);
        setEditMode(false);
        notifyUser("Cập nhật thông tin thành công!", "success");
        return;
      }

      const response = await fetch(getCustomerUpdateUrl(storedCustomerId), {
        method: "PUT",
        headers: buildCustomerHeaders(true),
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Cập nhật thông tin thất bại');
      }

      const updatedCustomer = await response.json();
      setEditData({
        name: updatedCustomer.name || '',
        phone: updatedCustomer.phone || '',
        email: updatedCustomer.email || '',
        address: updatedCustomer.address || ''
      });
      const merged = { ...userData, ...updatedCustomer };
      setUserData(merged);
      authStorage.setItem("userData", JSON.stringify(merged));
      setEditMode(false);
      notifyUser("Cập nhật thông tin thành công!", "success");
    } catch (error) {
      console.error('Error updating profile:', error);
      notifyUser(error.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.', "error");
    }
  };

  const handleCancelEdit = async () => {
    setEditMode(false);
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
      });
    }
  };

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
      <header className="gf-header">
        <div className="gf-header-inner">
          <button className="gf-brand" onClick={() => navigate('/')}>
            <span className="logo-icon"><img src="/image/brand/logo.png" alt="Phương Đông" /></span>
            <span className="gf-brand-text">Thuê xe</span>
          </button>
          <nav className="gf-nav">
            <button className="gf-nav-link" onClick={() => navigate('/')}>
              Trang chủ
            </button>
            <span className="gf-nav-sep">/</span>
            <span className="gf-nav-current">Thông tin cá nhân</span>
          </nav>
        </div>
      </header>

      <main className="gf-main">
        <div className="gf-main-inner">
          <div className="profile-container">
            <div className="profile-header">
              <div className="profile-avatar">
                <span>👤</span>
              </div>
              <div className="profile-info">
                <h1>{userData.name || userData.username}</h1>
                <p className="profile-role">
                  Vai trò: {userData.role === 'admin' ? 'Quản trị viên' : 
                           userData.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                </p>
              </div>
              <button 
                className="profile-edit-btn" 
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Hủy' : 'Chỉnh sửa'}
              </button>
            </div>

            {editMode ? (
              <form className="profile-form" onSubmit={handleUpdateProfile}>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>Họ và tên</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      value={editData.address}
                      onChange={(e) => setEditData({...editData, address: e.target.value})}
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
            ) : (
              <div className="profile-details">
                <div className="detail-section">
                  <h3>Thông tin cá nhân</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Họ và tên:</label>
                      <span>{userData.name || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Số điện thoại:</label>
                      <span>{userData.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{userData.email || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Địa chỉ:</label>
                      <span>{userData.address || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Lịch sử dụng thuê xe</h3>
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
                            <th>Xem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userRentals.map((rental, index) => {
                            const car = getRentalCar(rental);
                            return (
                              <tr key={rental.request_id}>
                                <td>{index + 1}</td>
                                <td>{car?.name || `Xe #${rental.car_id}`}</td>
                                <td>{rental.start_date} → {rental.end_date}</td>
                                <td>
                                  <span className={`rental-status-chip status-${rental.status}`}>
                                    {formatRentalStatus(rental.status)}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="rental-view-button"
                                    title="Xem chi tiết"
                                    aria-label="Xem chi tiết"
                                    onClick={() => setSelectedRental({ ...rental, displayIndex: index + 1 })}
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
                    </>
                  ) : (
                    <p className="no-rentals">Chưa có lịch sử dụng thuê xe.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {selectedRental ? (
        <>
          <div className="modal-overlay" onClick={() => setSelectedRental(null)} />
          <div className="rental-detail-modal">
            <button className="modal-close" type="button" onClick={() => setSelectedRental(null)}>
              ×
            </button>
            <h3>Chi tiết yêu cầu thuê xe</h3>
            <div className="rental-detail-grid">
              {(() => {
                const car = getRentalCar(selectedRental);
                const details = [
                  ["H\u1ECD v\u00E0 t\u00EAn", userData.name || "-"],
                  ["Email", userData.email || "-"],
                  ["S\u1ED1 \u0111i\u1EC7n tho\u1EA1i", userData.phone || "-"],
                  ["\u0110\u1ECBa \u0111i\u1EC3m nh\u1EADn xe", selectedRental.pickup_location || "-"],
                  ["Xe", car?.name || `Xe #${selectedRental.car_id}`],
                  ["H\u00E3ng xe", car?.brand || "-"],
                  ["Bi\u1EC3n s\u1ED1", car?.license_plate || "-"],
                  ["Th\u1EDDi gian thu\u00EA", `${selectedRental.start_date} \u2192 ${selectedRental.end_date}`],
                  ["Gi\u00E1 thu\u00EA", getRentalTotalPrice(selectedRental, car)],
                  ["Tr\u1EA1ng th\u00E1i", formatRentalStatus(selectedRental.status)],
                ];
                return details.map(([label, value]) => (
                  <div className="rental-detail-item" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ));
              })()}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
