import { useState } from "react";
import { getReadableErrorMessage } from "../lib/toast.js";
import { requestService } from "../services/dashboardService.js";

export default function useRequests({
  headers,
  setRequests,
  setPayments,
  refreshData,
  refreshRequestPaymentData,
  markNotificationRead,
  notify,
}) {
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [requestRejectReason, setRequestRejectReason] = useState("");
  const [showRequestRejectNote, setShowRequestRejectNote] = useState(false);

  const openRequestDetail = async (request) => {
    setRequestRejectReason("");
    setShowRequestRejectNote(false);
    setSelectedRequestDetail(request);

    try {
      const latestData = await refreshRequestPaymentData();
      const freshRequest = latestData.requests.find((item) => (
        Number(item.request_id) === Number(request.request_id)
      ));
      if (freshRequest) setSelectedRequestDetail(freshRequest);
    } catch {
      notify("Không thể tải mới dữ liệu yêu cầu.", "error");
    }
  };

  const handleConfirmRequestDeposit = async (_paymentId, requestId) => {
    if (!requestId) return;

    try {
      await requestService.approve(requestId, headers);
      setRequests((prev) => prev.map((request) => (
        Number(request.request_id) === Number(requestId) ? { ...request, status: "approved" } : request
      )));
      setSelectedRequestDetail((prev) => (
        prev && Number(prev.request_id) === Number(requestId) ? { ...prev, status: "approved" } : prev
      ));
      await refreshRequestPaymentData();
      refreshData();
      markNotificationRead(`admin-rental-${requestId}`);
      notify("Đã xác nhận yêu cầu. Vui lòng kiểm tra thanh toán.", "success");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Không thể xác nhận yêu cầu"), "error");
    }
  };

  const handleRejectRequestFromDetail = async (requestId) => {
    if (!showRequestRejectNote) {
      setShowRequestRejectNote(true);
      return;
    }

    const reason = requestRejectReason.trim();
    if (!reason) {
      notify("Vui lòng nhập lý do từ chối.", "error");
      return;
    }

    try {
      await requestService.reject(requestId, { reason }, headers);
      setRequests((prev) => prev.map((request) => (
        Number(request.request_id) === Number(requestId) ? { ...request, status: "rejected" } : request
      )));
      setPayments((prev) => prev.map((payment) => (
        Number(payment.request_id) === Number(requestId) && String(payment.payment_type || "").toLowerCase() === "deposit"
          ? {
              ...payment,
              status: "rejected",
              note: `Lý do từ chối: ${reason}`,
            }
          : payment
      )));
      setSelectedRequestDetail((prev) => (
        prev && Number(prev.request_id) === Number(requestId) ? { ...prev, status: "rejected" } : prev
      ));
      setRequestRejectReason("");
      setShowRequestRejectNote(false);
      refreshData();
      notify("Đã từ chối yêu cầu.", "success");
    } catch (error) {
      notify(getReadableErrorMessage(error, "Không thể từ chối yêu cầu"), "error");
    }
  };

  return {
    selectedRequestDetail,
    setSelectedRequestDetail,
    requestRejectReason,
    setRequestRejectReason,
    showRequestRejectNote,
    setShowRequestRejectNote,
    openRequestDetail,
    handleConfirmRequestDeposit,
    handleRejectRequestFromDetail,
  };
}
