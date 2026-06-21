import { useCallback, useEffect, useMemo, useState } from "react";
import { useCars } from "../context/CarsContext.jsx";
import { getDashboardData, getRequestPaymentData } from "../services/dashboardService.js";

export default function useDashboardData({ canAccessDashboard, normalizedRole }) {
  const { cars: fetchedCars, displayCars: sharedDisplayCars, refresh: refreshCarsContext } = useCars();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [cars, setCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
  }), []);

  const refreshData = useCallback(() => {
    setStatsError(null);

    if (canAccessDashboard) {
      getDashboardData(headers)
        .then((data) => {
          if (!data.stats) setStatsError("Không thể tải dữ liệu thống kê");
          setStats(data.stats);
          setCars(Array.isArray(data.cars) ? data.cars : []);
          setCustomers(Array.isArray(data.customers) ? data.customers : []);
          setRequests(Array.isArray(data.requests) ? data.requests : []);
          setContracts(Array.isArray(data.contracts) ? data.contracts : []);
          setPayments(Array.isArray(data.payments) ? data.payments : []);
          setUsers(Array.isArray(data.users) ? data.users : []);
        })
        .catch(() => setStatsError("Không thể tải dữ liệu dashboard"));
      return;
    }

    refreshCarsContext();
    setStats(null);
    setCustomers([]);
    setRequests([]);
    setContracts([]);
    setPayments([]);
    setUsers([]);
  }, [canAccessDashboard, headers, refreshCarsContext]);

  const refreshRequestPaymentData = useCallback(async () => {
    if (!canAccessDashboard) {
      return { requests, payments };
    }

    const { requests: requestData, payments: paymentData } = await getRequestPaymentData(headers);
    const nextRequests = Array.isArray(requestData) ? requestData : requests;
    const nextPayments = Array.isArray(paymentData) ? paymentData : payments;

    if (Array.isArray(requestData)) setRequests(nextRequests);
    if (Array.isArray(paymentData)) setPayments(nextPayments);

    return { requests: nextRequests, payments: nextPayments };
  }, [canAccessDashboard, headers, payments, requests]);

  useEffect(() => {
    if (normalizedRole === "customer") {
      setCars(fetchedCars);
    }
  }, [fetchedCars, normalizedRole]);

  return {
    headers,
    stats,
    statsError,
    cars,
    customers,
    requests,
    contracts,
    payments,
    users,
    sharedDisplayCars,
    setStats,
    setCars,
    setCustomers,
    setRequests,
    setContracts,
    setPayments,
    setUsers,
    refreshData,
    refreshRequestPaymentData,
    refreshCarsContext,
  };
}
