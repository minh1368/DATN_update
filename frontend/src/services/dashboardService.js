import { apiBlob, apiJson } from "./apiClient.js";

export const reportService = {
  getSummary: (headers) => apiJson("/reports/summary", { headers, fallbackError: "Không thể tải dữ liệu thống kê" }),
  exportReport: (format, headers) => {
    const isCsv = format === "csv";
    return apiBlob(`/reports/${isCsv ? "export-csv" : "export-excel"}`, {
      headers,
      fallbackError: `Không thể xuất ${isCsv ? "CSV" : "Excel"}`,
    });
  },
};

export const carService = {
  getAll: (headers) => apiJson("/cars", { headers }),
  getById: (carId, headers) => apiJson(`/cars/${carId}`, { headers }),
  create: (data, headers) => apiJson("/cars", { method: "POST", headers, body: data }),
  update: (carId, data, headers) => apiJson(`/cars/${carId}`, { method: "PUT", headers, body: data }),
  remove: (carId, headers) => apiJson(`/cars/${carId}`, { method: "DELETE", headers }),
};

export const customerService = {
  getAll: (headers) => apiJson("/customers", { headers }),
  getById: (customerId, headers) => apiJson(`/customers/${customerId}`, { headers }),
  findByEmail: (email) => apiJson(`/customers/by-email/${encodeURIComponent(email)}`),
  create: (data, headers) => apiJson("/customers", { method: "POST", headers, body: data }),
  createPublic: (data) => apiJson("/customers/public", { method: "POST", body: data }),
  update: (customerId, data, headers) => apiJson(`/customers/${customerId}`, { method: "PUT", headers, body: data }),
  updateProfile: (customerId, data, headers) => apiJson(`/customers/${customerId}/profile`, { method: "PUT", headers, body: data }),
  remove: (customerId, headers) => apiJson(`/customers/${customerId}`, { method: "DELETE", headers }),
  login: (data) => apiJson("/customers/login", { method: "POST", body: data }),
  requestPasswordReset: (data) => apiJson("/customers/reset-password/request", { method: "POST", body: data }),
  verifyPasswordResetOtp: (data) => apiJson("/customers/reset-password/verify", { method: "POST", body: data }),
  confirmPasswordReset: (data) => apiJson("/customers/reset-password/confirm", { method: "POST", body: data }),
};

export const requestService = {
  getAll: (headers) => apiJson("/rental_requests", { headers }),
  getByCustomer: (customerId) => apiJson(`/rental_requests/customer/${customerId}`),
  getCustomerDetails: (customerId) => apiJson(`/rental_requests/customer-details/${customerId}`),
  createCustomerRequest: (data) => apiJson("/rental_requests/customer", { method: "POST", body: data }),
  approve: (requestId, headers) => apiJson(`/rental_requests/${requestId}/approve`, { method: "PUT", headers }),
  reject: (requestId, data, headers) => apiJson(`/rental_requests/${requestId}/reject`, { method: "PUT", headers, body: data }),
  remove: (requestId, headers) => apiJson(`/rental_requests/${requestId}`, { method: "DELETE", headers }),
};

export const contractService = {
  getAll: (headers) => apiJson("/contracts", { headers }),
  createFromRequest: (requestId, headers) => apiJson(`/contracts/${requestId}`, { method: "POST", headers }),
  approve: (contractId, headers) => apiJson(`/contracts/${contractId}/approve`, { method: "PUT", headers }),
  returnCar: (contractId, headers) => apiJson(`/contracts/${contractId}/return`, { method: "PUT", headers }),
};

export const paymentService = {
  getAll: (headers) => apiJson("/payments", { headers }),
  confirm: (paymentId, headers) => apiJson(`/payments/${paymentId}/pay`, { method: "PUT", headers }),
  reject: (paymentId, headers, body) => apiJson(`/payments/${paymentId}/reject`, { method: "PUT", headers, body }),
  remove: (paymentId, headers) => apiJson(`/payments/${paymentId}`, { method: "DELETE", headers }),
};

export const reviewService = {
  getAll: () => apiJson("/reviews/"),
  create: (data) => apiJson("/reviews/", { method: "POST", body: data }),
};

export const userService = {
  getAll: (headers) => apiJson("/users", { headers }),
  login: (data) => apiJson("/users/login", { method: "POST", body: data }),
  requestPasswordReset: (data) => apiJson("/users/reset-password/request", { method: "POST", body: data }),
  verifyPasswordResetOtp: (data) => apiJson("/users/reset-password/verify", { method: "POST", body: data }),
  confirmPasswordReset: (data) => apiJson("/users/reset-password/confirm", { method: "POST", body: data }),
  create: (data, headers) => apiJson("/users", { method: "POST", headers, body: data }),
  update: (userId, data, headers) => apiJson(`/users/${userId}`, { method: "PUT", headers, body: data }),
  remove: (userId, headers) => apiJson(`/users/${userId}`, { method: "DELETE", headers }),
};

export async function getDashboardData(headers) {
  const [stats, cars, customers, requests, contracts, payments, users] = await Promise.all([
    reportService.getSummary(headers).catch(() => null),
    carService.getAll(headers).catch(() => []),
    customerService.getAll(headers).catch(() => []),
    requestService.getAll(headers).catch(() => []),
    contractService.getAll(headers).catch(() => []),
    paymentService.getAll(headers).catch(() => []),
    userService.getAll(headers).catch(() => []),
  ]);

  return { stats, cars, customers, requests, contracts, payments, users };
}

export async function getRequestPaymentData(headers) {
  const [requests, payments] = await Promise.all([
    requestService.getAll(headers).catch(() => null),
    paymentService.getAll(headers).catch(() => null),
  ]);

  return { requests, payments };
}
