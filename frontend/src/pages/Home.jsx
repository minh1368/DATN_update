import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppFooter from "../components/AppFooter.jsx";
import AppHeader from "../components/AppHeader.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import CustomerCarShowcase from "../components/CustomerCarShowcase.jsx";
import HomeHero from "../components/HomeHero.jsx";
import HomeContentSections from "../components/HomeContentSections.jsx";
import DashboardWorkspace from "../components/dashboard/DashboardWorkspace.jsx";
import AboutSection from "../components/AboutSection.jsx";
import { getCarImageUrl } from "../lib/carUtils.js";
import { fallbackCars } from "../lib/carData.js";
import { notifyUser } from "../lib/toast.js";
import { normalizeRoleValue } from "../lib/auth.js";
import useNotifications from "../hooks/useNotifications.js";
import useDashboardData from "../hooks/useDashboardData.js";
import useAuth from "../hooks/useAuth.js";
import usePayments from "../hooks/usePayments.js";
import useRequests from "../hooks/useRequests.js";
import useDashboardCrud from "../hooks/useDashboardCrud.js";
import useDashboardFilters from "../hooks/useDashboardFilters.jsx";
import useHomeExperience from "../hooks/useHomeExperience.jsx";
import useDashboardWorkspaceData from "../hooks/useDashboardWorkspaceData.js";

const shuffleCars = (items) => {
  const nextItems = [...items];
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
  }
  return nextItems;
};

