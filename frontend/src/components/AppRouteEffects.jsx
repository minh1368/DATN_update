import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function RouteTransitionMarker({ locationKey }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timeoutId = window.setTimeout(() => setActive(false), 520);
    return () => window.clearTimeout(timeoutId);
  }, [locationKey]);

  return <div className={`page-transition-bar ${active ? "active" : ""}`} aria-hidden="true" />;
}

export function ToastHost() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timeoutId;
    const handleToast = (event) => {
      const { message, type = "info" } = event.detail || {};
      if (!message) return;
      setToast({ message, type });
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setToast(null), 3500);
    };

    window.addEventListener("app-toast", handleToast);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("app-toast", handleToast);
    };
  }, []);

  return toast ? (
    <div className={`app-toast ${toast.type}`} role="status">
      {toast.message}
    </div>
  ) : null;
}

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
