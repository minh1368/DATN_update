import { useEffect, useMemo, useState } from "react";
import { fallbackCars } from "../lib/carData.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function useCars({ role = "customer" } = {}) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = {
      "Content-Type": "application/json",
      "X-User-Role": role,
    };

    let alive = true;
    setLoading(true);
    fetch(`${API_BASE_URL}/cars`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!alive) return;
        setCars(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setCars([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [role]);

  const displayCars = useMemo(() => (cars.length > 0 ? cars : fallbackCars), [cars]);

  return { cars, displayCars, loading, setCars };
}