export default function Home({ adminMode = false, initialAbout = false }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const confirmResolverRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Xóa",
    cancelText: "Hủy",
    danger: true,
  });
  const {
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
    handleLogout: handleAuthLogout,
    handleLoginSubmit,
    handleRegisterSubmit,
  } = useAuth({ notify: notifyUser, adminMode });
  const normalizedRole = normalizeRoleValue(role);
  const canAccessDashboard = normalizedRole === "admin" || normalizedRole === "staff";
  const isAdmin = normalizedRole === "admin";
  const {
    activeTab,
    setActiveTab,
    summaryRange,
    setSummaryRange,
    summaryStartDate,
    setSummaryStartDate,
    summaryEndDate,
    setSummaryEndDate,
    requestStartFilter,
    setRequestStartFilter,
    requestEndFilter,
    setRequestEndFilter,
    contractStartFilter,
    setContractStartFilter,
    contractEndFilter,
    setContractEndFilter,
    carSearch,
    setCarSearch,
    carFilters,
    setCarFilters,
    carsPage,
    setCarsPage,
    customersPage,
    setCustomersPage,
    requestsPage,
    setRequestsPage,
    requestStatusFilter,
    setRequestStatusFilter,
    requestBrandFilter,
    setRequestBrandFilter,
    requestSearch,
    setRequestSearch,
    contractsPage,
    setContractsPage,
    paymentsPage,
    setPaymentsPage,
    usersPage,
    setUsersPage,
    contractSearch,
    setContractSearch,
    contractBrandFilter,
    setContractBrandFilter,
    contractStatusFilter,
    setContractStatusFilter,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    customerSearch,
    setCustomerSearch,
    handleSummaryRangeChange,
    isDateInSummaryRange,
    isItemInDateRange,
    renderDateFilter,
    paginateRows,
    getRowTime,
    sortNewestByDate,
    renderTablePagination,
    getPaginationItems,
    formatCarStatusLabel,
  } = useDashboardFilters({ isAdmin });
  const {
    headers,
    stats,
    cars,
    customers,
    requests,
    contracts,
    payments,
    users,
    sharedDisplayCars,
    setRequests,
    setPayments,
    refreshData,
    refreshRequestPaymentData,
    refreshCarsContext,
  } = useDashboardData({ canAccessDashboard, normalizedRole });
  const {
    newCar,
    setNewCar,
    showCreateCarForm,
    setShowCreateCarForm,
    editingCar,
    setEditingCar,
    newCustomer,
    setNewCustomer,
    editingCustomer,
    setEditingCustomer,
    showCreateCustomerForm,
    setShowCreateCustomerForm,
    newUser,
    setNewUser,
    editingUser,
    setEditingUser,
    showCreateUserForm,
    setShowCreateUserForm,
    handleCreateCar,
    handleStartEditCar,
    handleCarImageChange,
    handleUpdateCar,
    handleCreateCustomer,
    handleStartEditCustomer,
    handleUpdateCustomer,
    handleCreateUser,
    handleStartEditUser,
    handleUpdateUser,
  } = useDashboardCrud({
    headers,
    refreshData,
    refreshCarsContext,
    notify: notifyUser,
  });
  const dashboardPermissions = {
    canDeleteData: isAdmin,
    canManagePersonnel: isAdmin,
    canManageCatalog: isAdmin,
    canProcessRentals: canAccessDashboard,
    canIssueInvoice: canAccessDashboard,
    canSignContract: canAccessDashboard,
  };
  const handleAdminNotificationData = useCallback(({ requests: nextRequests, payments: nextPayments }) => {
    if (Array.isArray(nextRequests)) setRequests(nextRequests);
    if (Array.isArray(nextPayments)) setPayments(nextPayments);
  }, [setPayments, setRequests]);
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
    onAdminData: handleAdminNotificationData,
    notify: notifyUser,
  });
  const {
    selectedRequestDetail,
    setSelectedRequestDetail,
    requestRejectReason,
    setRequestRejectReason,
    showRequestRejectNote,
    setShowRequestRejectNote,
    openRequestDetail,
    handleConfirmRequestDeposit,
    handleRejectRequestFromDetail,
  } = useRequests({
    headers,
    setRequests,
    setPayments,
    refreshData,
    refreshRequestPaymentData,
    markNotificationRead,
    notify: notifyUser,
  });
  const navigate = useNavigate();
  const {
    reviewForm,
    setReviewForm,
    reviewNotice,
    setReviewNotice,
    selectedRentalType,
    showServiceOptions,
    setShowServiceOptions,
    showAboutSection,
    setShowAboutSection,
    isHeaderHidden,
    visibleTestimonials,
    hasMoreTestimonials,
    canCollapseTestimonials,
    isLoadingTestimonials,
    carGridRef,
    aboutRef,
    servicesRef,
    handleLoadMoreTestimonials,
    handleCollapseTestimonials,
    handleGridPointerDown,
    handleGridPointerMove,
    handleGridPointerUp,
    handleCarCardClick,
    handleSelectRentalType,
    handleAboutNavClick,
    handleReviewSubmit,
    getCarCategory,
    getCarSeats,
    getCarTransmission,
    getCarSubtitle,
    isCarRented,
    getCarColorSwatch,
  } = useHomeExperience({
    initialAbout,
    navigate,
    loggedInUser,
    setAuthMode,
    setShowLoginForm,
  });

  const showcaseCars = useMemo(() => shuffleCars(sharedDisplayCars), [sharedDisplayCars]);
  const displayCars = canAccessDashboard ? cars : showcaseCars;

  const requestConfirm = (options = {}) => new Promise((resolve) => {
    confirmResolverRef.current = resolve;
    setConfirmDialog({
      open: true,
      title: options.title || "Xác nhận thao tác",
      message: options.message || "Bạn có chắc chắn muốn tiếp tục?",
      confirmText: options.confirmText || "Xóa",
      cancelText: options.cancelText || "Hủy",
      danger: Boolean(options.danger),
    });
  });

  const closeConfirmDialog = (result) => {
    setConfirmDialog((current) => ({ ...current, open: false }));
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
  };

  useEffect(() => {
    refreshData();
  }, [refreshData, role]);

  // Đóng user dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowNotifications, showNotifications, showUserMenu]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (showLoginForm && event.key === "Escape") {
        setShowLoginForm(false);
      }
      if (editingUser && event.key === "Escape") {
        setEditingUser(null);
      }
      if (editingCustomer && event.key === "Escape") {
        setEditingCustomer(null);
      }
      if (editingCar && event.key === "Escape") {
        setEditingCar(null);
      }
      if (showCreateCarForm && event.key === "Escape") {
        setShowCreateCarForm(false);
      }
      if (showCreateUserForm && event.key === "Escape") {
        setShowCreateUserForm(false);
      }
      if (showCreateCustomerForm && event.key === "Escape") {
        setShowCreateCustomerForm(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [
    editingCar,
    editingCustomer,
    editingUser,
    setEditingCar,
    setEditingCustomer,
    setEditingUser,
    setShowCreateCarForm,
    setShowCreateCustomerForm,
    setShowCreateUserForm,
    setShowLoginForm,
    showCreateCarForm,
    showCreateCustomerForm,
    showCreateUserForm,
    showLoginForm,
  ]);

  const handleLogout = () => {
    handleAuthLogout();
  };

  const {
    dashboardUsers,
    dashboardCustomers,
    customerById,
    carById,
    requestById,
    contractById,
    depositPaymentByRequestId,
    getRequestTotalPrice,
    handleExport,
    handleDeleteCar,
    handleDeleteCustomer,
    handleDeleteRequest,
    handleDeleteUser,
    onReturnCar,
  } = useDashboardWorkspaceData({
    cars,
    customers,
    requests,
    contracts,
    payments,
    users,
    headers,
    canDeleteData: dashboardPermissions.canDeleteData,
    confirmAction: requestConfirm,
    refreshData,
    setShowLoginForm,
    notify: notifyUser,
  });
  const {
    paymentSearch,
    setPaymentSearch,
    paymentStartFilter,
    setPaymentStartFilter,
    paymentEndFilter,
    setPaymentEndFilter,
    paymentBrandFilter,
    setPaymentBrandFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    paymentSortOrder,
    setPaymentSortOrder,
    expandedPaymentGroupKey,
    setExpandedPaymentGroupKey,
    selectedPaymentDetail,
    creatingContractIds,
    getPaymentContext,
    getPaymentDate,
    getContractPaymentSummary,
    openPaymentDetail,
    closePaymentDetail,
    getPaymentDetailData,
    handleDeletePaymentGroup,
    handlePaymentAction,
    handlePaymentRejectNotify,
    handleRejectRequestFromPayment,
    handleCreateContract,
    notReceivedPayment,
    setNotReceivedPayment,
  } = usePayments({
    payments,
    contracts,
    requests,
    customerById,
    carById,
    requestById,
    contractById,
    headers,
    canDeleteData: dashboardPermissions.canDeleteData,
    confirmAction: requestConfirm,
    setPayments,
    setRequests,
    refreshData,
    markNotificationRead,
    notify: notifyUser,
  });
  const renderAboutSection = () => <AboutSection aboutRef={aboutRef} />;

  return (
    <div className={`app${!adminMode && showAboutSection ? " about-view" : ""}`}>
      <AppHeader
        navigate={navigate}
        loggedInUser={loggedInUser}
        normalizedRole={normalizedRole}
        canAccessDashboard={canAccessDashboard}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        unreadNotificationCount={unreadNotificationCount}
        markNotificationsRead={markNotificationsRead}
        markNotificationRead={markNotificationRead}
        formatNotificationTime={formatNotificationTime}
        refreshData={refreshData}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        showServiceOptions={showServiceOptions}
        setShowServiceOptions={setShowServiceOptions}
        showAboutSection={showAboutSection}
        setShowAboutSection={setShowAboutSection}
        selectedRentalType={selectedRentalType}
        handleSelectRentalType={handleSelectRentalType}
        handleAboutNavClick={handleAboutNavClick}
        isHeaderHidden={isHeaderHidden}
        auth={{
          showLoginForm,
          authMode,
          authHeaderText,
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
          handleLoginClick,
          handleAuthModeChange,
          handleCloseAuth,
          handleForgotPasswordClick,
          handleForgotPasswordSubmit,
          handleVerifyOtpSubmit,
          handleResetPasswordSubmit,
          handleLoginSubmit,
          handleRegisterSubmit,
        }}
      />

      {!adminMode && showAboutSection && renderAboutSection()}

      {!adminMode && !showAboutSection && (
        <>
      <HomeHero selectedRentalType={selectedRentalType} navigate={navigate} />
      <CustomerCarShowcase
        loggedInUser={loggedInUser}
        carGridRef={carGridRef}
        handleGridPointerDown={handleGridPointerDown}
        handleGridPointerMove={handleGridPointerMove}
        handleGridPointerUp={handleGridPointerUp}
        displayCars={displayCars}
        handleCarCardClick={handleCarCardClick}
        navigate={navigate}
        getCarCategory={getCarCategory}
        isCarRented={isCarRented}
        getCarSubtitle={getCarSubtitle}
        getCarImageUrl={getCarImageUrl}
        fallbackCars={fallbackCars}
        getCarSeats={getCarSeats}
        getCarTransmission={getCarTransmission}
        getCarColorSwatch={getCarColorSwatch}
      />
        </>
      )}

      {/* DASHBOARD SECTION */}
      {adminMode && (
        canAccessDashboard ? (
          <DashboardWorkspace
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isAdmin={isAdmin}
            data={{
              stats,
              cars,
              dashboardCustomers,
              requests,
              contracts,
              payments,
              dashboardUsers,
              customerById,
              carById,
              requestById,
              depositPaymentByRequestId,
            }}
            filters={{
              summaryRange,
              setSummaryRange,
              summaryStartDate,
              setSummaryStartDate,
              summaryEndDate,
              setSummaryEndDate,
              carSearch,
              setCarSearch,
              carFilters,
              setCarFilters,
              carsPage,
              setCarsPage,
              customerSearch,
              setCustomerSearch,
              customersPage,
              setCustomersPage,
              requestStartFilter,
              setRequestStartFilter,
              requestEndFilter,
              setRequestEndFilter,
              requestStatusFilter,
              setRequestStatusFilter,
              requestBrandFilter,
              setRequestBrandFilter,
              requestSearch,
              setRequestSearch,
              requestsPage,
              setRequestsPage,
              contractSearch,
              setContractSearch,
              contractStartFilter,
              setContractStartFilter,
              contractEndFilter,
              setContractEndFilter,
              contractBrandFilter,
              setContractBrandFilter,
              contractStatusFilter,
              setContractStatusFilter,
              contractsPage,
              setContractsPage,
              paymentsPage,
              setPaymentsPage,
              userSearch,
              setUserSearch,
              userRoleFilter,
              setUserRoleFilter,
              usersPage,
              setUsersPage,
            }}
            crud={{
              showCreateCarForm,
              setShowCreateCarForm,
              newCar,
              setNewCar,
              handleCreateCar,
              handleCarImageChange,
              editingCar,
              setEditingCar,
              handleUpdateCar,
              handleStartEditCar,
              showCreateCustomerForm,
              setShowCreateCustomerForm,
              newCustomer,
              setNewCustomer,
              handleCreateCustomer,
              editingCustomer,
              setEditingCustomer,
              handleUpdateCustomer,
              handleStartEditCustomer,
              showCreateUserForm,
              setShowCreateUserForm,
              newUser,
              setNewUser,
              handleCreateUser,
              editingUser,
              setEditingUser,
              handleUpdateUser,
              handleStartEditUser,
            }}
            actions={{
              canDeleteData: dashboardPermissions.canDeleteData,
              handleExport,
              handleDeleteCar,
              handleDeleteCustomer,
              handleDeleteRequest,
              handleDeleteUser,
              onReturnCar,
            }}
            helpers={{
              handleSummaryRangeChange,
              isDateInSummaryRange,
              isItemInDateRange,
              renderDateFilter,
              paginateRows,
              getRowTime,
              sortNewestByDate,
              renderTablePagination,
              getPaginationItems,
              formatCarStatusLabel,
            }}
            payment={{
              paymentSearch,
              setPaymentSearch,
              paymentStartFilter,
              setPaymentStartFilter,
              paymentEndFilter,
              setPaymentEndFilter,
              paymentBrandFilter,
              setPaymentBrandFilter,
              paymentStatusFilter,
              setPaymentStatusFilter,
              paymentSortOrder,
              setPaymentSortOrder,
              expandedPaymentGroupKey,
              setExpandedPaymentGroupKey,
              selectedPaymentDetail,
              creatingContractIds,
              getPaymentContext,
              getPaymentDate,
              getContractPaymentSummary,
              openPaymentDetail,
              closePaymentDetail,
              getPaymentDetailData,
              handleDeletePaymentGroup,
              handlePaymentAction,
              handlePaymentRejectNotify,
              handleRejectRequestFromPayment,
              handleCreateContract,
              notReceivedPayment,
              setNotReceivedPayment,
            }}
            requestDetail={{
              selectedRequestDetail,
              setSelectedRequestDetail,
              requestRejectReason,
              setRequestRejectReason,
              showRequestRejectNote,
              setShowRequestRejectNote,
              openRequestDetail,
              getRequestTotalPrice,
              handleConfirmRequestDeposit,
              handleRejectRequestFromDetail,
            }}
          />
      ) : (
        <section className="dashboard">
          <div className="dashboard-container">
            <h2 className="section-title">Không có quyền truy cập</h2>
            <p>Bạn cần đăng nhập bằng tài khoản quản trị để xem trang này.</p>
            <button className="cta-button" type="button" onClick={() => navigate('/')}>Về trang chủ</button>
          </div>
        </section>
      ))}

      {!adminMode && !showAboutSection && (
        <HomeContentSections
          servicesRef={servicesRef}
          selectedRentalType={selectedRentalType}
          visibleTestimonials={visibleTestimonials}
          hasMoreTestimonials={hasMoreTestimonials}
          canCollapseTestimonials={canCollapseTestimonials}
          handleLoadMoreTestimonials={handleLoadMoreTestimonials}
          handleCollapseTestimonials={handleCollapseTestimonials}
          isLoadingTestimonials={isLoadingTestimonials}
          loggedInUser={loggedInUser}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          reviewNotice={reviewNotice}
          setReviewNotice={setReviewNotice}
          handleReviewSubmit={handleReviewSubmit}
        />
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        danger={confirmDialog.danger}
        onConfirm={() => closeConfirmDialog(true)}
        onCancel={() => closeConfirmDialog(false)}
      />

      {/* FOOTER */}
      <AppFooter />
    </div>
  );
}
