import { useEffect, useState } from "react";
import { BackArrowIcon, PasswordVisibilityIcon } from "./AppIcons.jsx";

export default function AuthModal({
  show,
  onClose,
  authMode,
  authHeaderText,
  handleAuthModeChange,
  handleLoginSubmit,
  loginData,
  setLoginData,
  showLoginPassword,
  setShowLoginPassword,
  handleForgotPasswordClick,
  handleForgotPasswordSubmit,
  forgotEmail,
  setForgotEmail,
  passwordResetStatus,
  handleVerifyOtpSubmit,
  handleResetPasswordSubmit,
  resetOtp,
  setResetOtp,
  resetPassword,
  setResetPassword,
  resetConfirmPassword,
  setResetConfirmPassword,
  handleRegisterSubmit,
  registerData,
  setRegisterData,
  showRegisterPassword,
  setShowRegisterPassword,
}) {
  const [showOtp, setShowOtp] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  useEffect(() => {
    setShowOtp(false);
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
  }, [authMode, show]);

  if (!show) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="login-modal">
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <div className="auth-card">
          <div className="auth-panel">
            <div className="auth-header">
              {(authMode === "forgot" || authMode === "verify" || authMode === "reset") && (
                <button
                  type="button"
                  className="auth-back"
                  onClick={() => handleAuthModeChange("login")}
                  aria-label="Quay lại"
                  title="Quay lại"
                >
                  <BackArrowIcon />
                </button>
              )}
              <h3>{authHeaderText.title}</h3>
              <p>{authHeaderText.subtitle}</p>
            </div>
            {(authMode === "login" || authMode === "register") && (
              <div className="auth-switch">
                <button className={`auth-toggle ${authMode === "login" ? "active" : ""}`} type="button" onClick={() => handleAuthModeChange("login")}>Đăng nhập</button>
                <button className={`auth-toggle ${authMode === "register" ? "active" : ""}`} type="button" onClick={() => handleAuthModeChange("register")}>Đăng ký</button>
              </div>
            )}
            {authMode === "login" ? (
              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <label>
                  Email
                  <input
                    type="email"
                    placeholder="Nhập email"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
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
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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
                <button type="submit" className="cta-button auth-submit">Đăng nhập</button>
                <button type="button" className="auth-secondary" onClick={handleForgotPasswordClick}>Quên mật khẩu</button>
                <div className="auth-footer">
                  <span>Bạn chưa có tài khoản?</span>
                  <button type="button" className="auth-link" onClick={() => handleAuthModeChange("register")}>Đăng ký tài khoản</button>
                </div>
              </form>
            ) : authMode === "forgot" ? (
              <form className="auth-form" onSubmit={handleForgotPasswordSubmit}>
                <label>
                  Email
                  <input
                    type="email"
                    placeholder="Nhập email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" className="cta-button auth-submit">Nhận mã OTP</button>
                {passwordResetStatus ? <div className="auth-message">{passwordResetStatus}</div> : null}
                <div className="auth-footer">
                  <span>Đã nhớ mật khẩu?</span>
                  <button type="button" className="auth-link" onClick={() => handleAuthModeChange("login")}>Đăng nhập</button>
                </div>
              </form>
            ) : authMode === "verify" ? (
              <form className="auth-form" onSubmit={handleVerifyOtpSubmit}>
                <label>
                  Email
                  <input
                    type="email"
                    placeholder="Nhập email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="password-field">
                  Mã OTP
                  <div className="password-input-wrapper">
                    <input
                      type={showOtp ? "text" : "password"}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Nhập mã OTP"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowOtp((prev) => !prev)}
                      aria-label={showOtp ? "Ẩn mã OTP" : "Hiện mã OTP"}
                    >
                      <PasswordVisibilityIcon visible={showOtp} />
                    </button>
                  </div>
                </label>
                <button type="submit" className="cta-button auth-submit">Xác thực OTP</button>
                {passwordResetStatus ? <div className="auth-message">{passwordResetStatus}</div> : null}
                <div className="auth-footer">
                  <span>Chưa nhận mã?</span>
                  <button type="button" className="auth-link" onClick={() => handleAuthModeChange("forgot")}>Gửi lại OTP</button>
                </div>
              </form>
            ) : authMode === "reset" ? (
              <form className="auth-form" onSubmit={handleResetPasswordSubmit}>
                <label>
                  Email
                  <input
                    type="email"
                    placeholder="Email"
                    value={forgotEmail}
                    readOnly
                  />
                </label>
                <label className="password-field">
                  Mã OTP đã xác thực
                  <div className="password-input-wrapper">
                    <input
                      type={showOtp ? "text" : "password"}
                      value={resetOtp}
                      readOnly
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowOtp((prev) => !prev)}
                      aria-label={showOtp ? "Ẩn mã OTP" : "Hiện mã OTP"}
                    >
                      <PasswordVisibilityIcon visible={showOtp} />
                    </button>
                  </div>
                </label>
                <label className="password-field">
                  Mật khẩu mới
                  <div className="password-input-wrapper">
                    <input
                      type={showResetPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowResetPassword((prev) => !prev)}
                      aria-label={showResetPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                    >
                      <PasswordVisibilityIcon visible={showResetPassword} />
                    </button>
                  </div>
                </label>
                <label className="password-field">
                  Xác nhận mật khẩu
                  <div className="password-input-wrapper">
                    <input
                      type={showResetConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowResetConfirmPassword((prev) => !prev)}
                      aria-label={showResetConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                    >
                      <PasswordVisibilityIcon visible={showResetConfirmPassword} />
                    </button>
                  </div>
                </label>
                <button type="submit" className="cta-button auth-submit">Đặt lại mật khẩu</button>
                {passwordResetStatus ? <div className="auth-message">{passwordResetStatus}</div> : null}
                <div className="auth-footer">
                  <span>Đã nhớ mật khẩu?</span>
                  <button type="button" className="auth-link" onClick={() => handleAuthModeChange("login")}>Đăng nhập</button>
                </div>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegisterSubmit}>
                <label>
                  Họ và tên*
                  <input
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Email*
                  <input
                    type="email"
                    placeholder="Nhập email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Số điện thoại*
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Địa chỉ
                  <input
                    type="text"
                    placeholder="Nhập địa chỉ"
                    value={registerData.address}
                    onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                  />
                </label>
                <label className="password-field">
                  Mật khẩu*
                  <div className="password-input-wrapper">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
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
  );
}
