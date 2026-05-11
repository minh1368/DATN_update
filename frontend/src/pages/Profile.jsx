import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

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

  useEffect(() => {
    // Lấy dữ liệu người dùng từ localStorage
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      try {
        const user = JSON.parse(savedUserData);
        setUserData(user);
        setEditData({
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || ''
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // Lấy lịch sử dụng thuê xe
    fetchUserRentals();
    
    setLoading(false);
  }, []);

  const fetchUserRentals = async () => {
    try {
      const savedUserData = localStorage.getItem('userData');
      if (savedUserData) {
        const user = JSON.parse(savedUserData);
        
        // Lấy rental requests của user này
        const response = await fetch('http://localhost:8000/rental_requests', {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': 'customer'
          }
        });
        
        if (response.ok) {
          const rentals = await response.json();
          // Lọc rental requests của user hiện tại (nếu có customer_id)
          setUserRentals(rentals.slice(0, 10)); // Giới hạn 10最近
        }
      }
    } catch (error) {
      console.error('Error fetching user rentals:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      // Ở đây bạn có thể gọi API để cập nhật thông tin user
      // Hiện tại chỉ cập nhật localStorage
      const updatedUser = {
        ...userData,
        ...editData
      };
      
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setEditMode(false);
      
      alert('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Cập nhật thông tin thất bại. Vui lòng thử lại.');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset về dữ liệu cũ
    if (userData) {
      setEditData({
        name: userData.name || '',
        phone: userData.phone || '',
        email: userData.email || '',
        address: userData.address || ''
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
                <h1>{userData.username}</h1>
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
