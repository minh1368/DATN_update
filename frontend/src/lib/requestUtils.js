export const formatRequestStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "pending") return "Chờ duyệt";
  if (normalized === "approved") return "Đã duyệt";
  if (normalized === "rejected") return "Đã từ chối";
  return status || "-";
};

export const formatContractStatusLabel = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "pending") return "Chờ duyệt";
  if (normalized === "approved") return "Đang thuê";
  if (normalized === "completed") return "Hoàn thành";
  if (normalized === "rejected") return "Đã từ chối";
  return status || "-";
};

export const formatDepositStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "unpaid") return "Chờ duyệt";
  if (normalized === "paid") return "Đã duyệt";
  if (normalized === "rejected") return "Đã từ chối";
  return status || "-";
};

export const getRequestRentalDays = (request) => {
  const start = new Date(request?.start_date);
  const end = new Date(request?.end_date);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
};
