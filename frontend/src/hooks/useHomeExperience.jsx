import { useEffect, useRef, useState } from "react";
import { authStorage } from "../lib/auth.js";
import { canonicalizeBrand, selfDriveDetailPath } from "../lib/carUtils.js";
import { reviewService } from "../services/dashboardService.js";

const INITIAL_TESTIMONIALS_VISIBLE = 8;

export default function useHomeExperience({
  initialAbout,
  navigate,
  loggedInUser,
  setAuthMode,
  setShowLoginForm,
}) {
  const [customerReviews, setCustomerReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: "5", message: "" });
  const [reviewNotice, setReviewNotice] = useState("");
  const [testimonialCount, setTestimonialCount] = useState(INITIAL_TESTIMONIALS_VISIBLE);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);
  const [selectedRentalType, setSelectedRentalType] = useState("");
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [showAboutSection, setShowAboutSection] = useState(initialAbout);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  const carGridRef = useRef(null);
  const aboutRef = useRef(null);
  const servicesRef = useRef(null);
  const isDraggingRef = useRef(false);
  const preventClickRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const pointerIdRef = useRef(null);
  const pointerDetailPathRef = useRef(null);
  const lastWindowScrollYRef = useRef(0);

  const visibleTestimonials = customerReviews.slice(0, testimonialCount);
  const hasMoreTestimonials = customerReviews.length > testimonialCount;
  const canCollapseTestimonials = testimonialCount > INITIAL_TESTIMONIALS_VISIBLE;

  useEffect(() => {
    setShowAboutSection(initialAbout);
    if (initialAbout) setShowServiceOptions(false);
  }, [initialAbout]);

  useEffect(() => {
    let isActive = true;

    reviewService
      .getAll()
      .then((reviews) => {
        if (isActive) setCustomerReviews(Array.isArray(reviews) ? reviews : []);
      })
      .catch(() => {
        if (isActive) setCustomerReviews([]);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let ticking = false;

    const updateHeaderVisibility = () => {
      const currentY = Math.max(window.scrollY || 0, 0);
      const previousY = lastWindowScrollYRef.current;

      if (currentY < 90) {
        setIsHeaderHidden(false);
      } else if (currentY > previousY + 8) {
        setIsHeaderHidden(true);
        setShowServiceOptions(false);
      } else if (currentY < previousY - 8) {
        setIsHeaderHidden(false);
      }

      lastWindowScrollYRef.current = currentY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderVisibility);
        ticking = true;
      }
    };

    const handleWheel = (event) => {
      if (event.deltaY < -2) {
        setIsHeaderHidden(false);
      } else if (event.deltaY > 8 && (window.scrollY || 0) > 90) {
        setIsHeaderHidden(true);
        setShowServiceOptions(false);
      }
    };

    lastWindowScrollYRef.current = window.scrollY || 0;
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const handleLoadMoreTestimonials = () => {
    if (isLoadingTestimonials) return;
    setIsLoadingTestimonials(true);
    window.setTimeout(() => {
      setTestimonialCount((previous) => Math.min(previous + INITIAL_TESTIMONIALS_VISIBLE, customerReviews.length));
      setIsLoadingTestimonials(false);
    }, 180);
  };

  const handleCollapseTestimonials = () => {
    setTestimonialCount(INITIAL_TESTIMONIALS_VISIBLE);
  };

  const handleGridPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerIdRef.current = event.pointerId;
    pointerDetailPathRef.current = event.target.closest?.("[data-car-detail-path]")?.dataset.carDetailPath || null;
    isDraggingRef.current = false;
    preventClickRef.current = false;
    dragStartXRef.current = event.clientX;
    scrollStartRef.current = carGridRef.current?.scrollLeft || 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGridPointerMove = (event) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const deltaX = event.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) <= 6) return;

    event.preventDefault();
    isDraggingRef.current = true;
    preventClickRef.current = true;
    const grid = carGridRef.current;
    if (grid) {
      grid.classList.add("dragging");
      grid.scrollLeft = scrollStartRef.current - deltaX;
    }
  };

  const handleGridPointerUp = (event) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const wasDragging = preventClickRef.current;
    const detailPath =
      pointerDetailPathRef.current ||
      event.target.closest?.("[data-car-detail-path]")?.dataset.carDetailPath;
    const grid = carGridRef.current;
    if (grid) grid.classList.remove("dragging");
    pointerIdRef.current = null;
    isDraggingRef.current = false;
    if (event.currentTarget?.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (wasDragging) {
      window.setTimeout(() => {
        preventClickRef.current = false;
      }, 0);
    } else if (detailPath) {
      navigate(detailPath);
    }
    pointerDetailPathRef.current = null;
  };

  const handleCarCardClick = (event, car) => {
    if (preventClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    navigate(selfDriveDetailPath(car));
  };

  const handleSelectRentalType = (type) => {
    setSelectedRentalType(type);
    navigate(type === "tự lái" ? "/thue-xe-tu-lai" : "/thue-xe-co-lai");
  };

  const handleAboutNavClick = () => {
    setShowServiceOptions(false);
    setShowAboutSection(true);
    navigate("/gioi-thieu");
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!loggedInUser) {
      setReviewNotice("Bạn phải đăng nhập trước khi gửi đánh giá.");
      setAuthMode("login");
      setShowLoginForm(true);
      return;
    }

    const message = reviewForm.message.trim();
    if (!message) {
      setReviewNotice("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    let userData = {};
    try {
      userData = JSON.parse(authStorage.getItem("userData") || "{}");
    } catch {
      userData = {};
    }

    const payload = {
      customer_id: Number(authStorage.getItem("customerId")) || null,
      name: userData.name || loggedInUser,
      email: userData.email || userData.username || "",
      rating: Number(reviewForm.rating) || 5,
      message,
    };

    try {
      const savedReview = await reviewService.create(payload);
      setCustomerReviews((previous) => [savedReview, ...previous]);
      setReviewForm({ rating: "5", message: "" });
      setReviewNotice("Cảm ơn bạn đã gửi đánh giá.");
    } catch (error) {
      setReviewNotice(error.message || "Không thể gửi đánh giá, vui lòng thử lại.");
    }
  };

  const getCarCategory = (car) => (car.fuel_type ? car.fuel_type.toUpperCase() : "E-SUV");
  const getCarSeats = (car) => (car.seats ? `${car.seats} chỗ` : "4 chỗ");
  const getCarTransmission = (car) => car.transmission || "Tự động";
  const getCarSubtitle = (car) => `${canonicalizeBrand(car.brand) || "Xe chất"}`;
  const isCarRented = (car) => String(car?.status || "").toLowerCase() === "rented";
  const getCarColorSwatch = (color) => {
    const colorMap = {
      black: "#171717",
      blue: "#2f80ed",
      gray: "#8b949e",
      grey: "#8b949e",
      orange: "#f97316",
      red: "#ef4444",
      silver: "#c9d1d9",
      white: "#f8fafc",
      yellow: "#facc15",
    };
    return colorMap[String(color || "").trim().toLowerCase()] || "var(--accent-color)";
  };

  return {
    reviewForm,
    setReviewForm,
    reviewNotice,
    setReviewNotice,
    selectedRentalType,
    showServiceOptions,
    setShowServiceOptions,
    showAboutSection,
    setShowAboutSection,
    isHeaderHidden,
    visibleTestimonials,
    hasMoreTestimonials,
    canCollapseTestimonials,
    isLoadingTestimonials,
    carGridRef,
    aboutRef,
    servicesRef,
    handleLoadMoreTestimonials,
    handleCollapseTestimonials,
    handleGridPointerDown,
    handleGridPointerMove,
    handleGridPointerUp,
    handleCarCardClick,
    handleSelectRentalType,
    handleAboutNavClick,
    handleReviewSubmit,
    getCarCategory,
    getCarSeats,
    getCarTransmission,
    getCarSubtitle,
    isCarRented,
    getCarColorSwatch,
  };
}
