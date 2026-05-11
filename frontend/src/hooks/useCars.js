import { useEffect, useMemo, useState } from "react";
import { fallbackCars } from "../lib/carData.js";

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
    fetch("http://localhost:8000/cars", { headers })
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

