const PAYMENT_TYPE_ORDER = { deposit: 1, remaining: 2 };

export const PAYMENT_UNPAID_STATUSES = ["unpaid"];

export const isPaymentPaid = (payment) => String(payment?.status || "").toLowerCase() === "paid";

export const isDepositPayment = (payment) => String(payment?.payment_type || "").toLowerCase() === "deposit";

export const isRemainingPayment = (payment) => (
  String(payment?.payment_type || "").toLowerCase() === "remaining"
);

export const getDepositPayment = (payments = []) => payments.find(isDepositPayment);

export const isDepositPaidForGroup = (payments = []) => isPaymentPaid(getDepositPayment(payments));

export const getPaymentRejectCustomerMessage = (paymentType) => {
  const normalized = String(paymentType || "").toLowerCase();
  if (normalized === "deposit") return "Bạn chưa thanh toán tiền cọc";
  if (normalized === "remaining") return "Bạn chưa thanh toán tiền khi nhận xe";
  return "Bạn chưa thanh toán đủ tiền thuê xe";
};

export const canManagePaymentRow = (payment, groupPayments = []) => {
  const paymentStatus = String(payment?.status || "").toLowerCase();
  if (paymentStatus !== "unpaid") return false;
  if (isRemainingPayment(payment) && !isDepositPaidForGroup(groupPayments)) return false;
  return true;
};

export const sortPayments = (payments = []) => [...payments].sort((a, b) => {
  const left = PAYMENT_TYPE_ORDER[String(a.payment_type || "").toLowerCase()] || 9;
  const right = PAYMENT_TYPE_ORDER[String(b.payment_type || "").toLowerCase()] || 9;
  if (left !== right) return left - right;
  return Number(a.payment_id || 0) - Number(b.payment_id || 0);
});

export const formatMoneyValue = (value) => Number(value || 0).toLocaleString("vi-VN");

export const formatPaymentMethod = (method) => {
  const normalized = String(method || "").trim().toLowerCase();
  if (normalized === "cash") return "Tiền mặt";
  if (normalized === "transfer") return "Chuyển khoản";
  return method || "-";
};

export const formatPaymentType = (type) => {
  const normalized = String(type || "").trim().toLowerCase();
  if (normalized === "deposit") return "Đặt cọc";
  if (normalized === "remaining") return "Còn lại khi nhận xe";
  return type || "-";
};

export const formatPaymentStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "paid") return "Đã thanh toán";
  if (normalized === "unpaid") return "Chưa thanh toán";
  if (normalized === "rejected") return "Đã từ chối";
  return status || "-";
};

export const getPaymentStatusClass = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (["paid", "complete", "completed"].includes(normalized)) return "status-paid";
  if (normalized === "rejected") return "status-rejected";
  return "status-unpaid";
};

export const getPaymentGroupKey = ({ contract, request, payment }) => {
  if (contract?.contract_id) return `contract-${contract.contract_id}`;
  if (request?.request_id) return `request-${request.request_id}`;
  if (payment?.request_id) return `request-${payment.request_id}`;
  return `payment-${payment?.payment_id || "unknown"}`;
};

export const getPaymentGroupSummary = (group) => {
  const groupPayments = group?.payments || [];
  const total = Number(
    group?.contract?.total_price ||
    groupPayments.find((payment) => Number(payment.total_amount || 0) > 0)?.total_amount ||
    groupPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  );
  const paid = groupPayments
    .filter((payment) => String(payment.status || "").toLowerCase() === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remaining = Math.max(total - paid, 0);
  const paymentStatuses = groupPayments.map((payment) => String(payment.status || "").toLowerCase());
  const requestStatus = String(group?.request?.status || "").toLowerCase();
  const isRejectedRequest = requestStatus === "rejected";
  const hasPending = paymentStatuses.some((status) => status === "unpaid");
  const hasPaymentRejected = paymentStatuses.some((status) => status === "rejected");
  const rejectedFinalized = isRejectedRequest && (
    groupPayments.length === 0 ||
    paymentStatuses.every((status) => status === "rejected")
  );

  const status = rejectedFinalized
    ? "rejected"
    : isRejectedRequest || hasPaymentRejected
      ? "rejected"
      : remaining <= 0 && total > 0
        ? "paid"
        : hasPending
          ? "unpaid"
          : "unpaid";

  const statusLabel = rejectedFinalized
    ? "Đã từ chối"
    : isRejectedRequest || hasPaymentRejected
      ? "Đã từ chối"
      : remaining <= 0 && total > 0
        ? "Đã thanh toán"
        : hasPending
          ? "Chưa thanh toán"
          : "Chưa thanh toán";

  return { total, paid, remaining, status, statusLabel };
};

export function getPaymentGroupSortKey(group) {
  const maxPaymentId = Math.max(0, ...(group.payments || []).map((payment) => Number(payment.payment_id || 0)));
  const entityId = Number(group.contract?.contract_id || group.request?.request_id || 0);
  return { maxPaymentId, entityId };
}

export function sortPaymentGroups(groups = [], order = "newest") {
  const direction = order === "oldest" ? -1 : 1;
  return [...groups].sort((leftGroup, rightGroup) => {
    const left = getPaymentGroupSortKey(leftGroup);
    const right = getPaymentGroupSortKey(rightGroup);
    let diff = right.maxPaymentId - left.maxPaymentId;
    if (diff !== 0) return diff * direction;
    diff = right.entityId - left.entityId;
    if (diff !== 0) return diff * direction;
    return 0;
  });
}
