import { useEffect, useRef, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import { Link } from "react-router-dom";
import SelfDrivePage from "./pages/SelfDrive.jsx";
import SelfDriveDetailPage from "./pages/SelfDriveDetail.jsx";
import ProfilePage from "./pages/Profile.jsx";
import { selfDriveDetailPath } from "./lib/carUtils.js";
import { useCars } from "./context/CarsContext.jsx";
import { getCarImageUrl } from "./lib/carUtils.js";
import { fallbackCars } from "./lib/carData.js";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/thue-xe-tu-lai" element={<SelfDrivePage />} />
      <Route path="/thue-xe-tu-lai/:carSlug" element={<SelfDriveDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

function Home() {
  const [role, setRole] = useState("customer");
  const [activeTab, setActiveTab] = useState("summary");
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const { cars: fetchedCars, displayCars: sharedDisplayCars, refresh: refreshCarsContext } = useCars();
  const [cars, setCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [newCar, setNewCar] = useState({
    name: "",
    brand: "",
    license_plate: "",
    price_per_day: "",
    status: "available",
    color: "",
    seats: "",
    fuel_type: "",
    transmission: "",
    year: "",
    description: "",
  });
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "staff",
  });
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", password: "" });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedRentalType, setSelectedRentalType] = useState("tự lái");
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const navigate = useNavigate();
  const carGridRef = useRef(null);
  const servicesRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const pointerIdRef = useRef(null);
  // Drag handlers temporarily unused to allow Link navigation
  // (will be re-enabled with proper click/drag detection later)
  const handleDragStart = () => {};
  const handleDragEnd = () => {};
  const handleDragMove = () => {};

  const handleGridPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerIdRef.current = event.pointerId;
    isDraggingRef.current = false;
    dragStartXRef.current = event.clientX;
    scrollStartRef.current = carGridRef.current?.scrollLeft || 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGridPointerMove = (event) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const deltaX = event.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 6) {
      event.preventDefault();
      isDraggingRef.current = true;
      const grid = carGridRef.current;
      if (grid) {
        grid.classList.add("dragging");
        grid.scrollLeft = scrollStartRef.current - deltaX;
      }
    }
  };

  const handleGridPointerUp = (event) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const grid = carGridRef.current;
    if (grid) {
      grid.classList.remove("dragging");
    }
    pointerIdRef.current = null;
    window.requestAnimationFrame(() => {
      isDraggingRef.current = false;
    });
    if (event.currentTarget?.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleCarLinkClick = (event) => {
    if (isDraggingRef.current) {
      event.preventDefault();
    }
  };

  const handleSelectRentalType = (type) => {
    setSelectedRentalType(type);
    if (type === "tự lái") {
      navigate("/thue-xe-tu-lai");
    } else {
      servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };


  const displayCars = role === "admin" || role === "staff" ? cars : sharedDisplayCars;

  const getCarCategory = (car) => (car.fuel_type ? car.fuel_type.toUpperCase() : "E-SUV");
  const getCarSeats = (car) => (car.seats ? `${car.seats} chỗ` : "4 chỗ");
  const getCarTransmission = (car) => (car.transmission ? car.transmission : "Tự động");
  const getCarSubtitle = (car) => `${car.brand || "Xe chất"}`;

  const headers = {
    "X-User-Role": role,
    "Content-Type": "application/json",
  };

  const refreshData = () => {
    setStatsError(null);

    if (role === "admin" || role === "staff") {
      // Lấy dữ liệu thống kê
      fetch("http://localhost:8000/reports/summary", { headers })
        .then((response) => response.json())
        .then((data) => setStats(data))
        .catch(() => setStatsError("Không thể tải dữ liệu thống kê"));

      // Lấy danh sách xe với role admin/staff để đảm bảo thấy tất cả xe
      fetch("http://localhost:8000/cars", { headers })
        .then((response) => response.json())
        .then((data) => setCars(Array.isArray(data) ? data : []))
        .catch(() => setCars([]));

      fetch("http://localhost:8000/customers", { headers })
        .then((response) => response.json())
        .then((data) => setCustomers(data))
        .catch(() => {});

      fetch("http://localhost:8000/rental_requests", { headers })
        .then((response) => response.json())
        .then((data) => setRequests(data))
        .catch(() => {});

      fetch("http://localhost:8000/contracts", { headers })
        .then((response) => response.json())
        .then((data) => setContracts(data))
        .catch(() => {});

      fetch("http://localhost:8000/payments", { headers })
        .then((response) => response.json())
        .then((data) => setPayments(data))
        .catch(() => {});

      fetch("http://localhost:8000/users", { headers })
        .then((response) => (response.ok ? response.json() : []))
        .then((data) => setUsers(data))
        .catch(() => {});
    } else {
      // Customer: dùng CarsContext để lấy xe
      refreshCarsContext();
      setStats(null);
      setCustomers([]);
      setRequests([]);
      setContracts([]);
      setPayments([]);
      setUsers([]);
    }
  };

  useEffect(() => {
    // Kiểm tra localStorage khi load trang
    const savedUser = localStorage.getItem('loggedInUser');
    const savedRole = localStorage.getItem('userRole');
    const savedUserData = localStorage.getItem('userData');
    
    if (savedUser && savedRole && savedUserData) {
      try {
        const userData = JSON.parse(savedUserData);
        setLoggedInUser(userData.username);
        setRole(userData.role);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Xóa dữ liệu lỗi
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
      }
    }
    
    refreshData();
  }, [role]);

  useEffect(() => {
    // Chỉ đồng bộ cars từ context khi role là customer
    if (role === "customer") {
      setCars(fetchedCars);
    }
  }, [fetchedCars, role]);

  // Đóng user dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLoginClick = () => {
    setShowLoginForm(true);
    setAuthMode("login");
  };

  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
  };

  const handleCloseAuth = () => {
    setShowLoginForm(false);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setRole("customer");
    setSelectedCar(null);
    setShowLoginForm(false);
    
    // Xóa khỏi localStorage
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    
    refreshData();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      alert("Vui lòng nhập tài khoản và mật khẩu.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Đăng nhập thất bại");
      }
      const user = await response.json();
      setLoggedInUser(user.username);
      setRole(user.role);
      
      // Lưu vào localStorage
      localStorage.setItem('loggedInUser', user.username);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userData', JSON.stringify(user));
      
      setShowLoginForm(false);
      setLoginData({ username: "", password: "" });
    } catch (error) {
      console.error(error);
      alert(error.message || "Đăng nhập thất bại");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password) {
      alert("Vui lòng nhập tài khoản và mật khẩu để đăng ký.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Đăng ký thất bại");
      }
      alert("Đăng ký thành công. Vui lòng đăng nhập.");
      setAuthMode("login");
      setLoginData({ username: registerData.username, password: "" });
      setRegisterData({ username: "", password: "" });
    } catch (error) {
      console.error(error);
      alert(error.message || "Đăng ký thất bại");
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("http://localhost:8000/reports/export-csv", { headers });
      if (!response.ok) {
        throw new Error("Không thể xuất CSV");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "payments_report.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Không thể xuất CSV. Vui lòng thử lại.");
    }
  };

  const handleJsonPost = async (url, data) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || response.statusText || "Lỗi tạo mới");
      }
      await response.json().catch(() => null);
      refreshData();
    } catch (error) {
      console.error(error);
      alert(error.message || "Tạo mới thất bại");
    }
  };

  const handleCreateCar = async (e) => {
    e.preventDefault();
    const body = {
      ...newCar,
      price_per_day: Number(newCar.price_per_day) || 0,
      seats: newCar.seats ? Number(newCar.seats) : null,
      year: newCar.year ? Number(newCar.year) : null,
    };
    await handleJsonPost("http://localhost:8000/cars", body);
    setNewCar({
      name: "",
      brand: "",
      license_plate: "",
      price_per_day: "",
      status: "available",
      color: "",
      seats: "",
      fuel_type: "",
      transmission: "",
      year: "",
      description: "",
    });
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    await handleJsonPost("http://localhost:8000/customers", newCustomer);
    setNewCustomer({ name: "", phone: "", email: "", address: "" });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    await handleJsonPost("http://localhost:8000/users", newUser);
    setNewUser({ username: "", password: "", role: "staff" });
  };

  const handleAction = async (url, method = "PUT") => {
    // Debug: kiểm tra URL và method
    console.log("handleAction called with:", { url, method, role });
    
    // Nếu là DELETE, hỏi xác nhận
    if (method === "DELETE") {
      const confirmDelete = confirm("Bạn có chắc chắn muốn xóa xe này không?");
      if (!confirmDelete) {
        return;
      }
    }
    
    try {
      console.log("Sending request to:", url, "with method:", method, "headers:", headers);
      
      const response = await fetch(url, { 
        method, 
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { detail: response.statusText };
        }
        
        const errorMessage = errorData?.detail || response.statusText || "Lỗi hành động";
        console.log("Error data:", errorData);
        
        // Hiển thị lỗi cụ thể hơn
        if (response.status === 403) {
          alert("Bạn không có quyền thực hiện hành động này. Chỉ admin mới có thể xóa xe.");
        } else if (response.status === 400 && errorMessage.includes("rented")) {
          alert("Không thể xóa xe đang được thuê.");
        } else if (response.status === 404) {
          alert("Không tìm thấy xe để xóa.");
        } else {
          alert(`Lỗi ${response.status}: ${errorMessage}`);
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json().catch(() => null);
      console.log("Response data:", responseData);
      refreshData();
      alert("Thao tác thành công!");
    } catch (error) {
      console.error("Error in handleAction:", error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("Lỗi kết nối đến server. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.");
      } else {
        alert("Lỗi: " + error.message);
      }
    }
  };

  const renderTabContent = () => {
    if (activeTab === "summary") {
      return (
        <div className="table-section">
          <h3>Tổng quan hệ thống</h3>
          {stats ? (
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>Tổng doanh thu</h3>
                <p>{stats.total_revenue.toLocaleString()} VND</p>
              </div>
              <div className="dashboard-card">
                <h3>Tổng hợp đồng</h3>
                <p>{stats.total_contracts}</p>
              </div>
              <div className="dashboard-card">
                <h3>Tổng số xe</h3>
                <p>{stats.total_cars}</p>
              </div>
              <div className="dashboard-card">
                <h3>Xe đang thuê</h3>
                <p>{stats.cars_rented}</p>
              </div>
              <div className="dashboard-card dashboard-full-width">
                <h3>Tỷ lệ sử dụng</h3>
                <p>{(stats.usage_rate * 100).toFixed(1)}%</p>
              </div>
            </div>
          ) : (
            <p>Đang tải dữ liệu tổng quan...</p>
          )}
        </div>
      );
    }

    if (activeTab === "cars") {
      return (
        <div className="table-section">
          <h3>Danh sách xe</h3>
          <form className="entity-form" onSubmit={handleCreateCar}>
            <div className="form-grid">
              <label>
                Tên xe
                <input value={newCar.name} onChange={(e) => setNewCar({ ...newCar, name: e.target.value })} required />
              </label>
              <label>
                Hãng
                <input value={newCar.brand} onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })} required />
              </label>
              <label>
                Biển số
                <input value={newCar.license_plate} onChange={(e) => setNewCar({ ...newCar, license_plate: e.target.value })} required />
              </label>
              <label>
                Giá/ngày
                <input type="number" value={newCar.price_per_day} onChange={(e) => setNewCar({ ...newCar, price_per_day: e.target.value })} required />
              </label>
              <label>
                Trạng thái
                <select value={newCar.status} onChange={(e) => setNewCar({ ...newCar, status: e.target.value })}>
                  <option value="available">available</option>
                  <option value="rented">rented</option>
                </select>
              </label>
              <label>
                Màu sắc
                <input value={newCar.color} onChange={(e) => setNewCar({ ...newCar, color: e.target.value })} />
              </label>
              <label>
                Chỗ ngồi
                <input type="number" value={newCar.seats} onChange={(e) => setNewCar({ ...newCar, seats: e.target.value })} />
              </label>
              <label>
                Nhiên liệu
                <input value={newCar.fuel_type} onChange={(e) => setNewCar({ ...newCar, fuel_type: e.target.value })} />
              </label>
              <label>
                Hộp số
                <input value={newCar.transmission} onChange={(e) => setNewCar({ ...newCar, transmission: e.target.value })} />
              </label>
              <label>
                Năm sản xuất
                <input type="number" value={newCar.year} onChange={(e) => setNewCar({ ...newCar, year: e.target.value })} />
              </label>
              <label className="full-width">
                Mô tả
                <textarea value={newCar.description} onChange={(e) => setNewCar({ ...newCar, description: e.target.value })} rows="2" />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="cta-button">Thêm xe mới</button>
            </div>
          </form>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Hãng</th>
                <th>Biển số</th>
                <th>Giá/ngày</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.car_id}>
                  <td>{car.car_id}</td>
                  <td>{car.name}</td>
                  <td>{car.brand}</td>
                  <td>{car.license_plate}</td>
                  <td>{car.price_per_day}</td>
                  <td>{car.status}</td>
                  <td>
                    <button 
                      className="action-button secondary" 
                      onClick={() => {
                        console.log("Delete button clicked for car:", car.car_id);
                        handleAction(`http://localhost:8000/cars/${car.car_id}`, "DELETE");
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "customers") {
      return (
        <div className="table-section">
          <h3>Danh sách khách hàng</h3>
          <form className="entity-form" onSubmit={handleCreateCustomer}>
            <div className="form-grid">
              <label>
                Tên
                <input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
              </label>
              <label>
                Số điện thoại
                <input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} required />
              </label>
              <label>
                Email
                <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
              </label>
              <label className="full-width">
                Địa chỉ
                <input value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="cta-button">Thêm khách hàng</button>
            </div>
          </form>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Điện thoại</th>
                <th>Email</th>
                <th>Địa chỉ</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customer_id}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || "-"}</td>
                  <td>{customer.address || "-"}</td>
                  <td>
                    <button className="action-button secondary" onClick={() => handleAction(`http://localhost:8000/customers/${customer.customer_id}`, "DELETE")}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "requests") {
      return (
        <div className="table-section">
          <h3>Danh sách yêu cầu</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>ID khách</th>
                <th>ID xe</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.request_id}>
                  <td>{req.request_id}</td>
                  <td>{req.customer_id}</td>
                  <td>{req.car_id}</td>
                  <td>{req.start_date}</td>
                  <td>{req.end_date}</td>
                  <td>{req.status}</td>
                  <td>
                    {req.status === "pending" ? (
                      <div className="action-buttons">
                        <button className="action-button" onClick={() => handleAction(`http://localhost:8000/rental_requests/${req.request_id}/approve`)}>
                          Duyệt
                        </button>
                        <button className="action-button secondary" onClick={() => handleAction(`http://localhost:8000/rental_requests/${req.request_id}/reject`)}>
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <span>Không hành động</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "contracts") {
      return (
        <div className="table-section">
          <h3>Danh sách hợp đồng</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>ID yêu cầu</th>
                <th>ID khách</th>
                <th>ID xe</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.contract_id}>
                  <td>{contract.contract_id}</td>
                  <td>{contract.request_id}</td>
                  <td>{contract.customer_id}</td>
                  <td>{contract.car_id}</td>
                  <td>{contract.start_date}</td>
                  <td>{contract.end_date}</td>
                  <td>{contract.total_price}</td>
                  <td>{contract.status}</td>
                  <td>
                    {contract.status === "pending" ? (
                      <button className="action-button" onClick={() => handleAction(`http://localhost:8000/contracts/${contract.contract_id}/approve`)}>
                        Duyệt
                      </button>
                    ) : contract.status === "approved" ? (
                      <button className="action-button secondary" onClick={() => handleAction(`http://localhost:8000/contracts/${contract.contract_id}/return`)}>
                        Trả xe
                      </button>
                    ) : (
                      <span>Hoàn thành</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "payments") {
      return (
        <div className="table-section">
          <h3>Danh sách thanh toán</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>ID hợp đồng</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.payment_id}>
                  <td>{payment.payment_id}</td>
                  <td>{payment.contract_id}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.method}</td>
                  <td>{payment.status}</td>
                  <td>
                    {payment.status === "unpaid" ? (
                      <button className="action-button" onClick={() => handleAction(`http://localhost:8000/payments/${payment.payment_id}/pay`)}>
                        Thanh toán
                      </button>
                    ) : (
                      <span>Đã thanh toán</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "users") {
      return (
        <div className="table-section">
          <h3>Danh sách người dùng</h3>
          <form className="entity-form" onSubmit={handleCreateUser}>
            <div className="form-grid">
              <label>
                Username
                <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
              </label>
              <label>
                Password
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
              </label>
              <label>
                Role
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="staff">staff</option>
                  <option value="admin">admin</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="cta-button">Tạo người dùng</button>
            </div>
          </form>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  const renderCustomerView = () => (
    <section className="customer-view">
      <div className="customer-view-header">
        <h2>{loggedInUser ? "Khám phá mẫu xe của chúng tôi" : "Xem mẫu xe cho thuê"}</h2>
        <p>
          {loggedInUser
            ? "Chọn xe, xem thông tin chi tiết và liên hệ để đặt thuê."
            : "Duyệt qua các mẫu xe sẵn có ngay cả khi bạn chưa đăng nhập."}
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
          <Link
            key={car.car_id}
            className="car-card car-card-link"
            to={selfDriveDetailPath(car)}
            onClick={handleCarLinkClick}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
          >
            <div className="car-card-top">
              <span className="car-card-tag">Miễn phí sạc</span>
              <span className="car-card-badge">{getCarCategory(car)}</span>
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
              <span className="car-card-button" role="button">
                Xem chi tiết
              </span>
            </div>
            <div className="car-card-specs">
              <div>
                <span>🪑</span>
                <strong>{getCarSeats(car)}</strong>
              </div>
              <div>
                <span>⚙️</span>
                <strong>{getCarTransmission(car)}</strong>
              </div>
              <div>
                <span>📦</span>
                <strong>{car.color || "-"}</strong>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="view-all-cars-wrapper">
        <Link to="/thue-xe-tu-lai" className="cta-button view-all-cars-button">
          Xem tất cả các xe
        </Link>
      </div>
    </section>
  );

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-icon">PDC</span>
            <div className="logo-text">
              <p className="logo-main">Dịch vụ cho thuê xe linh hoạt</p>
            </div>
          </div>

          <nav className="nav">
            <button className="nav-item">Dashboard</button>
            <button
              className={`nav-item service-button ${showServiceOptions ? "active" : ""}`}
              onClick={() => setShowServiceOptions((prev) => !prev)}
            >
              Dịch vụ
            </button>
            <button className="nav-item">Giới thiệu</button>
            <button className="nav-item">Tin tức</button>
          </nav>

          <div className="login-controls">
            {loggedInUser ? (
              <div className="user-menu-container">
                <button 
                  className="user-avatar-btn" 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    <span>👤</span>
                  </div>
                  <span className="user-name">{loggedInUser}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-info">
                        <div className="user-avatar-large">👤</div>
                        <div>
                          <div className="user-display-name">{loggedInUser}</div>
                          <div className="user-role">Vai trò: {role === 'admin' ? 'Quản trị viên' : role === 'staff' ? 'Nhân viên' : 'Khách hàng'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="user-dropdown-menu">
                      <button className="dropdown-item" onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}>
                        <span>👤</span>
                        Thông tin cá nhân
                      </button>
                      <button className="dropdown-item" onClick={() => {
                        if (role === 'admin' || role === 'staff') {
                          navigate('/admin');
                        } else {
                          navigate('/my-rentals');
                        }
                        setShowUserMenu(false);
                      }}>
                        <span>📋</span>
                        {role === 'admin' || role === 'staff' ? 'Quản lý' : 'Lịch sử dụng'}
                      </button>
                      <button className="dropdown-item" onClick={() => {
                        setShowUserMenu(false);
                      }}>
                        <span>⚙️</span>
                        Cài đặt
                      </button>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <span>🚪</span>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="login-btn" onClick={handleLoginClick}>Đăng nhập</button>
                {showLoginForm && (
                  <>
                    <div className="modal-overlay" onClick={handleCloseAuth} />
                    <div className="login-modal">
                      <button type="button" className="modal-close" onClick={handleCloseAuth}>×</button>
                      <div className="auth-card">
                        <div className="auth-panel">
                          <div className="auth-header">
                            <h3>{authMode === "login" ? "Đăng nhập" : "Đăng ký"}</h3>
                            <p>{authMode === "login" ? "Nhập tài khoản để tiếp tục." : "Tạo tài khoản mới để bắt đầu."}</p>
                          </div>
                          <div className="auth-switch">
                            <button className={`auth-toggle ${authMode === "login" ? "active" : ""}`} type="button" onClick={() => handleAuthModeChange("login")}>Đăng nhập</button>
                            <button className={`auth-toggle ${authMode === "register" ? "active" : ""}`} type="button" onClick={() => handleAuthModeChange("register")}>Đăng ký</button>
                          </div>
                          {authMode === "login" ? (
                            <form className="auth-form" onSubmit={handleLoginSubmit}>
                              <label>
                                Email hoặc tài khoản
                                <input
                                  type="text"
                                  placeholder="Nhập email hoặc tài khoản"
                                  value={loginData.username}
                                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                  required
                                />
                              </label>
                              <label>
                                Mật khẩu
                                <input
                                  type="password"
                                  placeholder="Nhập mật khẩu"
                                  value={loginData.password}
                                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                  required
                                />
                              </label>
                              <button type="submit" className="cta-button auth-submit">Đăng nhập</button>
                              <button type="button" className="auth-secondary" onClick={() => alert("Chức năng quên mật khẩu chưa có.")}>Quên mật khẩu</button>
                              <div className="auth-footer">
                                <span>Bạn chưa có tài khoản?</span>
                                <button type="button" className="auth-link" onClick={() => handleAuthModeChange("register")}>Đăng ký tài khoản</button>
                              </div>
                            </form>
                          ) : (
                            <form className="auth-form" onSubmit={handleRegisterSubmit}>
                              <label>
                                Tài khoản
                                <input
                                  type="text"
                                  placeholder="Nhập tài khoản"
                                  value={registerData.username}
                                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                  required
                                />
                              </label>
                              <label>
                                Mật khẩu
                                <input
                                  type="password"
                                  placeholder="Nhập mật khẩu"
                                  value={registerData.password}
                                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                  required
                                />
                              </label>
                              <button type="submit" className="cta-button auth-submit">Đăng ký</button>
                              <div className="auth-footer">
                                <span>Đã có tài khoản?</span>
                                <button type="button" className="auth-link" onClick={() => handleAuthModeChange("login")}>Đăng nhập</button>
                              </div>
                            </form>
                          )}
                        </div>
                        <div className="auth-image" />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {showServiceOptions && (
          <section className="top-service-bar">
            <div className="service-toggle">
              <button
                type="button"
                className={`service-option ${selectedRentalType === "tự lái" ? "active" : ""}`}
                onClick={() => handleSelectRentalType("tự lái")}
              >
                Thuê xe tự lái
              </button>
              <button
                type="button"
                className={`service-option ${selectedRentalType === "có lái" ? "active" : ""}`}
                onClick={() => handleSelectRentalType("có lái")}
              >
                Thuê xe có lái
              </button>
            </div>
          </section>
        )}
      </header>

      {/* HERO SECTION - FULL VIEWPORT */}
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Đáp ứng mọi nhu cầu thuê xe
          </h1>

          <p className="hero-subtitle">
            Cung cấp dịch vụ thuê xe{" "}
            {selectedRentalType === "tự lái" ? "tự lái" : "có lái"},
            phục vụ mọi nhu cầu di chuyển của bạn
          </p>

          <button
            className="cta-button"
            type="button"
            onClick={() => {
              if (selectedRentalType === "tự lái")
                navigate("/thue-xe-tu-lai");
              else
                servicesRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
            }}
          >
            {selectedRentalType === "tự lái"
              ? "Bắt đầu thuê xe tự lái"
              : "Bắt đầu thuê xe có lái"}
          </button>
        </div>
      </section>

      {/* DASHBOARD SECTION */}
      {role === "admin" ? (
        <section className="dashboard">
          <div className="dashboard-container">
            <h2 className="section-title">Bảng điều khiển quản lý</h2>
            <div className="dashboard-actions-row">
              <div className="dashboard-role">Role hiện tại: <strong>{role}</strong></div>
              <button className="cta-button" type="button" onClick={handleExport}>
                Export CSV
              </button>
            </div>
            {statsError ? (
              <p className="dashboard-error">{statsError}</p>
            ) : stats ? (
              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <h3>Tổng doanh thu</h3>
                  <p>{stats.total_revenue.toLocaleString()} VND</p>
                </div>
                <div className="dashboard-card">
                  <h3>Tổng hợp đồng</h3>
                  <p>{stats.total_contracts}</p>
                </div>
                <div className="dashboard-card">
                  <h3>Tổng số xe</h3>
                  <p>{stats.total_cars}</p>
                </div>
                <div className="dashboard-card">
                  <h3>Xe đang thuê</h3>
                  <p>{stats.cars_rented}</p>
                </div>
                <div className="dashboard-card dashboard-full-width">
                  <h3>Tỷ lệ sử dụng</h3>
                  <p>{(stats.usage_rate * 100).toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <p>Đang tải dữ liệu báo cáo...</p>
            )}

            <div className="dashboard-tabs">
              {[
                { key: "summary", label: "Tổng quan" },
                { key: "cars", label: "Xe" },
                { key: "customers", label: "Khách hàng" },
                { key: "requests", label: "Yêu cầu" },
                { key: "contracts", label: "Hợp đồng" },
                { key: "payments", label: "Thanh toán" },
                { key: "users", label: "Người dùng" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`dashboard-tab ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="dashboard-table">{renderTabContent()}</div>
          </div>
        </section>
      ) : (
        renderCustomerView()
      )}

      {/* SERVICES SECTION */}
      <section className="services" ref={servicesRef}>
        <div className="services-container">
          <h2 className="section-title">Dịch vụ của chúng tôi</h2>
          <div className="services-grid">
            <div className={`service-card ${selectedRentalType === "tự lái" ? "active" : ""}`}>
              <div className="service-icon">🚗</div>
              <h3>Thuê xe tự lái</h3>
              <p>Đa dạng loại xe, giá cả phải chăng, hỗ trợ 24/7</p>
            </div>
            <div className={`service-card ${selectedRentalType === "có lái" ? "active" : ""}`}>
              <div className="service-icon">👨‍💼</div>
              <h3>Thuê xe có tài xế</h3>
              <p>Tài xế chuyên nghiệp, an toàn và thoải mái</p>
            </div>
            <div className="service-card">
              <div className="service-icon">💳</div>
              <h3>Thanh toán linh hoạt</h3>
              <p>Nhiều hình thức thanh toán, không giữ giấy tờ</p>
            </div>
            <div className="service-card">
              <div className="service-icon">⚡</div>
              <h3>Xe điện hiện đại</h3>
              <p>Công nghệ tiên tiến, thân thiện với môi trường</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className="why-choose">
        <div className="why-choose-container">
          <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
          <div className="why-choose-grid">
            <div className="why-item">
              <h3>✓ Giá cả cạnh tranh</h3>
              <p>Cung cấp giá tốt nhất trên thị trường</p>
            </div>
            <div className="why-item">
              <h3>✓ Hỗ trợ 24/7</h3>
              <p>Đội ngũ hỗ trợ luôn sẵn sàng</p>
            </div>
            <div className="why-item">
              <h3>✓ Xe mới chất lượng</h3>
              <p>Bảo trì định kỳ, an toàn và hiện đại</p>
            </div>
            <div className="why-item">
              <h3>✓ Quy trình nhanh</h3>
              <p>Thuê xe chỉ trong 5 phút</p>
            </div>
          </div>
        </div>
      </section>

      {/* FLEET SECTION */}
      <section className="fleet">
        <div className="fleet-container">
          <h2 className="section-title">Các loại xe của chúng tôi</h2>
          <div className="fleet-grid">
            <div className="fleet-card">
              <div className="fleet-image">🚗</div>
              <h3>Xe Sedan</h3>
              <p>Từ 150.000 VND/ngày</p>
            </div>
            <div className="fleet-card">
              <div className="fleet-image">🚙</div>
              <h3>Xe SUV</h3>
              <p>Từ 250.000 VND/ngày</p>
            </div>
            <div className="fleet-card">
              <div className="fleet-image">🚐</div>
              <h3>Xe 7 chỗ</h3>
              <p>Từ 400.000 VND/ngày</p>
            </div>
            <div className="fleet-card">
              <div className="fleet-image">⚡</div>
              <h3>Xe Điện</h3>
              <p>Từ 300.000 VND/ngày</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials">
        <div className="testimonials-container">
          <h2 className="section-title">Cảm nhận từ khách hàng</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p>"Dịch vụ rất tuyệt vời, xe mới, giá hợp lý. Sẽ thuê lại!"</p>
              <h4>Nguyễn Văn A</h4>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
            <div className="testimonial-card">
              <p>"Tài xế chuyên nghiệp, xe sạch sẽ, thoải mái cho chuyến đi"</p>
              <h4>Trần Thị B</h4>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
            <div className="testimonial-card">
              <p>"Quá tuyệt vời, từ đặt lịch đến giao xe rất nhanh chóng"</p>
              <h4>Phạm Văn C</h4>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="contact">
        <div className="contact-container">
          <h2 className="section-title">Liên hệ với chúng tôi</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>📱 Điện thoại</h3>
                <p>0566 999 666</p>
              </div>
              <div className="contact-item">
                <h3>📧 Email</h3>
                <p>phuongdongcorp22@gmail.com</p>
              </div>
              <div className="contact-item">
                <h3>📍 Địa chỉ</h3>
                <p> Ô Chợ Dừa, Hà Nội</p>
              </div>
            </div>
            <form className="contact-form">
              <input type="text" placeholder="Họ tên" required />
              <input type="email" placeholder="Email" required />
              <textarea placeholder="Tin nhắn" rows="5" required></textarea>
              <button type="submit" className="cta-button">Gửi tin nhắn</button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2024 Phuong Dong Corporation. Tất cả quyền được bảo lưu.</p>
          <div className="social-links">
            <a href="#">Facebook</a>
            <a href="#">Twitter</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;