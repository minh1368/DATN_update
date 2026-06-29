export default function RequestDetailModal({
  selectedRequestDetail,
  customerById,
  carById,
  depositPaymentByRequestId,
  getRequestTotalPrice,
  formatMoneyValue,
  formatRequestStatus,
  requestRejectReason,
  setRequestRejectReason,
  showRequestRejectNote,
  setShowRequestRejectNote,
  setSelectedRequestDetail,
  handleConfirmRequestDeposit,
  handleRejectRequestFromDetail,
}) {
  if (!selectedRequestDetail) return null;

  const req = selectedRequestDetail;
  const customer = customerById.get(Number(req.customer_id));
  const car = carById.get(Number(req.car_id));
  const depositPayment = depositPaymentByRequestId.get(Number(req.request_id));
  const totalPrice = getRequestTotalPrice(req, car);
  const depositAmount = Number(
    depositPayment?.amount || Math.min(totalPrice, Math.max(300000, Math.round(totalPrice * 0.2))),
  );
  const requestStatus = String(req.status || "").toLowerCase();
  const depositStatus = String(depositPayment?.status || "").toLowerCase();
  const requestCode = `YC${String(req.request_id).padStart(3, "0")}`;
  const requestStatusLabel = formatRequestStatus(req.status);
  const requestStatusClass = requestStatus;
  const closeDetail = () => {
    setSelectedRequestDetail(null);
    setRequestRejectReason("");
    setShowRequestRejectNote(false);
  };
  const canConfirmDeposit = requestStatus === "pending";
  const canRejectRequest = !["approved", "rejected"].includes(requestStatus) && depositStatus !== "paid";

  return (
    <>
      <div className="modal-overlay" onClick={closeDetail} />
      <div className="request-detail-modal receipt-style">
        <button className="modal-close" type="button" onClick={closeDetail}>
          ×
        </button>

        <div className="payment-detail-receipt request-detail-receipt">
          <section className="payment-receipt-block payment-receipt-heading request-receipt-heading">
            <div>
              <h3>Thông tin yêu cầu {requestCode}</h3>
              <strong>{car?.name || "Xe"}</strong>
            </div>
            <span className={`request-status-pill status-${requestStatusClass}`}>
              {requestStatusLabel}
            </span>
          </section>

          <section className="payment-receipt-block payment-receipt-totals">
            <div>
              <span>Tổng tiền:</span>
              <strong>{formatMoneyValue(totalPrice)} VND</strong>
            </div>
            <div>
              <span>Tiền cọc:</span>
              <strong>{formatMoneyValue(depositAmount)} VND</strong>
            </div>
            <div>
              <span>Trạng thái:</span>
              <strong>{requestStatusLabel}</strong>
            </div>
          </section>

          <section className="payment-receipt-block payment-receipt-info">
            <div className="payment-receipt-column request-receipt-column">
              <h4>Khách hàng</h4>
              <div className="request-receipt-line">
                <span>Tên</span>
                <strong>{customer?.name || "-"}</strong>
              </div>
              <div className="request-receipt-line">
                <span>Số điện thoại</span>
                <strong>{customer?.phone || "-"}</strong>
              </div>
              <div className="request-receipt-line">
                <span>Email</span>
                <strong>{customer?.email || "-"}</strong>
              </div>
            </div>
            <div className="payment-receipt-column request-receipt-column">
              <h4>Thông tin thuê xe</h4>
              <div className="request-receipt-line">
                <span>Tên xe</span>
                <strong>{car?.name || "-"}</strong>
              </div>
              <div className="request-receipt-line">
                <span>Hãng xe</span>
                <strong>{car?.brand || "-"}</strong>
              </div>
              <div className="request-receipt-line">
                <span>Biển số</span>
                <strong>{car?.license_plate || "-"}</strong>
              </div>
              <div className="request-receipt-line">
                <span>Địa điểm nhận xe</span>
                <strong>{req.pickup_location || "-"}</strong>
              </div>
            </div>
          </section>
        </div>

        <div className="request-detail-actions">
          <button
            className="action-button"
            type="button"
            disabled={!canConfirmDeposit}
            onClick={() => handleConfirmRequestDeposit(req.request_id)}
          >
            {requestStatus === "approved" ? "Đã duyệt" : "Duyệt"}
          </button>
          {canRejectRequest ? (
            <button
              className="action-button secondary"
              type="button"
              onClick={() => handleRejectRequestFromDetail(req.request_id)}
            >
              {showRequestRejectNote ? "Xác nhận từ chối" : "Từ chối"}
            </button>
          ) : null}
        </div>

        {canRejectRequest && showRequestRejectNote ? (
          <label className="request-reject-note">
            <span>Lý do từ chối</span>
            <input
              type="text"
              value={requestRejectReason}
              onChange={(event) => setRequestRejectReason(event.target.value)}
              placeholder="Nhập lý do..."
            />
          </label>
        ) : null}
      </div>
    </>
  );
}
