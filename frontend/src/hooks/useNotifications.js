import { useCallback, useEffect, useRef, useState } from "react";
import { authStorage } from "../lib/auth.js";
import { getRequestPaymentData, requestService } from "../services/dashboardService.js";

function getStoredCustomerId() {
  const userData = JSON.parse(authStorage.getItem("userData") || "{}");
  return userData.customer_id || authStorage.getItem("customerId") || "";
}

function normalizeNotification(item) {
  if (!item || typeof item !== "object") return null;
  return {
    ...item,
    read: Boolean(item.read ?? item.is_read),
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
  };
}

function formatNotificationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function useNotifications({
  role,
  normalizedRole,
  loggedInUser,
  canAccessDashboard,
  onAdminData,
  onCustomerData,
  notify,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const adminReadyRef = useRef(false);
  const customerReadyRef = useRef(false);
  const customerPaymentReadyRef = useRef(false);
  const customerPaymentSuccessReadyRef = useRef(false);

  const customerId = getStoredCustomerId();
  const storageKey = canAccessDashboard
    ? `notifications:${normalizedRole}`
    : customerId
      ? `notifications:customer:${customerId}`
      : "notifications:guest";
  const unreadNotificationCount = notifications.filter((item) => !item.read).length;

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => {
      if (prev.some((item) => item.id === notification.id)) return prev;
      const next = [
        {
          ...notification,
          read: false,
          createdAt: notification.createdAt || new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 30);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const markNotificationRead = useCallback((notificationId) => {
    setNotifications((prev) => {
      const next = prev.map((item) => (
        item.id === notificationId ? { ...item, read: true } : item
      ));
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  useEffect(() => {
    adminReadyRef.current = false;
    customerReadyRef.current = false;
    customerPaymentReadyRef.current = false;
    customerPaymentSuccessReadyRef.current = false;
    try {
      const savedNotifications = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const normalized = Array.isArray(savedNotifications)
        ? savedNotifications.map(normalizeNotification).filter(Boolean)
        : [];
      setNotifications(normalized);
    } catch {
      setNotifications([]);
    }
  }, [role, loggedInUser, storageKey]);

  useEffect(() => {
    if (!loggedInUser || !canAccessDashboard) return undefined;
    let alive = true;
    const headers = {
      "Content-Type": "application/json",
    };
    const seenKey = `adminSeenRentalRequests:${role}`;

    const loadAdminRentalNotifications = async () => {
      try {
        const { requests: data, payments: paymentData } = await getRequestPaymentData(headers);
        if (alive && Array.isArray(paymentData)) {
          onAdminData?.({ payments: paymentData });
        }
        if (!Array.isArray(data)) return;

        if (alive) {
          onAdminData?.({ requests: data });
        }
        const seen = new Set(JSON.parse(localStorage.getItem(seenKey) || "[]").map(String));
        const ids = data.map((item) => String(item.request_id)).filter(Boolean);

        if (!adminReadyRef.current) {
          localStorage.setItem(seenKey, JSON.stringify(Array.from(new Set([...seen, ...ids]))));
          adminReadyRef.current = true;
          return;
        }

        const nextSeen = new Set([...seen, ...ids]);
        const newRequests = data.filter((item) => item.request_id && !seen.has(String(item.request_id)));
        if (newRequests.length > 0) {
          localStorage.setItem(seenKey, JSON.stringify(Array.from(nextSeen)));
        }
        if (!alive) return;

        newRequests.forEach((item) => {
          addNotification({
            id: `admin-rental-${item.request_id}`,
            title: "Yêu cầu thuê xe mới",
            message: `Khách hàng vừa gửi yêu cầu thuê xe #${item.request_id}.`,
            createdAt: item.created_at || new Date().toISOString(),
          });
          notify?.("Có yêu cầu thuê xe mới.", "info");
        });
      } catch {
        // Polling notification is intentionally silent.
      }
    };

    loadAdminRentalNotifications();
    const timer = window.setInterval(loadAdminRentalNotifications, 8000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [addNotification, canAccessDashboard, loggedInUser, normalizedRole, notify, onAdminData, role]);

  useEffect(() => {
    if (!loggedInUser || normalizedRole !== "customer" || !customerId) return undefined;
    let alive = true;
    const seenKey = `customerRentalStatusNotifications:${customerId}`;

    const paymentSeenKey = `customerPaymentRejectNotifications:${customerId}`;
    const paymentSuccessSeenKey = `customerPaymentSuccessNotifications:${customerId}`;

    const loadCustomerRentalNotifications = async () => {
      try {
        const [requestsData, detailsData] = await Promise.all([
          requestService.getByCustomer(customerId),
          requestService.getCustomerDetails(customerId),
        ]);
        const rentalRequests = Array.isArray(requestsData) ? requestsData : [];
        const rentalDetails = Array.isArray(detailsData) ? detailsData : [];
        onCustomerData?.(rentalRequests);

        const processedRequests = rentalRequests.filter((item) =>
          ["approved", "completed", "rejected"].includes(String(item.status || "").toLowerCase())
        );
        const seen = new Set(JSON.parse(localStorage.getItem(seenKey) || "[]").map(String));
        const ids = processedRequests
          .map((item) => `${item.request_id}:${String(item.status || "").toLowerCase()}`)
          .filter(Boolean);

        const nextSeen = new Set([...seen, ...ids]);
        const newlyProcessed = processedRequests.filter((item) => {
          const status = String(item.status || "").toLowerCase();
          return item.request_id && !seen.has(`${item.request_id}:${status}`);
        });
        if (newlyProcessed.length > 0) {
          localStorage.setItem(seenKey, JSON.stringify(Array.from(nextSeen)));
        }

        const paymentSeen = new Set(JSON.parse(localStorage.getItem(paymentSeenKey) || "[]").map(String));
        const paymentEvents = [];
        const existingPaymentEventIds = [];
        const paymentSuccessSeen = new Set(JSON.parse(localStorage.getItem(paymentSuccessSeenKey) || "[]").map(String));
        const paymentSuccessEvents = [];
        const existingPaymentSuccessEventIds = [];
        rentalDetails.forEach((item) => {
          ["deposit", "remaining"].forEach((paymentType) => {
            const paymentInfo = item.payments?.[paymentType];
            if (!paymentInfo || String(paymentInfo.status || "").toLowerCase() !== "rejected") return;
            const note = String(paymentInfo.note || "").trim();
            if (!note) return;
            const eventId = `${item.request_id}:${paymentType}:${paymentInfo.payment_id || note}`;
            existingPaymentEventIds.push(eventId);
            if (!paymentSeen.has(eventId)) {
              paymentEvents.push({
                eventId,
                requestId: item.request_id,
                note,
              });
            }
          });

          const depositStatus = String(item.payments?.deposit?.status || "").toLowerCase();
          const remainingStatus = String(item.payments?.remaining?.status || "").toLowerCase();
          const allPaid = depositStatus === "paid" && remainingStatus === "paid";
          if (!allPaid || !item.request_id) return;
          const eventId = `${item.request_id}:all-paid`;
          existingPaymentSuccessEventIds.push(eventId);
          if (!paymentSuccessSeen.has(eventId)) {
            paymentSuccessEvents.push({
              eventId,
              requestId: item.request_id,
            });
          }
        });

        const wasPaymentReady = customerPaymentReadyRef.current;
        if (!wasPaymentReady) {
          localStorage.setItem(
            paymentSeenKey,
            JSON.stringify(Array.from(new Set([...paymentSeen, ...existingPaymentEventIds]))),
          );
          customerPaymentReadyRef.current = true;
        } else if (paymentEvents.length > 0) {
          localStorage.setItem(
            paymentSeenKey,
            JSON.stringify(Array.from(new Set([...paymentSeen, ...paymentEvents.map((event) => event.eventId)]))),
          );
        }

        const wasPaymentSuccessReady = customerPaymentSuccessReadyRef.current;
        if (!wasPaymentSuccessReady) {
          localStorage.setItem(
            paymentSuccessSeenKey,
            JSON.stringify(Array.from(new Set([...paymentSuccessSeen, ...existingPaymentSuccessEventIds]))),
          );
          customerPaymentSuccessReadyRef.current = true;
        } else if (paymentSuccessEvents.length > 0) {
          localStorage.setItem(
            paymentSuccessSeenKey,
            JSON.stringify(Array.from(new Set([
              ...paymentSuccessSeen,
              ...paymentSuccessEvents.map((event) => event.eventId),
            ]))),
          );
        }

        if (!alive) return;

        newlyProcessed.forEach((item) => {
          const status = String(item.status || "").toLowerCase();
          if (status === "completed") {
            addNotification({
              id: `customer-${status}-${item.request_id}`,
              title: "Trả xe thành công",
              message: `Yêu cầu thuê xe #${item.request_id} đã hoàn tất. Cảm ơn bạn đã sử dụng dịch vụ.`,
              createdAt: item.updated_at || new Date().toISOString(),
            });
            notify?.("Trả xe thành công.", "success");
            return;
          }

          const isRejected = status === "rejected";
          addNotification({
            id: `customer-${status}-${item.request_id}`,
            title: isRejected ? "Yêu cầu thuê xe bị từ chối" : "Yêu cầu thuê xe đã được duyệt",
            message: isRejected
              ? `Yêu cầu thuê xe #${item.request_id} đã bị từ chối.`
              : `Yêu cầu thuê xe #${item.request_id} đã được duyệt. Chúng tôi sẽ tiếp tục kiểm tra các khoản thanh toán.`,
            createdAt: item.updated_at || new Date().toISOString(),
          });
          notify?.(
            isRejected
              ? "Yêu cầu thuê xe bị từ chối."
              : "Yêu cầu thuê xe đã được duyệt, chúng tôi sẽ kiểm tra thanh toán.",
            isRejected ? "error" : "info",
          );
        });

        if (wasPaymentSuccessReady) {
          paymentSuccessEvents.forEach((event) => {
            addNotification({
              id: `customer-payment-success-${event.eventId}`,
              title: "Xe được thuê thành công",
              message: `Yêu cầu thuê xe #${event.requestId} đã được xác nhận đủ thanh toán.`,
              createdAt: new Date().toISOString(),
            });
            notify?.("Xe được thuê thành công.", "success");
          });
        }

        if (wasPaymentReady) {
          paymentEvents.forEach((event) => {
            addNotification({
              id: `customer-payment-reject-${event.eventId}`,
              title: "Thanh toán chưa được xác nhận",
              message: `Yêu cầu #${event.requestId}: ${event.note}`,
              createdAt: new Date().toISOString(),
            });
            notify?.(event.note, "error");
          });
        }
      } catch {
        // Polling notification is intentionally silent.
      }
    };

    loadCustomerRentalNotifications();
    const timer = window.setInterval(loadCustomerRentalNotifications, 8000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [addNotification, customerId, loggedInUser, normalizedRole, notify, onCustomerData]);

  return {
    showNotifications,
    setShowNotifications,
    notifications,
    unreadNotificationCount,
    addNotification,
    markNotificationsRead,
    markNotificationRead,
    formatNotificationTime,
  };
}
