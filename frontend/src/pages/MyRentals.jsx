import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

const authStorage = window.sessionStorage;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function MyRentalsPage() {
  const [customerId, setCustomerId] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedCustomerId = authStorage.getItem("customerId");
    if (storedCustomerId) {
      setCustomerId(storedCustomerId);
      fetchRentals(storedCustomerId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRentals = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/rental_requests/customer/${id}`);
      if (!response.ok) {
        throw new Error("Không thể tải lịch sử thuê xe");
      }
      const data = await response.json();
      setRentals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Lỗi khi tải lịch sử");
    } finally {
      setLoading(false);
    }
  };

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
            <span className="gf-nav-current">Lịch sử thuê xe</span>
          </nav>
        </div>
      </header>

      <main className="gf-main">
        <div className="gf-main-inner">
          <section className="gf-toolbar">
            <div className="gf-toolbar-left">
              <h2>Lịch sử thuê xe của bạn</h2>
              <p className="gf-muted">Xem trạng thái yêu cầu thuê xe và tiến trình xử lý.</p>
            </div>
            <div className="gf-toolbar-right">
              <Link to="/thue-xe-tu-lai" className="login-btn secondary">
                Xem xe khác
              </Link>
            </div>
          </section>

          {!customerId ? (
            <div className="empty-state">
              <h3>Bạn chưa có thông tin khách hàng.</h3>
              <p>Đăng ký hoặc đặt xe lần đầu để lưu lịch sử thuê và quản lý đơn hàng.</p>
              <Link to="/thue-xe-tu-lai" className="cta-button">
                Bắt đầu thuê xe
              </Link>
            </div>
          ) : loading ? (
            <div className="loading">Đang tải lịch sử...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : rentals.length === 0 ? (
            <div className="empty-state">
              <h3>Chưa có yêu cầu thuê xe.</h3>
              <p>Bạn có thể đặt xe và lịch sử sẽ được cập nhật ở đây.</p>
              <Link to="/thue-xe-tu-lai" className="cta-button">
                Đặt xe ngay
              </Link>
            </div>
          ) : (
            <div className="table-section">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Xe</th>
                    <th>Bắt đầu</th>
                    <th>Kết thúc</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((item) => (
                    <tr key={item.request_id}>
                      <td>{item.request_id}</td>
                      <td>{item.car_id}</td>
                      <td>{item.start_date}</td>
                      <td>{item.end_date}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
