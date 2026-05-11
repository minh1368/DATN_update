import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fallbackCars } from "../lib/carData.js";

const CarsContext = createContext(null);

export function CarsProvider({ children }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const headers = {
      "Content-Type": "application/json",
      "X-User-Role": "customer",
    };

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/cars", { headers });
      const data = res.ok ? await res.json() : [];
      setCars(Array.isArray(data) ? data : []);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const displayCars = useMemo(() => (cars.length > 0 ? cars : fallbackCars), [cars]);
  const value = useMemo(() => ({ cars, displayCars, loading, refresh, setCars }), [cars, displayCars, loading, refresh]);

  return <CarsContext.Provider value={value}>{children}</CarsContext.Provider>;
}

export function useCars() {
  const ctx = useContext(CarsContext);
  if (!ctx) throw new Error("useCars must be used within CarsProvider");
  return ctx;
}

