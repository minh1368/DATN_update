import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStorage, normalizeRoleValue } from "../lib/auth.js";
import { notifyUser } from "../lib/toast.js";
import useNotifications from "../hooks/useNotifications.js";

function HeaderUserIcon() {
  return (
    <svg className="header-avatar-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}

function DropdownIcon({ type }) {
  if (type === "history") {
    return (
      <span className="dropdown-custom-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M4 12a8 8 0 1 0 2.3-5.7" />
          <path d="M4 4v4h4" />
          <path d="M12 7v5l3 2" />
        </svg>
      </span>
    );
  }

  if (type === "dashboard") {
    return (
      <span className="dropdown-custom-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="4" y="4" width="7" height="7" rx="1.6" />
          <rect x="13" y="4" width="7" height="7" rx="1.6" />
          <rect x="4" y="13" width="7" height="7" rx="1.6" />
          <path d="M14 15h5" />
          <path d="M14 19h5" />
        </svg>
      </span>
    );
  }

  if (type === "logout") {
    return (
      <span className="dropdown-custom-icon logout-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M10 5H6.8A2.8 2.8 0 0 0 4 7.8v8.4A2.8 2.8 0 0 0 6.8 19H10" />
          <path d="M14 8l4 4-4 4" />
          <path d="M18 12H9" />
        </svg>
      </span>
    );
  }

  return (
    <span className="dropdown-custom-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M18 5.5 20 7l-2 1.5" />
      </svg>
    </span>
  );
}

function readUserData() {
  try {
    return JSON.parse(authStorage.getItem("userData") || "{}");
  } catch {
    return {};
  }
}

export default function PageHeader() {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const userData = readUserData();
  const loggedInUser = authStorage.getItem("loggedInUser") || userData.name || userData.username || "";
  const role = userData.role || authStorage.getItem("userRole") || "";
  const normalizedRole = normalizeRoleValue(role);
  const canAccessDashboard = ["admin", "staff"].includes(normalizedRole);
  const {
    showNotifications,
    setShowNotifications,
    notifications,
    unreadNotificationCount,
    markNotificationsRead,
    markNotificationRead,
    formatNotificationTime,
  } = useNotifications({
    role,
    normalizedRole,
    loggedInUser,
    canAccessDashboard,
  });

  const handleLogout = () => {
    [
      "loggedInUser",
      "userRole",
      "userData",
      "customerId",
      "authToken",
      "supportConversationId",
    ].forEach((key) => authStorage.removeItem(key));
    setShowUserMenu(false);
    navigate("/");
    notifyUser("Đã đăng xuất", "success");
  };

  const handleSelectRentalType = (type) => {
    setShowServiceOptions(false);
    navigate(type === "tự lái" ? "/thue-xe-tu-lai" : "/thue-xe-co-lai");
  };

  return (
    <header className="header page-standard-header">
      <div className="header-container">
        <button className="logo" type="button" onClick={() => navigate("/")}>
          <span className="logo-icon">
            <img src="/image/brand/logo.png" alt="Phương Đông" />
          </span>
          <span className="logo-text">
            <span className="logo-main">
              <span>Dịch vụ</span>
              <span>cho thuê xe</span>
              <span>linh hoạt</span>
            </span>
          </span>
        </button>

        <nav className="nav">
          <button className="nav-item" type="button" onClick={() => navigate("/")}>
            Trang chủ
          </button>
          {canAccessDashboard && loggedInUser ? (
            <button className="nav-item" type="button" onClick={() => navigate("/admin")}>
              Quản lý
            </button>
          ) : null}
          <button
            className={`nav-item service-button${showServiceOptions ? " active" : ""}`}
            type="button"
            onClick={() => setShowServiceOptions((current) => !current)}
          >
            Dịch vụ
          </button>
          <button className="nav-item" type="button" onClick={() => navigate("/gioi-thieu")}>
            Giới thiệu
          </button>
          <button className="nav-item" type="button" onClick={() => navigate("/tin-tuc")}>
            Tin tức
          </button>
        </nav>

        <div className="login-controls">
          {loggedInUser ? (
            <div className="user-menu-container">
              <div className="notification-container">
                <button
                  type="button"
                  className={`notification-bell${unreadNotificationCount > 0 ? " has-unread" : ""}`}
                  onClick={() => setShowNotifications((current) => !current)}
                  aria-label="Thông báo"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" />
                    <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
                  </svg>
                  {unreadNotificationCount > 0 ? (
                    <span className="notification-count">{unreadNotificationCount}</span>
                  ) : null}
                </button>
                {showNotifications ? (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      <div>
                        <strong>Thông báo</strong>
                        <span>{unreadNotificationCount > 0 ? `${unreadNotificationCount} mới` : "Đã đọc"}</span>
                      </div>
                      <button
                        type="button"
                        className="notification-read-all"
                        onClick={markNotificationsRead}
                        disabled={unreadNotificationCount === 0}
                      >
                        Đã đọc tất cả
                      </button>
                    </div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">Chưa có thông báo mới</div>
                      ) : (
                        notifications.map((notification) => {
                          const isUnread = !notification.read;
                          return (
                            <button
                              key={notification.id}
                              type="button"
                              className={`notification-item${isUnread ? " unread" : ""}`}
                              onClick={() => {
                                markNotificationRead(notification.id);
                                setShowNotifications(false);
                                navigate(canAccessDashboard ? "/admin" : "/my-rentals");
                              }}
                            >
                              <span className="notification-dot" />
                              <span>
                                <strong>{notification.title}</strong>
                                <small>{notification.message}</small>
                                <em>{formatNotificationTime(notification.createdAt)}</em>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <button type="button" className="user-avatar-btn" onClick={() => setShowUserMenu((current) => !current)}>
                <span className="user-avatar">
                  <HeaderUserIcon />
                </span>
                <span className="user-name">{loggedInUser}</span>
                <span className="dropdown-arrow" aria-hidden="true" />
              </button>

              {showUserMenu ? (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-info">
                      <span className="user-avatar-large">
                        <HeaderUserIcon />
                      </span>
                      <div>
                        <div className="user-display-name">{loggedInUser}</div>
                        <div className="user-role">
                          Vai trò: {normalizedRole === "admin" ? "Quản trị viên" : normalizedRole === "staff" ? "Nhân viên" : "Khách hàng"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="user-dropdown-menu">
                    <button type="button" className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate("/profile"); }}>
                      <DropdownIcon type="profile" />
                      Thông tin cá nhân
                    </button>
                    <button type="button" className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate("/my-rentals"); }}>
                      <DropdownIcon type="history" />
                      Lịch sử thuê xe
                    </button>
                    {canAccessDashboard ? (
                      <button type="button" className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate("/admin"); }}>
                        <DropdownIcon type="dashboard" />
                        Quản lý
                      </button>
                    ) : null}
                    <div className="dropdown-divider" />
                    <button type="button" className="dropdown-item logout" onClick={handleLogout}>
                      <DropdownIcon type="logout" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <button className="login-btn" type="button" onClick={() => navigate("/")}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {showServiceOptions ? (
        <div className="top-service-bar">
          <div className="top-service-options">
            <button type="button" className="top-service-option" onClick={() => handleSelectRentalType("tự lái")}>
              Thuê xe tự lái
            </button>
            <button type="button" className="top-service-option" onClick={() => handleSelectRentalType("có lái")}>
              Thuê xe có lái
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
