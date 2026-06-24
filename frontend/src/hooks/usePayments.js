import { useState } from "react";
import { getReadableErrorMessage } from "../lib/toast.js";
import { getPaymentRejectCustomerMessage, sortPayments } from "../lib/paymentUtils.js";
import { contractService, paymentService, requestService } from "../services/dashboardService.js";

export default function usePayments({
  payments,
  contracts,
  customerById,
  carById,
  requestById,
  contractById,
  headers,
  canDeleteData,
  confirmAction = async () => true,
  setPayments,
  setRequests,
  refreshData,
  markNotificationRead,
  notify,
}) {
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStartFilter, setPaymentStartFilter] = useState("");
  const [paymentEndFilter, setPaymentEndFilter] = useState("");
  const [paymentBrandFilter, setPaymentBrandFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentSortOrder, setPaymentSortOrder] = useState("newest");
  const [expandedPaymentGroupKey, setExpandedPaymentGroupKey] = useState("");
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [creatingContractIds, setCreatingContractIds] = useState([]);
  const [notReceivedPayment, setNotReceivedPayment] = useState(null);

  const getPaymentContext = (payment) => {
    let contract = contractById.get(Number(payment.contract_id));
    if (!contract && payment.request_id) {
      contract = contracts.find((item) => Number(item.request_id) === Number(payment.request_id));
    }
    const request = requestById.get(Number(payment.request_id)) || requestById.get(Number(contract?.request_id));
    const customer = customerById.get(Number(request?.customer_id || contract?.customer_id));
    const car = carById.get(Number(request?.car_id || contract?.car_id));
    return { contract, request, customer, car };
  };

  const getPaymentDate = (payment) => {
    const { contract, request } = getPaymentContext(payment);
    return contract?.start_date || request?.start_date || payment.paid_at;
  };

  const getContractPayments = (contract) => {
    const contractId = Number(contract?.contract_id);
    const requestId = Number(contract?.request_id);
    return sortPayments(payments.filter((payment) => (
      (Number.isFinite(contractId) && Number(payment.contract_id) === contractId) ||
      (Number.isFinite(requestId) && Number(payment.request_id) === requestId)
    )));
  };

  const getContractPaymentSummary = (contract) => {
    const total = Number(contract?.total_price || 0);
    const relatedPayments = getContractPayments(contract);
    const paid = relatedPayments
      .filter((payment) => String(payment.status || "").toLowerCase() === "paid")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return {
      total,
      paid,
      remaining: Math.max(total - paid, 0),
      payments: relatedPayments,
    };
  };

  const openPaymentDetail = ({ contract = null, request = null, payments: detailPayments = null }, canManage = false) => {
    setSelectedPaymentDetail({ contract, request, payments: detailPayments, canManage });
  };

  const closePaymentDetail = () => setSelectedPaymentDetail(null);

  const getPaymentDetailData = (detail) => {
    const contract = detail?.contract || null;
    const request = detail?.request || requestById.get(Number(contract?.request_id)) || null;
    const detailPayments = detail?.payments || payments.filter((payment) => (
      (contract?.contract_id && Number(payment.contract_id) === Number(contract.contract_id)) ||
      (request?.request_id && Number(payment.request_id) === Number(request.request_id))
    ));
    const sortedDetailPayments = sortPayments(detailPayments);
    const customer = customerById.get(Number(request?.customer_id || contract?.customer_id));
    const car = carById.get(Number(request?.car_id || contract?.car_id));
    const total = Number(
      contract?.total_price ||
      sortedDetailPayments.find((payment) => Number(payment.total_amount || 0) > 0)?.total_amount ||
      sortedDetailPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    );
    const paid = sortedDetailPayments
      .filter((payment) => String(payment.status || "").toLowerCase() === "paid")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return {
      contract,
      request,
      customer,
      car,
      payments: sortedDetailPayments,
      total,
      paid,
      remaining: Math.max(total - paid, 0),
      canManage: Boolean(detail?.canManage),
    };
  };

  const handleDeletePaymentGroup = async (group) => {
    if (!canDeleteData) {
      notify("Bạn không có quyền xóa dữ liệu thanh toán.", "error");
      return;
    }
    const paymentIds = (group?.payments || [])
      .map((payment) => Number(payment.payment_id))
      .filter(Boolean);
    if (paymentIds.length === 0) return;
    const confirmed = await confirmAction({
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa thanh toán này không?",
      confirmText: "Xóa",
      danger: true,
    });
    if (!confirmed) return;

    try {
      await Promise.all(paymentIds.map((paymentId) => paymentService.remove(paymentId, headers)));
      setPayments((prev) => prev.filter((payment) => !paymentIds.includes(Number(payment.payment_id))));
      setExpandedPaymentGroupKey((current) => (current === group.key ? "" : current));
      setSelectedPaymentDetail((current) => {
        if (!current?.payments) return current;
        const currentPaymentIds = current.payments.map((payment) => Number(payment.payment_id));
        return currentPaymentIds.some((paymentId) => paymentIds.includes(paymentId)) ? null : current;
      });
      refreshData();
      notify("Đã xóa thanh toán.", "success");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Không thể xóa thanh toán"), "error");
    }
  };

  const handlePaymentAction = async (paymentId, action, options = {}) => {
    const actionMap = {
      confirm: {
        mutation: () => paymentService.confirm(paymentId, headers),
        patch: { status: "paid", paid_at: new Date().toISOString() },
        message: "Đã xác nhận thanh toán.",
      },
      reject: {
        mutation: () => paymentService.reject(
          paymentId,
          headers,
          options.reason ? { reason: options.reason } : undefined,
        ),
        patch: { status: "rejected", note: options.reason || "Chưa nhận được tiền" },
        message: options.reason
          ? "Đã từ chối và gửi thông báo cho khách hàng."
          : "Đã đánh dấu chưa nhận được tiền.",
      },
    };
    const config = actionMap[action];
    if (!config) return;

    try {
      await config.mutation();
      if (action === "confirm" || action === "reject") {
        setNotReceivedPayment((current) => (current?.payment_id === paymentId ? null : current));
      }
      setPayments((prev) => prev.map((payment) => (
        Number(payment.payment_id) === Number(paymentId) ? { ...payment, ...config.patch } : payment
      )));
      if (action === "reject") {
        const rejectedPayment = payments.find((payment) => Number(payment.payment_id) === Number(paymentId));
        if (rejectedPayment?.request_id) {
          setRequests((prev) => prev.map((request) => (
            Number(request.request_id) === Number(rejectedPayment.request_id)
              ? { ...request, status: "rejected" }
              : request
          )));
        }
      }
      setSelectedPaymentDetail((prev) => (
        prev
          ? {
              ...prev,
              payments: (prev.payments || []).map((payment) => (
                Number(payment.payment_id) === Number(paymentId) ? { ...payment, ...config.patch } : payment
              )),
            }
          : prev
      ));
      refreshData();
      notify(config.message, "success");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Không thể cập nhật thanh toán"), "error");
    }
  };

  const handlePaymentRejectNotify = async (payment, reasonText = "") => {
    if (!payment?.payment_id) return;
    const reason = String(reasonText || "").trim() || getPaymentRejectCustomerMessage(payment.payment_type);
    await handlePaymentAction(payment.payment_id, "reject", { reason });
    setNotReceivedPayment((current) => (current?.payment_id === payment.payment_id ? null : current));
  };

  const handleRejectRequestFromPayment = async (requestId, reasonText = "") => {
    const reason = String(reasonText || "").trim();
    if (!reason) {
      notify("Vui lòng nhập lý do từ chối.", "error");
      return;
    }

    try {
      await requestService.reject(requestId, { reason }, headers);
      setRequests((prev) => prev.map((request) => (
        Number(request.request_id) === Number(requestId) ? { ...request, status: "rejected" } : request
      )));
      markNotificationRead(`admin-rental-${requestId}`);
      refreshData();
      notify("Đã từ chối yêu cầu.", "success");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Không thể từ chối yêu cầu"), "error");
    }
  };

  const handleCreateContract = async (requestId) => {
    if (creatingContractIds.includes(requestId)) return;

    setCreatingContractIds((prev) => [...prev, requestId]);
    try {
      await contractService.createFromRequest(requestId, headers);
      refreshData();
      notify("Tạo hợp đồng thành công!", "success");
      markNotificationRead(`admin-rental-${requestId}`);
    } finally {
      setCreatingContractIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  return {
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
  };
}
