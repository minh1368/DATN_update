import { useEffect, useState } from "react";

export default function PaymentNotReceivedModal({
  notReceivedPayment,
  setNotReceivedPayment,
  onRejectNotify,
  onRejectRequest,
  formatMoneyValue,
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  useEffect(() => {
    setRejectReason("");
    setRejectReasonError("");
  }, [notReceivedPayment?.payment_id]);

  if (!notReceivedPayment) return null;

  const handleClose = () => {
    setNotReceivedPayment(null);
  };

  const handleReject = () => {
    const paymentType = String(notReceivedPayment.payment_type || "").toLowerCase();
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectReasonError("Vui lòng nhập lý do từ chối.");
      return;
    }
    if (paymentType === "deposit" && typeof onRejectRequest === "function") {
      onRejectRequest(notReceivedPayment.request_id, reason);
    } else if (typeof onRejectNotify === "function") {
      onRejectNotify(notReceivedPayment, reason);
    }
    setNotReceivedPayment(null);
  };

  const isDeposit = String(notReceivedPayment.payment_type || "").toLowerCase() === "deposit";

  return (
    <div className="modal-overlay payment-not-received-overlay" onClick={handleClose}>
      <div className="payment-not-received-modal" onClick={(event) => event.stopPropagation()}>
        <div className="payment-not-received-header">
          <div>
            <span>Thanh toán</span>
            <h3>Xác nhận chưa nhận được tiền</h3>
          </div>
          <button type="button" className="payment-not-received-close" onClick={handleClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <div className="payment-not-received-body">
          <p>
            Bạn đang xác nhận chưa nhận được khoản thanh toán{" "}
            <strong>{formatMoneyValue(notReceivedPayment.amount)} VND</strong>.
          </p>
          <p>Bạn muốn xử lý khoản thanh toán này như thế nào?</p>
          <label className="payment-not-received-reason">
            <span>Lý do từ chối</span>
            <textarea
              value={rejectReason}
              onChange={(event) => {
                setRejectReason(event.target.value);
                if (rejectReasonError) setRejectReasonError("");
              }}
              placeholder="Nhập lý do để thông báo cho khách hàng..."
              rows="3"
            />
            {rejectReasonError ? <small>{rejectReasonError}</small> : null}
          </label>
        </div>

        <div className="payment-not-received-actions">
          <button type="button" className="action-button danger" onClick={handleClose}>
            Chờ khách kiểm tra lại
          </button>
          <button type="button" className="action-button secondary" onClick={handleReject}>
            {isDeposit ? "Từ chối yêu cầu" : "Từ chối thanh toán"}
          </button>
        </div>
      </div>
    </div>
  );
}
