import {
  PAYMENT_UNPAID_STATUSES,
  canManagePaymentRow,
  isDepositPayment,
} from "../../lib/paymentUtils.js";

export default function PaymentRowActions({
  payment,
  groupPayments = [],
  setNotReceivedPayment,
  onConfirm,
  onRefund,
  compact = true,
}) {
  const paymentStatus = String(payment.status || "").toLowerCase();
  const isDeposit = isDepositPayment(payment);
  const canRefundDeposit = isDeposit && paymentStatus === "refund_pending" && Boolean(payment.paid_at);
  const canManage = canManagePaymentRow(payment, groupPayments);
  const canShowNotReceived = canManage && PAYMENT_UNPAID_STATUSES.includes(paymentStatus);
  const buttonClass = compact ? "action-button compact" : "action-button";
  const secondaryClass = compact ? "action-button compact secondary" : "action-button secondary";

  if (canRefundDeposit) {
    return (
      <button className={buttonClass} type="button" onClick={() => onRefund(payment.payment_id)}>
        Đã hoàn cọc
      </button>
    );
  }



  if (!canManage) {
    if (paymentStatus === "paid") {
      return (
        <button className={`${buttonClass} disabled`} type="button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
          Đã xác nhận
        </button>
      );
    }
    if (["rejected", "cancelled", "refunded", "refund_pending"].includes(paymentStatus)) {
      return (
        <button className={`${buttonClass} disabled`} type="button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
          Đã từ chối
        </button>
      );
    }
    return (
      <button className={`${buttonClass} disabled`} type="button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }} title="Cần xác nhận đặt cọc trước">
        Chờ xác nhận cọc
      </button>
    );
  }

  return (
    <>
      <button className={buttonClass} type="button" onClick={() => onConfirm(payment.payment_id)}>
        Đã nhận được
      </button>
      {canShowNotReceived ? (
        <button
          className={secondaryClass}
          type="button"
          onClick={() => setNotReceivedPayment(payment)}
        >
          Chưa nhận được
        </button>
      ) : null}
    </>
  );
}
