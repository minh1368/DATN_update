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

    await fetchUserRentals(customerId);
    setLoading(false);
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
      setUserRentals(Array.isArray(rentals) ? rentals.slice(0, 10) : []);
    } catch (error) {
      console.error('Error fetching user rentals:', error);
    }
  };

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
            <span className="logo-icon">PDC</span>
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
                    <div className="rentals-list">
                      {userRentals.map((rental) => (
                        <div key={rental.request_id} className="rental-item">
                          <div className="rental-info">
                            <div className="rental-id">Yêu cầu #{rental.request_id}</div>
                            <div className="rental-dates">
                              {rental.start_date} → {rental.end_date}
                            </div>
                            <div className="rental-status">
                              Trạng thái: <span className={`status-${rental.status}`}>
                                {rental.status === 'pending' ? 'Chờ duyệt' :
                                 rental.status === 'approved' ? 'Đã duyệt' :
                                 rental.status === 'rejected' ? 'Bị từ chối' : rental.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-rentals">Chưa có lịch sử dụng thuê xe.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
