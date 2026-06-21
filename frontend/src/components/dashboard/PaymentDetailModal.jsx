import PaymentRowActions from "./PaymentRowActions.jsx";

function formatShortDate(value) {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getPaymentMarker(status) {
  const normalized = String(status || "").toLowerCase();
  return ["paid", "refunded"].includes(normalized) ? "✓" : "○";
}

function shouldShowPaymentNote(note) {
  const normalized = String(note || "").trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith("đặt cọc yêu cầu #")) return false;
  if (normalized.startsWith("thanh toán phần còn lại khi nhận xe")) return false;
  return true;
}

export default function PaymentDetailModal({
  selectedPaymentDetail,
  getPaymentDetailData,
  formatContractStatusLabel,
  formatRequestStatus,
  closePaymentDetail,
  formatMoneyValue,
  formatPaymentType,
  formatPaymentStatus,
  handlePaymentAction,
  handlePaymentRejectNotify,
  notReceivedPayment,
  setNotReceivedPayment,
}) {
  if (!selectedPaymentDetail) return null;

  const detail = getPaymentDetailData(selectedPaymentDetail);
  const entityCode = detail.contract
    ? `HD${String(detail.contract.contract_id).padStart(3, "0")}`
    : `YC${String(detail.request?.request_id || "-").padStart(3, "0")}`;
  const modalTitle = detail.contract ? "Chi tiết hợp đồng" : "Chi tiết thanh toán";
  const startDate = detail.contract?.start_date || detail.request?.start_date || "-";
  const endDate = detail.contract?.end_date || detail.request?.end_date || "-";
  const statusLabel = detail.contract
    ? formatContractStatusLabel(detail.contract.status)
    : formatRequestStatus(detail.request?.status);
  const carName = detail.car?.name || "Xe";
  const pickupLocation = detail.request?.pickup_location || "-";

  return (
    <>
      <div className="modal-overlay" onClick={closePaymentDetail} />
      <div className="payment-detail-modal receipt-style">
        <button className="modal-close" type="button" onClick={closePaymentDetail}>
          ×
        </button>

        <div className="payment-detail-receipt">
          <section className="payment-receipt-block payment-receipt-heading">
            <h3>{modalTitle} {entityCode}</h3>
            <strong>{carName}</strong>
            <span>Trạng thái: {statusLabel}</span>
          </section>

          <section className="payment-receipt-block payment-receipt-totals">
            <div>
              <span>Tổng tiền:</span>
              <strong>{formatMoneyValue(detail.total)} VND</strong>
            </div>
            <div>
              <span>Đã thanh toán:</span>
              <strong>{formatMoneyValue(detail.paid)} VND</strong>
            </div>
            <div>
              <span>Còn lại:</span>
              <strong>{formatMoneyValue(detail.remaining)} VND</strong>
            </div>
          </section>

          <section className="payment-receipt-block payment-receipt-info">
            <div className="payment-receipt-column">
              <h4>Khách hàng</h4>
              <span>{detail.customer?.name || "-"}</span>
              <span>{detail.customer?.phone || "-"}</span>
              <span>{detail.customer?.email || "-"}</span>
            </div>
            <div className="payment-receipt-column">
              <h4>Thông tin thuê xe</h4>
              <span>{carName}</span>
              <span>{detail.car?.license_plate || "-"}</span>
              <span>{formatShortDate(startDate)} -&gt; {formatShortDate(endDate)}</span>
              <span>{pickupLocation}</span>
            </div>
          </section>

          <section className="payment-receipt-block payment-receipt-payments">
            <h4>Thanh toán</h4>
            {detail.payments.length ? detail.payments.map((payment) => {
              const paymentStatus = String(payment.status || "").toLowerCase();
              return (
                <div className="payment-receipt-payment" key={payment.payment_id}>
                  <div className="payment-receipt-payment-main">
                    <span>{getPaymentMarker(payment.status)} {formatPaymentType(payment.payment_type)}</span>
                    <strong>{formatMoneyValue(payment.amount)} VND</strong>
                  </div>
                  <small>{formatPaymentStatus(payment.status)}</small>
                  {shouldShowPaymentNote(payment.note) ? <p>{payment.note}</p> : null}
                  {detail.canManage ? (
                    <div className="payment-detail-actions payment-receipt-actions">
                      <PaymentRowActions
                        payment={payment}
                        groupPayments={detail.payments}
                        notReceivedPayment={notReceivedPayment}
                        setNotReceivedPayment={setNotReceivedPayment}
                        onConfirm={(paymentId) => handlePaymentAction(paymentId, "confirm")}
                        onRejectNotify={handlePaymentRejectNotify}
                        onRefund={(paymentId) => handlePaymentAction(paymentId, "refund")}
                        compact={false}
                      />
                      {String(payment.payment_type || "").toLowerCase() === "deposit" &&
                      ["pending", "unpaid"].includes(paymentStatus) &&
                      payment.request_id ? (
                        <button
                          className="action-button secondary"
                          type="button"
                          onClick={() => setNotReceivedPayment(payment)}
                        >
                          Từ chối yêu cầu
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            }) : (
              <div className="payment-detail-empty">
                Chưa có khoản thanh toán nào cho hợp đồng này.
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
