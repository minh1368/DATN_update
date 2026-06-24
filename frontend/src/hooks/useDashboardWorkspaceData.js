import { useMemo } from "react";
import { VAT_RATE } from "../lib/config.js";
import { getRequestRentalDays } from "../lib/requestUtils.js";
import { getReadableErrorMessage } from "../lib/toast.js";
import {
  carService,
  contractService,
  customerService,
  reportService,
  requestService,
  userService,
} from "../services/dashboardService.js";

export default function useDashboardWorkspaceData({
  cars,
  customers,
  requests,
  contracts,
  payments,
  users,
  headers,
  canDeleteData,
  confirmAction = async () => true,
  refreshData,
  setShowLoginForm,
  notify,
}) {
  const derived = useMemo(() => {
    const dashboardUsers = users.filter((user) => user.role !== "customer");
    const staffEmails = new Set(
      dashboardUsers
        .map((user) => String(user.email || user.username || "").toLowerCase())
        .filter((email) => email.includes("@"))
    );
    const dashboardCustomers = customers.filter(
      (customer) => !customer.email || !staffEmails.has(String(customer.email).toLowerCase())
    );
    const customerById = new Map(customers.map((customer) => [Number(customer.customer_id), customer]));
    const carById = new Map(cars.map((car) => [Number(car.car_id), car]));
    const requestById = new Map(requests.map((request) => [Number(request.request_id), request]));
    const contractById = new Map(contracts.map((contract) => [Number(contract.contract_id), contract]));
    const depositPaymentByRequestId = new Map(
      payments
        .filter((payment) => payment.payment_type === "deposit" && payment.request_id)
        .map((payment) => [Number(payment.request_id), payment])
    );

    return {
      dashboardUsers,
      dashboardCustomers,
      customerById,
      carById,
      requestById,
      contractById,
      depositPaymentByRequestId,
    };
  }, [cars, contracts, customers, payments, requests, users]);

  const handleExport = async (format = "excel") => {
    setShowLoginForm(false);
    const isCsv = format === "csv";
    try {
      const blob = await reportService.exportReport(format, headers);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payments_report.${isCsv ? "csv" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      notify(`Không thể xuất ${isCsv ? "CSV" : "Excel"}. Vui lòng thử lại.`, "error");
    }
  };

  const runServiceMutation = async (mutation, fallbackMessage = "Thao tác thất bại") => {
    try {
      await mutation();
      refreshData();
      return true;
    } catch (error) {
      console.error(error);
      notify(error.message || fallbackMessage, "error");
      return false;
    }
  };

  const runDashboardDelete = async (mutation) => {
    if (!canDeleteData) {
      notify("Bạn không có quyền xóa dữ liệu này.", "error");
      return;
    }
    const confirmed = await confirmAction({
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa mục này không?",
      confirmText: "Xóa",
      danger: true,
    });
    if (!confirmed) return;

    try {
      await mutation();
      refreshData();
      notify("Đã xóa dữ liệu.", "success");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Không thể xóa dữ liệu"), "error");
    }
  };

  const getRequestTotalPrice = (request, car = derived.carById.get(Number(request?.car_id))) => {
    const depositPayment = derived.depositPaymentByRequestId.get(Number(request?.request_id));
    if (Number(depositPayment?.total_amount || 0) > 0) return Number(depositPayment.total_amount);
    const rentalFee = getRequestRentalDays(request) * Number(car?.price_per_day || 0);
    return rentalFee + Math.round(rentalFee * VAT_RATE);
  };

  return {
    ...derived,
    getRequestTotalPrice,
    handleExport,
    handleDeleteCar: (carId) => runDashboardDelete(() => carService.remove(carId, headers)),
    handleDeleteCustomer: (customerId) => runDashboardDelete(() => customerService.remove(customerId, headers)),
    handleDeleteRequest: (requestId) => runDashboardDelete(() => requestService.remove(requestId, headers)),
    handleDeleteUser: (userId) => runDashboardDelete(() => userService.remove(userId, headers)),
    onApproveContract: (contractId) => runServiceMutation(
      () => contractService.approve(contractId, headers),
      "Không thể duyệt hợp đồng"
    ),
    onReturnCar: async (contractId) => {
      const success = await runServiceMutation(
        () => contractService.returnCar(contractId, headers),
        "Không thể trả xe",
      );
      if (success) {
        notify(`Trả xe thành công cho hợp đồng HD${String(contractId).padStart(3, "0")}.`, "success");
      }
      return success;
    },
  };
}
