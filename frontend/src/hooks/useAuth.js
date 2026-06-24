import { useEffect, useState } from "react";
import { authStorage, normalizeRoleValue } from "../lib/auth.js";
import { getReadableErrorMessage } from "../lib/toast.js";
import { customerService, userService } from "../services/dashboardService.js";

export default function useAuth({ notify, onLogout, adminMode = false }) {
  const [role, setRole] = useState("customer");
  const [loggedInUser, setLoggedInUser] = useState(null);
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
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [passwordResetStatus, setPasswordResetStatus] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  useEffect(() => {
    const savedUser = authStorage.getItem("loggedInUser");
    const savedRole = authStorage.getItem("userRole");
    const savedUserData = authStorage.getItem("userData");

    if (!savedUser || !savedRole || !savedUserData) return;

    try {
      const userData = JSON.parse(savedUserData);
      setLoggedInUser(userData.name || userData.username);
      setRole(normalizeRoleValue(userData.role || savedRole));
    } catch (error) {
      console.error("Error parsing saved user data:", error);
      authStorage.removeItem("loggedInUser");
      authStorage.removeItem("userRole");
      authStorage.removeItem("userData");
      authStorage.removeItem("authToken");
    }
  }, []);

  const authHeaderText = (() => {
    if (authMode === "login") return { title: "Đăng nhập", subtitle: "Nhập tài khoản để tiếp tục." };
    if (authMode === "register") return { title: "Đăng ký", subtitle: "Tạo tài khoản mới để bắt đầu." };
    if (authMode === "forgot") return { title: "Quên mật khẩu", subtitle: "Nhập email bạn đã đăng ký để nhận mã OTP." };
    if (authMode === "verify") return { title: "Xác thực OTP", subtitle: "Nhập mã OTP vừa nhận để tiếp tục." };
    return { title: "Đặt lại mật khẩu", subtitle: "Nhập mật khẩu mới để hoàn tất." };
  })();

  const createCustomerProfile = async () => {
    return customerService.createPublic({
      name: registerData.fullName,
      phone: registerData.phone,
      email: registerData.email,
      password: registerData.password,
      address: registerData.address || "",
    });
  };

  const handleLoginClick = () => {
    setShowLoginForm(true);
    setAuthMode("login");
  };

  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
    setPasswordResetStatus("");
  };

  const handleCloseAuth = () => setShowLoginForm(false);

  const handleForgotPasswordClick = () => {
    setForgotEmail(loginData.username || "");
    setResetOtp("");
    setResetPassword("");
    setResetConfirmPassword("");
    setPasswordResetStatus("");
    setAuthMode("forgot");
    setShowLoginForm(true);
  };

  const handleForgotPasswordSubmit = async (event) => {
    event.preventDefault();
    if (!forgotEmail) {
      notify("Vui lòng nhập email để yêu cầu mã OTP.", "error");
      return;
    }

    try {
      if (adminMode) {
        await userService.requestPasswordReset({ email: forgotEmail });
      } else {
        const resetResults = await Promise.allSettled([
          customerService.requestPasswordReset({ email: forgotEmail }),
          userService.requestPasswordReset({ email: forgotEmail })
        ]);
        const failedSend = resetResults.find((result) => (
          result.status === "rejected" && Number(result.reason?.status || 0) >= 500
        ));
        if (failedSend) throw failedSend.reason;
        if (resetResults.every((result) => result.status === "rejected")) {
          throw resetResults[0].reason;
        }
      }
      setPasswordResetStatus("Mã OTP đã được gửi. Vui lòng kiểm tra email.");
      setAuthMode("verify");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Yêu cầu quên mật khẩu thất bại"), "error");
    }
  };

  const handleVerifyOtpSubmit = async (event) => {
    event.preventDefault();
    if (!forgotEmail || !resetOtp) {
      notify("Vui lòng nhập email và mã OTP.", "error");
      return;
    }

    try {
      if (adminMode) {
        await userService.verifyPasswordResetOtp({ email: forgotEmail, otp: resetOtp });
      } else {
        try {
          await customerService.verifyPasswordResetOtp({ email: forgotEmail, otp: resetOtp });
        } catch (error) {
          if (error?.status === 404) {
            await userService.verifyPasswordResetOtp({ email: forgotEmail, otp: resetOtp });
          } else {
            throw error;
          }
        }
      }
      setPasswordResetStatus("Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới.");
      notify("Xác thực OTP thành công", "success");
      setAuthMode("reset");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Xác thực mã OTP thất bại"), "error");
    }
  };

  const handleResetPasswordSubmit = async (event) => {
    event.preventDefault();
    if (!forgotEmail || !resetOtp || !resetPassword || !resetConfirmPassword) {
      notify("Vui lòng nhập đầy đủ các trường.", "error");
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      notify("Mật khẩu mới và xác nhận mật khẩu không khớp.", "error");
      return;
    }

    try {
      const payload = {
        email: forgotEmail,
        otp: resetOtp,
        new_password: resetPassword,
      };
      if (adminMode) {
        await userService.confirmPasswordReset(payload);
      } else {
        try {
          await customerService.confirmPasswordReset(payload);
        } catch (error) {
          if (error?.status === 404) {
            await userService.confirmPasswordReset(payload);
          } else {
            throw error;
          }
        }
      }
      notify("Mật khẩu đã được đặt lại. Vui lòng đăng nhập bằng mật khẩu mới.", "success");
      setAuthMode("login");
      setLoginData({ username: forgotEmail, password: "" });
      setForgotEmail("");
      setResetOtp("");
      setResetPassword("");
      setResetConfirmPassword("");
      setPasswordResetStatus("");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Đặt lại mật khẩu thất bại"), "error");
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setRole("customer");
    setShowLoginForm(false);
    authStorage.removeItem("loggedInUser");
    authStorage.removeItem("userRole");
    authStorage.removeItem("userData");
    authStorage.removeItem("customerId");
    authStorage.removeItem("authToken");
    localStorage.removeItem("userPassword");
    onLogout?.();
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (!loginData.username || !loginData.password) {
      notify("Vui lòng nhập email và mật khẩu.", "error");
      return;
    }

    try {
      let user;
      let loginRole;
      let customer = null;

      if (adminMode) {
        user = await userService.login(loginData);
        loginRole = normalizeRoleValue(user.role);
        if (loginRole === "customer") {
          notify("Bạn không có quyền truy cập trang quản trị", "error");
          return;
        }
      } else {
        try {
          const res = await customerService.login(loginData);
          user = {
            user_id: res.customer_id,
            email: res.email,
            name: res.name,
            role: "customer",
            token: res.token,
          };
          loginRole = "customer";
          customer = res;
        } catch (error) {
          if (error?.status === 401 || error?.status === 404 || error?.status === 400) {
            user = await userService.login(loginData);
            loginRole = normalizeRoleValue(user.role);
          } else {
            throw error;
          }
        }
      }

      const userProfile = customer
        ? { ...user, ...customer }
        : { ...user, email: user.email || (user.username?.includes("@") ? user.username : "") };

      setLoggedInUser(userProfile.name || user.email || user.username);
      setRole(loginRole);
      authStorage.setItem("loggedInUser", userProfile.name || user.email || user.username);
      authStorage.setItem("userRole", loginRole);
      authStorage.setItem("userData", JSON.stringify(userProfile));
      if (user.token) authStorage.setItem("authToken", user.token);
      if (customer?.customer_id) authStorage.setItem("customerId", String(customer.customer_id));
      else authStorage.removeItem("customerId");
      localStorage.setItem("userPassword", loginData.password);

      setShowLoginForm(false);
      setLoginData({ username: "", password: "" });
      notify("Đăng nhập thành công", "success");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Đăng nhập thất bại"), "error");
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (!registerData.fullName || !registerData.email || !registerData.phone || !registerData.password) {
      notify("Vui lòng nhập đầy đủ họ và tên, email, số điện thoại và mật khẩu.", "error");
      return;
    }

    try {
      await createCustomerProfile();
      notify("Đăng ký thành công. Vui lòng đăng nhập.", "success");
      setAuthMode("login");
      setLoginData({ username: registerData.email, password: "" });
      setRegisterData({ fullName: "", email: "", phone: "", address: "", password: "" });
    } catch (error) {
      notify(getReadableErrorMessage(error, "Đăng ký thất bại"), "error");
    }
  };

  return {
    role,
    loggedInUser,
    showLoginForm,
    setShowLoginForm,
    authMode,
    setAuthMode,
    loginData,
    setLoginData,
    registerData,
    setRegisterData,
    forgotEmail,
    setForgotEmail,
    resetOtp,
    setResetOtp,
    resetPassword,
    setResetPassword,
    resetConfirmPassword,
    setResetConfirmPassword,
    passwordResetStatus,
    showLoginPassword,
    setShowLoginPassword,
    showRegisterPassword,
    setShowRegisterPassword,
    authHeaderText,
    handleLoginClick,
    handleAuthModeChange,
    handleCloseAuth,
    handleForgotPasswordClick,
    handleForgotPasswordSubmit,
    handleVerifyOtpSubmit,
    handleResetPasswordSubmit,
    handleLogout,
    handleLoginSubmit,
    handleRegisterSubmit,
  };
}
