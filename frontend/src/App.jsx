import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import { Link } from "react-router-dom";
import AppFooter from "./components/AppFooter.jsx";
import SelfDrivePage from "./pages/SelfDrive.jsx";
import SelfDriveDetailPage from "./pages/SelfDriveDetail.jsx";
import ChauffeurDrivePage from "./pages/ChauffeurDrive.jsx";
import ProfilePage from "./pages/Profile.jsx";
import MyRentalsPage from "./pages/MyRentals.jsx";
import NewsPage from "./pages/NewsPage.jsx";
import NewsDetailPage from "./pages/NewsDetailPage.jsx";
import TermsPolicyPage from "./pages/TermsPolicyPage.jsx";
import { selfDriveDetailPath } from "./lib/carUtils.js";
import { useCars } from "./context/CarsContext.jsx";
import { getCarImageUrl } from "./lib/carUtils.js";
import { fallbackCars } from "./lib/carData.js";
import { getReadableErrorMessage, notifyUser } from "./lib/toast.js";

const authStorage = window.sessionStorage;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function normalizeRoleValue(value) {
  return String(value || "customer").trim().toLowerCase();
}

function readCarImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type?.startsWith("image/")) {
      reject(new Error("Vui lòng chọn đúng file ảnh xe."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc ảnh xe."));
    reader.onload = () => {
      const originalDataUrl = String(reader.result || "");
      const image = new Image();
      image.onerror = () => {
        if (originalDataUrl.startsWith("data:image/")) {
          resolve(originalDataUrl);
          return;
        }
        reject(new Error("Ảnh xe không hợp lệ."));
      };
      image.onload = () => {
        try {
          const maxSize = 1200;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.86));
        } catch {
          resolve(originalDataUrl);
        }
      };
      image.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function App() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <RouteTransitionMarker locationKey={location.pathname} />
      <div className="page-route-shell" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Home adminMode={true} />} />
        <Route path="/thue-xe-tu-lai" element={<SelfDrivePage />} />
        <Route path="/thue-xe-tu-lai/:carSlug" element={<SelfDriveDetailPage />} />
        <Route path="/thue-xe-co-lai" element={<ChauffeurDrivePage />} />
        <Route path="/gioi-thieu" element={<Home initialAbout={true} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-rentals" element={<MyRentalsPage />} />
        <Route path="/tin-tuc" element={<NewsPage />} />
        <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
        <Route path="/dieu-khoan-su-dung" element={<TermsPolicyPage />} />
      </Routes>
      </div>
      <FloatingChatWidget />
      <ToastHost />
    </>
  );
}

function RouteTransitionMarker({ locationKey }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timeoutId = window.setTimeout(() => setActive(false), 520);
    return () => window.clearTimeout(timeoutId);
  }, [locationKey]);

  return <div className={`page-transition-bar ${active ? "active" : ""}`} aria-hidden="true" />;
}

function ToastHost() {
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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function PasswordVisibilityIcon({ visible }) {
  return visible ? (
    <svg className="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 5.18A10.56 10.56 0 0 1 12 5c6.25 0 9.75 7 9.75 7a17.16 17.16 0 0 1-2.8 3.62" />
      <path d="M6.61 6.61C3.76 8.42 2.25 12 2.25 12s3.5 7 9.75 7a9.87 9.87 0 0 0 4.34-.99" />
    </svg>
  );
}

function PaymentActionIcon({ type }) {
  if (type === "edit") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 19.5h4.2L18.6 9.6a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4.5 15.3v4.2Z" />
        <path d="m13.2 6.6 4.2 4.2" />
      </svg>
    );
  }

  if (type === "check") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5 9.2 17 19 7" />
      </svg>
    );
  }

  if (type === "reject") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7l10 10M17 7 7 17" />
      </svg>
    );
  }

  if (type === "money") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="6.5" width="17" height="11" rx="2.2" />
        <path d="M6.8 9.2c1.2 0 2.2-1 2.2-2.2M17.2 9.2c-1.2 0-2.2-1-2.2-2.2M6.8 14.8c1.2 0 2.2 1 2.2 2.2M17.2 14.8c-1.2 0-2.2 1-2.2 2.2" />
        <circle cx="12" cy="12" r="2.4" />
      </svg>
    );
  }

  if (type === "return") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 14.5h11l1.6-4.2a2 2 0 0 0-1.9-2.7H8.8a2 2 0 0 0-1.9 1.4L5.5 14.5" />
        <path d="M5.5 14.5v2.8h13v-2.8" />
        <circle cx="8.4" cy="17.4" r="1.2" />
        <circle cx="15.6" cy="17.4" r="1.2" />
        <path d="M9.5 5.2H5.8a2.8 2.8 0 0 0 0 5.6H8" />
        <path d="M7 8.6 9.2 11 7 13.2" />
      </svg>
    );
  }

  return (
    <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.8h5V7" />
      <path d="M7 7l1 12.2c.1 1 1 1.8 2 1.8h4c1 0 1.9-.8 2-1.8L17 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </svg>
  );
}

function HomeSectionIcon({ type, className = "" }) {
  const icons = {
    selfDrive: (
      <>
        <path d="M4 14.2 5.6 9.5A3 3 0 0 1 8.4 7.5h7.2a3 3 0 0 1 2.8 2l1.6 4.7" />
        <path d="M5 14h14v4.2a1.3 1.3 0 0 1-1.3 1.3H16a1.3 1.3 0 0 1-1.3-1.3v-.7H9.3v.7A1.3 1.3 0 0 1 8 19.5H6.3A1.3 1.3 0 0 1 5 18.2V14Z" />
        <path d="M7.2 14.2h2M14.8 14.2h2M8 7.5l1-2h6l1 2" />
      </>
    ),
    chauffeur: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M6.2 20c.7-4.2 2.6-6.2 5.8-6.2s5.1 2 5.8 6.2" />
        <path d="M8.8 14.8 12 18l3.2-3.2" />
      </>
    ),
    enterprise: (
      <>
        <path d="M5 20V5.8A1.8 1.8 0 0 1 6.8 4h7.4A1.8 1.8 0 0 1 16 5.8V20" />
        <path d="M16 10h2.2A1.8 1.8 0 0 1 20 11.8V20M4 20h17" />
        <path d="M8 8h2M12 8h1M8 11h2M12 11h1M8 14h2M12 14h1" />
      </>
    ),
    route: (
      <>
        <path d="M6.5 18.5c2.7-2.5 8.3 1.2 10.8-1.7 2.7-3.2-4.5-5.4-2.1-8.5 1-1.3 2.7-1.8 4.2-1.8" />
        <circle cx="5.5" cy="18.5" r="2.2" />
        <circle cx="18.5" cy="6.5" r="2.2" />
        <path d="M9 6h.1M6 10h.1M12 12h.1" />
      </>
    ),
    sedan: (
      <>
        <path d="M3.7 13.7 5.5 9.6a3 3 0 0 1 2.8-1.8h7.4a3 3 0 0 1 2.8 1.8l1.8 4.1" />
        <path d="M5 13.5h14.2v4.4H5z" />
        <circle cx="8" cy="18" r="1.8" />
        <circle cx="16.2" cy="18" r="1.8" />
      </>
    ),
    van: (
      <>
        <path d="M4 7h9.2a2 2 0 0 1 2 2v1.4h2.2L20 14v3.5H4V7Z" />
        <path d="M15.2 10.4V14H20M7 10h2.5M11 10h1.3" />
        <circle cx="7.2" cy="17.5" r="1.8" />
        <circle cx="16.5" cy="17.5" r="1.8" />
      </>
    ),
    limousine: (
      <>
        <path d="M3.5 14.2h17v3.5h-17z" />
        <path d="M5.8 14.2 8 9.2h8l2.2 5" />
        <path d="M8.4 11.4h7.2M7 17.7h10" />
        <circle cx="7.2" cy="17.8" r="1.5" />
        <circle cx="16.8" cy="17.8" r="1.5" />
      </>
    ),
    bus: (
      <>
        <rect x="5" y="4.5" width="14" height="14" rx="2.2" />
        <path d="M7.5 8h9M7.5 11h9M8 18.5v1.5M16 18.5v1.5" />
        <circle cx="8.5" cy="15" r="1.1" />
        <circle cx="15.5" cy="15" r="1.1" />
      </>
    ),
    quote: (
      <>
        <path d="M8.4 6.5c-2.2 1.4-3.4 3.1-3.4 5.4v4.6h5.1v-5H7.6c.1-1.4.9-2.4 2.3-3.2L8.4 6.5Z" />
        <path d="M16.8 6.5c-2.2 1.4-3.4 3.1-3.4 5.4v4.6h5.1v-5H16c.1-1.4.9-2.4 2.3-3.2l-1.5-1.8Z" />
      </>
    ),
    review: (
      <>
        <path d="m12 3.8 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8L5 8.9l4.8-.7L12 3.8Z" />
      </>
    ),
    account: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.7 20c.8-4 2.9-6 6.3-6s5.5 2 6.3 6" />
      </>
    ),
    support: (
      <>
        <path d="M5 12a7 7 0 0 1 14 0v3a2.5 2.5 0 0 1-2.5 2.5H15" />
        <path d="M5 12v3.2A1.8 1.8 0 0 0 6.8 17H8v-5H5ZM19 12v5h-3v-5h3Z" />
        <path d="M11 19h3" />
      </>
    ),
    airport: (
      <>
        <path d="M12 3.8v16.4" />
        <path d="M4.4 13.7 12 10l7.6 3.7v2.1L12 13.7l-7.6 2.1v-2.1Z" />
        <path d="m9.1 20.2 2.9-2 2.9 2M9.5 6.5 12 4l2.5 2.5" />
      </>
    ),
    customService: (
      <>
        <rect x="4.5" y="5" width="15" height="11" rx="2.2" />
        <path d="M8 19h8M10 16v3M14 16v3M8 9.2h3.1M8 12h6.8" />
        <path d="m17.4 8.4 1.1 1.1-2.9 2.9-1.6.5.5-1.6 2.9-2.9Z" />
      </>
    ),
    history: (
      <>
        <path d="M12 7v5l3.4 2" />
        <path d="M5.3 8.5A8 8 0 1 1 4 13" />
        <path d="M4 5.8v3.4h3.4" />
      </>
    ),
    mission: (
      <>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="3.8" />
        <path d="M12 3.5V6M20.5 12H18M12 18v2.5M6 12H3.5" />
      </>
    ),
    trust: (
      <>
        <path d="M12 3.7 18.5 6v5.2c0 4.2-2.5 7.2-6.5 8.9-4-1.7-6.5-4.7-6.5-8.9V6L12 3.7Z" />
        <path d="m8.7 12.1 2.2 2.2 4.6-5" />
      </>
    ),
    safety: (
      <>
        <path d="M6 15.8V9.5l6-3.8 6 3.8v6.3" />
        <path d="M8.5 20h7M9.2 15.8c.6-1.4 1.5-2.1 2.8-2.1s2.2.7 2.8 2.1" />
        <circle cx="12" cy="10.7" r="2.1" />
      </>
    ),
    partnership: (
      <>
        <path d="M8.5 12.8 6.8 11a2.2 2.2 0 0 1 0-3.1 2.2 2.2 0 0 1 3.1 0l1.1 1.1" />
        <path d="m15.5 11.2 1.7 1.8a2.2 2.2 0 0 1 0 3.1 2.2 2.2 0 0 1-3.1 0L13 15" />
        <path d="m9.5 15.2 5-6.4" />
      </>
    ),
    gps: (
      <>
        <path d="M12 21s6-5.2 6-10.2a6 6 0 1 0-12 0C6 15.8 12 21 12 21Z" />
        <circle cx="12" cy="10.8" r="2.3" />
      </>
    ),
    fuel: (
      <>
        <path d="M7 20V5.5A1.5 1.5 0 0 1 8.5 4h5A1.5 1.5 0 0 1 15 5.5V20" />
        <path d="M6 20h10M9 8h4M15 8.5l3 3V18a1.5 1.5 0 0 0 3 0v-3.8" />
        <path d="M18 11.5h2" />
      </>
    ),
    team: (
      <>
        <circle cx="12" cy="7.2" r="2.8" />
        <circle cx="6.8" cy="10.2" r="2.2" />
        <circle cx="17.2" cy="10.2" r="2.2" />
        <path d="M6 20c.7-3.6 2.7-5.4 6-5.4s5.3 1.8 6 5.4" />
        <path d="M2.8 18.5c.5-2.4 1.8-3.7 4-3.8M17.2 14.7c2.2.1 3.5 1.4 4 3.8" />
      </>
    ),
    star: (
      <path d="m12 3.8 2.2 4.45 4.9.72-3.55 3.46.84 4.88L12 15l-4.39 2.31.84-4.88L4.9 8.97l4.9-.72L12 3.8Z" />
    ),
  };

  return (
    <span className={`home-section-icon home-section-icon-${type} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">{icons[type]}</svg>
    </span>
  );
}

function RatingRow({ rating = 5 }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span className="rating-icons" aria-label={`${value} sao`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < value ? "filled" : ""}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 3.8 2.2 4.45 4.9.72-3.55 3.46.84 4.88L12 15l-4.39 2.31.84-4.88L4.9 8.97l4.9-.72L12 3.8Z" />
          </svg>
        </span>
      ))}
    </span>
  );
}

function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState("ai");
  const [input, setInput] = useState("");
  const [humanMessage, setHumanMessage] = useState("");
  const [staffReply, setStaffReply] = useState("");
  const [humanSent, setHumanSent] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => authStorage.getItem("supportConversationId") || "");
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportConversations, setSupportConversations] = useState([]);
  const [selectedSupportConversation, setSelectedSupportConversation] = useState(null);
  const [supportStatus, setSupportStatus] = useState("");
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const selectedSupportConversationIdRef = useRef(null);
  const supportMessagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Xin chào, tôi có thể hỗ trợ bạn xem xe, giá thuê, đặt xe hoặc thông tin tài khoản.",
    },
  ]);

  const getChatUser = () => {
    const userData = JSON.parse(authStorage.getItem("userData") || "{}");
    const role = normalizeRoleValue(userData.role || authStorage.getItem("userRole") || "customer");
    return {
      role,
      customerId: userData.customer_id || authStorage.getItem("customerId") || null,
      name: userData.name || authStorage.getItem("loggedInUser") || "Khách hàng",
      email: userData.email || userData.username || "",
    };
  };

  const chatUser = getChatUser();
  const isStaffChat = chatUser.role === "admin" || chatUser.role === "staff";

  const loadSupportMessages = async (id) => {
    if (!id) return;
    const response = await fetch(`${API_BASE_URL}/support/conversations/${id}/messages`);
    if (!response.ok) return;
    const data = await response.json();
    setSupportMessages(Array.isArray(data) ? data : []);
  };

  const markSupportRead = async (id, reader) => {
    if (!id) return;
    await fetch(`${API_BASE_URL}/support/conversations/${id}/read/${reader}`, { method: "POST" }).catch(() => {});
    if (reader === "customer") {
      refreshCustomerUnread(id);
    } else {
      loadSupportConversations();
    }
  };

  const refreshCustomerUnread = async (id = conversationId) => {
    if (!id || isStaffChat) return;
    const response = await fetch(`${API_BASE_URL}/support/conversations/${id}`);
    if (!response.ok) return;
    const data = await response.json();
    setSupportUnreadCount(Number(data.customer_unread_count || 0));
  };

  const loadSupportConversations = async () => {
    const response = await fetch(`${API_BASE_URL}/support/conversations`, {
      headers: { "X-User-Role": chatUser.role },
    });
    if (!response.ok) return;
    const data = await response.json();
    const conversations = Array.isArray(data) ? data : [];
    setSupportConversations(conversations);
    setSupportUnreadCount(conversations.reduce((total, item) => total + Number(item.staff_unread_count || 0), 0));
    const selectedId = selectedSupportConversationIdRef.current;
    const stillSelected = selectedId
      ? conversations.find((conversation) => String(conversation.conversation_id) === String(selectedId))
      : null;

    if (stillSelected) {
      setSelectedSupportConversation(stillSelected);
      return;
    }

    if (!selectedId && conversations.length > 0) {
      selectedSupportConversationIdRef.current = conversations[0].conversation_id;
      setSelectedSupportConversation(conversations[0]);
      loadSupportMessages(conversations[0].conversation_id);
    }
  };

  useEffect(() => {
    if (!isOpen || chatMode !== "human") return;
    if (isStaffChat) {
      loadSupportConversations();
      if (selectedSupportConversation?.conversation_id) {
        markSupportRead(selectedSupportConversation.conversation_id, "staff");
      }
      return;
    }
    ensureSupportConversation()
      .then((id) => {
        loadSupportMessages(id);
        markSupportRead(id, "customer");
      })
      .catch(() => setSupportStatus("Không thể mở khung chat nhân viên."));
  }, [isOpen, chatMode, conversationId, isStaffChat]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isStaffChat) {
        loadSupportConversations();
      } else if (conversationId) {
        refreshCustomerUnread(conversationId);
      }
    }, 6000);
    if (isStaffChat) {
      loadSupportConversations();
    } else if (conversationId) {
      refreshCustomerUnread(conversationId);
    }
    return () => window.clearInterval(timer);
  }, [isStaffChat, conversationId]);

  useEffect(() => {
    if (!isOpen || chatMode !== "human") return;
    const timer = window.setInterval(() => {
      if (isStaffChat) {
        loadSupportConversations();
        if (selectedSupportConversation?.conversation_id) {
          loadSupportMessages(selectedSupportConversation.conversation_id);
          markSupportRead(selectedSupportConversation.conversation_id, "staff");
        }
      } else if (conversationId) {
        loadSupportMessages(conversationId);
        markSupportRead(conversationId, "customer");
      }
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isOpen, chatMode, isStaffChat, conversationId, selectedSupportConversation?.conversation_id]);

  useEffect(() => {
    if (!isOpen || chatMode !== "human") return;
    window.requestAnimationFrame(() => {
      supportMessagesEndRef.current?.scrollIntoView({ block: "end" });
    });
  }, [supportMessages, isOpen, chatMode, selectedSupportConversation?.conversation_id]);

  const ensureSupportConversation = async () => {
    if (conversationId) return conversationId;
    const response = await fetch(`${API_BASE_URL}/support/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: chatUser.customerId ? Number(chatUser.customerId) : null,
        customer_name: chatUser.name,
        customer_email: chatUser.email,
      }),
    });
    if (!response.ok) throw new Error("Không thể tạo cuộc trò chuyện.");
    const data = await response.json();
    authStorage.setItem("supportConversationId", String(data.conversation_id));
    setConversationId(String(data.conversation_id));
    return String(data.conversation_id);
  };

  const handleSendAiMessage = async (event) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isAiLoading) return;

    const history = messages.map((message) => ({
      role: message.role === "bot" ? "assistant" : "user",
      content: message.text,
    }));
    setMessages((prev) => [...prev, { role: "user", text: trimmedInput }]);
    setInput("");
    setIsAiLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput, messages: history }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "AI không phản hồi.");
      }
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: error.message || "Không thể kết nối AI lúc này. Bạn thử lại sau hoặc chuyển sang tab Nhân viên.",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendHumanMessage = async (event) => {
    event.preventDefault();
    const trimmedMessage = humanMessage.trim();
    if (!trimmedMessage) return;

    try {
      const id = await ensureSupportConversation();
      const response = await fetch(`${API_BASE_URL}/support/conversations/${id}/customer-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage }),
      });
      if (!response.ok) throw new Error("Không gửi được tin nhắn.");
      setHumanMessage("");
      setHumanSent(true);
      setSupportStatus("");
      loadSupportMessages(id);
    } catch (error) {
      setSupportStatus(error.message || "Không gửi được tin nhắn.");
    }
  };

  const handleSelectSupportConversation = (conversation) => {
    selectedSupportConversationIdRef.current = conversation.conversation_id;
    setSelectedSupportConversation(conversation);
    setStaffReply("");
    loadSupportMessages(conversation.conversation_id);
    markSupportRead(conversation.conversation_id, "staff");
  };

  const handleSendStaffReply = async (event) => {
    event.preventDefault();
    const text = staffReply.trim();
    if (!text || !selectedSupportConversation) return;

    const response = await fetch(
      `${API_BASE_URL}/support/conversations/${selectedSupportConversation.conversation_id}/staff-message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": chatUser.role,
        },
        body: JSON.stringify({ message: text }),
      }
    );
    if (!response.ok) {
      setSupportStatus("Không gửi được phản hồi.");
      return;
    }
    setStaffReply("");
    setSupportStatus("");
    loadSupportMessages(selectedSupportConversation.conversation_id);
    loadSupportConversations();
  };

  return (
    <div className="floating-chat">
      {isOpen ? (
        <div className={`chat-panel ${isStaffChat ? "admin-chat-panel" : ""}`}>
          <div className="chat-header">
            <div>
              <strong>Hỗ trợ khách hàng</strong>
              <span>{chatMode === "ai" ? "Trợ lý AI" : "Nhân viên tư vấn"}</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chat">×</button>
          </div>
          <div className="chat-tabs">
            <button type="button" className={chatMode === "ai" ? "active" : ""} onClick={() => setChatMode("ai")}>
              AI
            </button>
            <button type="button" className={chatMode === "human" ? "active" : ""} onClick={() => setChatMode("human")}>
              {isStaffChat ? "Khách hàng" : "Nhân viên"}
            </button>
          </div>

          {isStaffChat && chatMode === "human" ? (
            <div className="admin-support-chat">
              <aside className="support-inbox">
                {supportConversations.length > 0 ? (
                  supportConversations.map((conversation) => (
                    <button
                      type="button"
                      key={conversation.conversation_id}
                      className={`support-inbox-item ${
                        selectedSupportConversation?.conversation_id === conversation.conversation_id ? "active" : ""
                      }`}
                      onClick={() => handleSelectSupportConversation(conversation)}
                    >
                      <strong>{conversation.customer_name}</strong>
                      {Number(conversation.staff_unread_count || 0) > 0 ? (
                        <em>{Number(conversation.staff_unread_count) > 9 ? "9+" : conversation.staff_unread_count}</em>
                      ) : null}
                      <span>{conversation.latest_message || "Chưa có tin nhắn"}</span>
                    </button>
                  ))
                ) : (
                  <div className="support-empty">Chưa có khách hàng nhắn tin.</div>
                )}
              </aside>
              <section className="support-thread">
                <div className="support-thread-title">
                  {selectedSupportConversation ? (
                    <>
                      <strong>{selectedSupportConversation.customer_name}</strong>
                      <span>{selectedSupportConversation.customer_email || "Không có email"}</span>
                    </>
                  ) : (
                    <span>Chọn một khách hàng để trả lời</span>
                  )}
                </div>
                <div className="chat-messages support-thread-messages">
                  {supportMessages.map((message) => (
                    <div
                      key={message.message_id}
                      className={`chat-message ${message.sender === "staff" ? "user" : "bot"}`}
                    >
                      {message.message}
                    </div>
                  ))}
                  <div ref={supportMessagesEndRef} className="chat-scroll-anchor" />
                </div>
                <form className="chat-input-row" onSubmit={handleSendStaffReply}>
                  <input
                    value={staffReply}
                    onChange={(event) => setStaffReply(event.target.value)}
                    placeholder="Nhập phản hồi..."
                    disabled={!selectedSupportConversation}
                  />
                  <button type="submit" disabled={!selectedSupportConversation}>Gửi</button>
                </form>
                {supportStatus ? <span className="human-chat-status">{supportStatus}</span> : null}
              </section>
            </div>
          ) : chatMode === "ai" ? (
            <>
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
                    {message.text}
                  </div>
                ))}
                {isAiLoading ? <div className="chat-message bot">AI đang trả lời...</div> : null}
              </div>
              <form className="chat-input-row" onSubmit={handleSendAiMessage}>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Nhập câu hỏi..."
                  disabled={isAiLoading}
                />
                <button type="submit" disabled={isAiLoading}>Gửi</button>
              </form>
            </>
          ) : (
            <div className="human-chat">
              <div className="chat-messages support-customer-messages">
                {supportMessages.length > 0 ? (
                  supportMessages.map((message) => (
                    <div
                      key={message.message_id}
                      className={`chat-message ${message.sender === "customer" ? "user" : "bot"}`}
                    >
                      {message.message}
                    </div>
                  ))
                ) : (
                  <div className="chat-message bot">Bạn đang chat với nhân viên tư vấn. Hãy gửi lời nhắn để bắt đầu.</div>
                )}
                <div ref={supportMessagesEndRef} className="chat-scroll-anchor" />
              </div>
              <form className="chat-input-row" onSubmit={handleSendHumanMessage}>
                <input
                  value={humanMessage}
                  onChange={(event) => {
                    setHumanSent(false);
                    setHumanMessage(event.target.value);
                  }}
                  placeholder="Nhập lời nhắn cho nhân viên..."
                />
                <button type="submit">Gửi</button>
              </form>
              {humanSent ? <span className="human-chat-status">Đã gửi tin nhắn. Nhân viên sẽ phản hồi trong khung chat này.</span> : null}
              {supportStatus ? <span className="human-chat-status">{supportStatus}</span> : null}
            </div>
          )}
        </div>
      ) : null}

      <button
        className="chat-launcher"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Mở hỗ trợ khách hàng"
        title="Hỗ trợ khách hàng"
      >
        {supportUnreadCount > 0 ? (
          <span className="chat-unread-badge">{supportUnreadCount > 9 ? "9+" : supportUnreadCount}</span>
        ) : null}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.5 5.5A3.5 3.5 0 0 1 8 2h8a3.5 3.5 0 0 1 3.5 3.5v6A3.5 3.5 0 0 1 16 15h-4.8l-4.37 3.4A.85.85 0 0 1 5.5 17.72V15A3.5 3.5 0 0 1 2 11.5v-6Z" />
          <path d="M8 8h8" />
          <path d="M8 11h5" />
        </svg>
      </button>
    </div>
  );
}

function Home({ adminMode = false, initialAbout = false }) {
  const [role, setRole] = useState("customer");
  const [activeTab, setActiveTab] = useState("summary");
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [summaryRange, setSummaryRange] = useState("all");
  const [summaryStartDate, setSummaryStartDate] = useState("");
  const [summaryEndDate, setSummaryEndDate] = useState("");
  const [requestStartFilter, setRequestStartFilter] = useState("");
  const [requestEndFilter, setRequestEndFilter] = useState("");
  const [contractStartFilter, setContractStartFilter] = useState("");
  const [contractEndFilter, setContractEndFilter] = useState("");
  const { cars: fetchedCars, displayCars: sharedDisplayCars, refresh: refreshCarsContext } = useCars();
  const [cars, setCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [newCar, setNewCar] = useState({
    name: "",
    brand: "",
    license_plate: "",
    price_per_day: "",
    status: "available",
    color: "",
    seats: "",
    fuel_type: "",
    transmission: "",
    year: "",
    description: "",
    image_url: "",
  });
  const [showCreateCarForm, setShowCreateCarForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [carSearch, setCarSearch] = useState("");
  const [carFilters, setCarFilters] = useState({
    brand: "",
    minPrice: "",
    maxPrice: "",
    status: "",
    seats: "",
    transmission: "",
    year: "",
  });
  const [carsPage, setCarsPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [contractsPage, setContractsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [contractSearch, setContractSearch] = useState("");
  const [contractBrandFilter, setContractBrandFilter] = useState("");
  const [contractStatusFilter, setContractStatusFilter] = useState("");
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentCarFilter, setPaymentCarFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showCreateCustomerForm, setShowCreateCustomerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "staff",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const normalizedRole = normalizeRoleValue(role);
  const canAccessDashboard = normalizedRole === "admin" || normalizedRole === "staff";
  const isAdmin = normalizedRole === "admin";
  const [customerReviews, setCustomerReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: "5", message: "" });
  const [reviewNotice, setReviewNotice] = useState("");
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedRentalType, setSelectedRentalType] = useState("tự lái");
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [showAboutSection, setShowAboutSection] = useState(initialAbout);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [creatingContractIds, setCreatingContractIds] = useState([]);
  const navigate = useNavigate();
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
  const adminNotificationReadyRef = useRef(false);
  const customerNotificationReadyRef = useRef(false);

  useEffect(() => {
    setShowAboutSection(initialAbout);
    if (initialAbout) {
      setShowServiceOptions(false);
    }
  }, [initialAbout]);

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
    if (Math.abs(deltaX) > 6) {
      event.preventDefault();
      isDraggingRef.current = true;
      preventClickRef.current = true;
      const grid = carGridRef.current;
      if (grid) {
        grid.classList.add("dragging");
        grid.scrollLeft = scrollStartRef.current - deltaX;
      }
    }
  };

  const handleGridPointerUp = (event) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const wasDragging = preventClickRef.current;
    const detailPath =
      pointerDetailPathRef.current ||
      event.target.closest?.("[data-car-detail-path]")?.dataset.carDetailPath;
    const grid = carGridRef.current;
    if (grid) {
      grid.classList.remove("dragging");
    }
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
    if (type === "tự lái") {
      navigate("/thue-xe-tu-lai");
    } else {
      navigate("/thue-xe-co-lai");
    }
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAboutNavClick = () => {
    setShowServiceOptions(false);
    setShowAboutSection(true);
    navigate("/gioi-thieu");
  };

  const displayCars = canAccessDashboard ? cars : sharedDisplayCars;

  const notify = (message, type = "info") => {
    notifyUser(message, type);
  };

  const getCarCategory = (car) => (car.fuel_type ? car.fuel_type.toUpperCase() : "E-SUV");
  const getCarSeats = (car) => (car.seats ? `${car.seats} chỗ` : "4 chỗ");
  const getCarTransmission = (car) => (car.transmission ? car.transmission : "Tự động");
  const getCarSubtitle = (car) => `${car.brand || "Xe chất"}`;
  const isCarRented = (car) => String(car?.status || "").toLowerCase() === "rented";
  const getCarColorSwatch = (color) => {
    const normalized = String(color || "").trim().toLowerCase();
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
    return colorMap[normalized] || "var(--accent-color)";
  };

  const toDateInputValue = (date) => date.toISOString().slice(0, 10);

  const handleSummaryRangeChange = (range) => {
    setSummaryRange(range);

    const now = new Date();
    if (range === "all") {
      setSummaryStartDate("");
      setSummaryEndDate("");
      return;
    }

    if (range === "month") {
      setSummaryStartDate(toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
      setSummaryEndDate(toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
      return;
    }

    if (range === "quarter") {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      setSummaryStartDate(toDateInputValue(new Date(now.getFullYear(), quarterStartMonth, 1)));
      setSummaryEndDate(toDateInputValue(new Date(now.getFullYear(), quarterStartMonth + 3, 0)));
      return;
    }

    if (range === "year") {
      setSummaryStartDate(toDateInputValue(new Date(now.getFullYear(), 0, 1)));
      setSummaryEndDate(toDateInputValue(new Date(now.getFullYear(), 11, 31)));
    }
  };

  const isDateInSummaryRange = (dateValue) => {
    if (!summaryStartDate && !summaryEndDate) return true;
    if (!dateValue) return true;

    const value = new Date(dateValue);
    if (Number.isNaN(value.getTime())) return true;
    if (summaryStartDate && value < new Date(summaryStartDate)) return false;
    if (summaryEndDate) {
      const end = new Date(summaryEndDate);
      end.setHours(23, 59, 59, 999);
      if (value > end) return false;
    }
    return true;
  };

  const isItemInDateRange = (item, startFilter, endFilter) => {
    if (!startFilter && !endFilter) return true;
    if (!item?.start_date && !item?.end_date) return false;

    const itemStart = item.start_date ? new Date(item.start_date) : null;
    const itemEnd = item.end_date ? new Date(item.end_date) : itemStart;
    const filterStart = startFilter ? new Date(startFilter) : null;
    const filterEnd = endFilter ? new Date(endFilter) : null;

    if (filterEnd) {
      filterEnd.setHours(23, 59, 59, 999);
    }

    if (filterStart && itemEnd && itemEnd < filterStart) return false;
    if (filterEnd && itemStart && itemStart > filterEnd) return false;
    return true;
  };

  const renderDateFilter = ({ startValue, endValue, onStartChange, onEndChange, onClear }) => (
    <div className="table-date-filter">
      <label>
        Từ ngày
        <input type="date" value={startValue} onChange={(event) => onStartChange(event.target.value)} />
      </label>
      <label>
        Đến ngày
        <input type="date" value={endValue} onChange={(event) => onEndChange(event.target.value)} />
      </label>
      <button type="button" className="action-button secondary" onClick={onClear}>
        Xóa lọc
      </button>
    </div>
  );

  const paginateRows = (rows, page, perPage = 10) => {
    const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
    const safePage = Math.min(page, totalPages);
    return {
      totalPages,
      safePage,
      pageRows: rows.slice((safePage - 1) * perPage, safePage * perPage),
    };
  };

  const getRowTime = (dateValue, fallbackId = 0) => {
    const parsed = dateValue ? new Date(dateValue).getTime() : 0;
    return Number.isNaN(parsed) ? Number(fallbackId || 0) : parsed;
  };

  const sortNewestByDate = (rows, dateKey, idKey) => (
    [...rows].sort((a, b) => {
      const dateDiff = getRowTime(b?.[dateKey]) - getRowTime(a?.[dateKey]);
      if (dateDiff !== 0) return dateDiff;
      return Number(b?.[idKey] || 0) - Number(a?.[idKey] || 0);
    })
  );

  const renderTablePagination = ({ total, pageRowsLength, safePage, totalPages, setPage, itemLabel }) => (
    <div className="table-pagination">
      <span>
        Hiển thị {pageRowsLength ? (safePage - 1) * 10 + 1 : 0}
        {" - "}
        {Math.min(safePage * 10, total)} / {total} {itemLabel}
      </span>
      <div className="table-pagination-actions">
        <button type="button" className="action-button secondary" disabled={safePage <= 1} onClick={() => setPage((page) => Math.max(1, page - 1))}>
          Trước
        </button>
        <div className="table-page-numbers" aria-label="Chọn trang">
          {getPaginationItems(safePage, totalPages).map((pageItem, index) => pageItem === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="table-page-ellipsis">...</span>
          ) : (
            <button
              key={pageItem}
              type="button"
              className={`table-page-number ${pageItem === safePage ? "active" : ""}`}
              onClick={() => setPage(pageItem)}
              aria-current={pageItem === safePage ? "page" : undefined}
            >
              {pageItem}
            </button>
          ))}
        </div>
        <button type="button" className="action-button" disabled={safePage >= totalPages} onClick={() => setPage((page) => Math.min(totalPages, page + 1))}>
          Sau
        </button>
      </div>
    </div>
  );

  const getPaginationItems = (currentPage, totalPages) => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, "ellipsis", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
  };

  const headers = {
    "X-User-Role": normalizedRole,
    "Content-Type": "application/json",
  };
  const getNotificationStorageKey = () => {
    const customerId = getCurrentCustomerId();
    if (canAccessDashboard) return `notifications:${normalizedRole}`;
    if (customerId) return `notifications:customer:${customerId}`;
    return "notifications:guest";
  };
  const unreadNotificationCount = notifications.filter((item) => !item.read).length;
  const getCurrentCustomerId = () => {
    const userData = JSON.parse(authStorage.getItem("userData") || "{}");
    return userData.customer_id || authStorage.getItem("customerId") || "";
  };
  const addNotification = (notification) => {
    setNotifications((prev) => {
      if (prev.some((item) => item.id === notification.id)) return prev;
      const next = [{ ...notification, read: false, createdAt: notification.createdAt || new Date().toISOString() }, ...prev].slice(0, 30);
      localStorage.setItem(getNotificationStorageKey(), JSON.stringify(next));
      return next;
    });
  };
  const markNotificationsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      localStorage.setItem(getNotificationStorageKey(), JSON.stringify(next));
      return next;
    });
  };
  const markNotificationRead = (notificationId) => {
    setNotifications((prev) => {
      const next = prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item));
      localStorage.setItem(getNotificationStorageKey(), JSON.stringify(next));
      return next;
    });
  };
  const formatNotificationTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  };

  const refreshData = () => {
    setStatsError(null);

    if (canAccessDashboard) {
      // Lấy dữ liệu thống kê
      fetch(`${API_BASE_URL}/reports/summary`, { headers })
        .then((response) => response.json())
        .then((data) => setStats(data))
        .catch(() => setStatsError("Không thể tải dữ liệu thống kê"));

      // Lấy danh sách xe với role admin/staff để đảm bảo thấy tất cả xe
      fetch(`${API_BASE_URL}/cars`, { headers })
        .then((response) => response.json())
        .then((data) => setCars(Array.isArray(data) ? data : []))
        .catch(() => setCars([]));

      fetch(`${API_BASE_URL}/customers`, { headers })
        .then((response) => response.json())
        .then((data) => setCustomers(data))
        .catch(() => {});

      fetch(`${API_BASE_URL}/rental_requests`, { headers })
        .then((response) => response.json())
        .then((data) => setRequests(data))
        .catch(() => {});

      fetch(`${API_BASE_URL}/contracts`, { headers })
        .then((response) => response.json())
        .then((data) => setContracts(data))
        .catch(() => {});

      fetch(`${API_BASE_URL}/payments`, { headers })
        .then((response) => response.json())
        .then((data) => setPayments(data))
        .catch(() => {});

      fetch(`${API_BASE_URL}/users`, { headers })
        .then((response) => (response.ok ? response.json() : []))
        .then((data) => setUsers(data))
        .catch(() => {});
    } else {
      // Customer: dùng CarsContext để lấy xe
      refreshCarsContext();
      setStats(null);
      setCustomers([]);
      setRequests([]);
      setContracts([]);
      setPayments([]);
      setUsers([]);
    }
  };

  useEffect(() => {
    adminNotificationReadyRef.current = false;
    customerNotificationReadyRef.current = false;
    try {
      const savedNotifications = JSON.parse(localStorage.getItem(getNotificationStorageKey()) || "[]");
      setNotifications(Array.isArray(savedNotifications) ? savedNotifications : []);
    } catch {
      setNotifications([]);
    }
  }, [role, loggedInUser]);

  useEffect(() => {
    if (!loggedInUser || !canAccessDashboard) return undefined;
    let alive = true;
    const seenKey = `adminSeenRentalRequests:${role}`;
    const loadAdminRentalNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rental_requests`, { headers });
        if (!response.ok) return;
        const data = await response.json();
        const rentalRequests = Array.isArray(data) ? data : [];
        if (alive) {
          setRequests(rentalRequests);
        }
        const seen = new Set(JSON.parse(localStorage.getItem(seenKey) || "[]").map(String));
        const ids = rentalRequests.map((item) => String(item.request_id)).filter(Boolean);

        if (!adminNotificationReadyRef.current) {
          localStorage.setItem(seenKey, JSON.stringify(Array.from(new Set([...seen, ...ids]))));
          adminNotificationReadyRef.current = true;
          return;
        }

        const nextSeen = new Set([...seen, ...ids]);
        const newRequests = rentalRequests.filter((item) => item.request_id && !seen.has(String(item.request_id)));
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
          notify("Có yêu cầu thuê xe mới.", "info");
        });
      } catch {
        // Silent polling failure.
      }
    };

    loadAdminRentalNotifications();
    const timer = window.setInterval(loadAdminRentalNotifications, 8000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [role, loggedInUser]);

  useEffect(() => {
    const customerId = getCurrentCustomerId();
    if (!loggedInUser || normalizedRole !== "customer" || !customerId) return undefined;
    let alive = true;
    const seenKey = `customerRentalStatusNotifications:${customerId}`;
    const loadCustomerRentalNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rental_requests/customer/${customerId}`);
        if (!response.ok) return;
        const data = await response.json();
        const rentalRequests = Array.isArray(data) ? data : [];
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
        if (!alive) return;
        newlyProcessed.forEach((item) => {
          const status = String(item.status || "").toLowerCase();
          const isRejected = status === "rejected";
          addNotification({
            id: `customer-${status}-${item.request_id}`,
            title: isRejected ? "Yêu cầu thuê xe bị từ chối" : "Xe được thuê thành công",
            message: isRejected
              ? `Yêu cầu thuê xe #${item.request_id} đã bị từ chối.`
              : `Yêu cầu thuê xe #${item.request_id} đã được duyệt và tạo hợp đồng.`,
            createdAt: item.updated_at || new Date().toISOString(),
          });
          notify(isRejected ? "Yêu cầu thuê xe bị từ chối." : "Xe được thuê thành công.", isRejected ? "error" : "success");
        });
      } catch {
        // Silent polling failure.
      }
    };

    loadCustomerRentalNotifications();
    const timer = window.setInterval(loadCustomerRentalNotifications, 8000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [role, loggedInUser]);

  useEffect(() => {
    // Kiểm tra localStorage khi load trang
    const savedUser = authStorage.getItem('loggedInUser');
    const savedRole = authStorage.getItem('userRole');
    const savedUserData = authStorage.getItem('userData');
    const savedReviews = localStorage.getItem('customerReviews');

    if (savedReviews) {
      try {
        const parsedReviews = JSON.parse(savedReviews);
        setCustomerReviews(Array.isArray(parsedReviews) ? parsedReviews : []);
      } catch (error) {
        localStorage.removeItem('customerReviews');
      }
    }
    
    if (savedUser && savedRole && savedUserData) {
      try {
        const userData = JSON.parse(savedUserData);
        setLoggedInUser(userData.name || userData.username);
        setRole(normalizeRoleValue(userData.role || savedRole));
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Xóa dữ liệu lỗi
        authStorage.removeItem('loggedInUser');
        authStorage.removeItem('userRole');
        authStorage.removeItem('userData');
      }
    }
    
    refreshData();
  }, [role]);

  useEffect(() => {
    // Chỉ đồng bộ cars từ context khi role là customer
    if (normalizedRole === "customer") {
      setCars(fetchedCars);
    }
  }, [fetchedCars, role]);

  useEffect(() => {
    if (!isAdmin && activeTab === "users") {
      setActiveTab("summary");
    }
  }, [activeTab, isAdmin]);

  // Đóng user dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  const handleLoginClick = () => {
    setShowLoginForm(true);
    setAuthMode("login");
  };

  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
  };

  const handleCloseAuth = () => {
    setShowLoginForm(false);
  };

  const fetchCustomerByEmail = async (email) => {
    if (!email || !email.includes("@")) return null;

    const response = await fetch(`${API_BASE_URL}/customers/by-email/${encodeURIComponent(email)}`);
    if (!response.ok) return null;
    return response.json();
  };

  const createCustomerProfile = async () => {
    const response = await fetch(`${API_BASE_URL}/customers/public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: registerData.fullName,
        phone: registerData.phone,
        email: registerData.email,
        password: registerData.password,
        address: registerData.address || "",
      }),
    });

    if (response.ok) return response.json();

    const existingCustomer = await fetchCustomerByEmail(registerData.email);
    if (existingCustomer) return existingCustomer;

    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Không thể tạo thông tin khách hàng.");
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (showLoginForm && event.key === "Escape") {
        setShowLoginForm(false);
      }
      if (editingUser && event.key === "Escape") {
        setEditingUser(null);
      }
      if (editingCustomer && event.key === "Escape") {
        setEditingCustomer(null);
      }
      if (editingCar && event.key === "Escape") {
        setEditingCar(null);
      }
      if (showCreateCarForm && event.key === "Escape") {
        setShowCreateCarForm(false);
      }
      if (showCreateUserForm && event.key === "Escape") {
        setShowCreateUserForm(false);
      }
      if (showCreateCustomerForm && event.key === "Escape") {
        setShowCreateCustomerForm(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showLoginForm, editingUser, editingCustomer, editingCar, showCreateCarForm, showCreateUserForm, showCreateCustomerForm]);

  const handleLogout = () => {
    setLoggedInUser(null);
    setRole("customer");
    setSelectedCar(null);
    setShowLoginForm(false);
    
    // Xóa khỏi localStorage
    authStorage.removeItem('loggedInUser');
    authStorage.removeItem('userRole');
    authStorage.removeItem('userData');
    authStorage.removeItem('customerId');
    
    refreshData();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      notify("Vui lòng nhập email và mật khẩu.", "error");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Đăng nhập thất bại");
      }
      const user = await response.json();
      const loginRole = normalizeRoleValue(user.role);
      const customer = loginRole === "customer" ? await fetchCustomerByEmail(user.username) : null;
      const userProfile = customer
        ? { ...user, ...customer }
        : { ...user, email: user.username?.includes("@") ? user.username : "" };

      setLoggedInUser(userProfile.name || user.username);
      setRole(loginRole);
      
      // Lưu vào localStorage
      authStorage.setItem('loggedInUser', userProfile.name || user.username);
      authStorage.setItem('userRole', loginRole);
      authStorage.setItem('userData', JSON.stringify(userProfile));
      if (customer?.customer_id) {
        authStorage.setItem('customerId', String(customer.customer_id));
      } else {
        authStorage.removeItem('customerId');
      }
      
      setShowLoginForm(false);
      setLoginData({ username: "", password: "" });
      notify("Đăng nhập thành công", "success");
    } catch (error) {
      console.error(error);
      notify(getReadableErrorMessage(error, "Đăng nhập thất bại"), "error");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.fullName || !registerData.email || !registerData.phone || !registerData.password) {
      notify("Vui lòng nhập đầy đủ họ và tên, email, số điện thoại và mật khẩu.", "error");
      return;
    }
    try {
      const registerPayload = {
        username: registerData.email,
        password: registerData.password,
      };
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerPayload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Đăng ký thất bại");
      }
      await createCustomerProfile();
      notify("Đăng ký thành công. Vui lòng đăng nhập.", "success");
      setAuthMode("login");
      setLoginData({ username: registerData.email, password: "" });
      setRegisterData({ fullName: "", email: "", phone: "", address: "", password: "" });
    } catch (error) {
      console.error(error);
      notify(getReadableErrorMessage(error, "Đăng ký thất bại"), "error");
    }
  };

  const handleReviewSubmit = (event) => {
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

    const userData = JSON.parse(authStorage.getItem("userData") || "{}");
    const nextReview = {
      id: Date.now(),
      name: userData.name || loggedInUser,
      email: userData.email || userData.username || "",
      rating: Number(reviewForm.rating) || 5,
      message,
      createdAt: new Date().toISOString(),
    };
    const nextReviews = [nextReview, ...customerReviews].slice(0, 12);

    setCustomerReviews(nextReviews);
    localStorage.setItem("customerReviews", JSON.stringify(nextReviews));
    setReviewForm({ rating: "5", message: "" });
    setReviewNotice("Cảm ơn bạn đã gửi đánh giá.");
  };

  const handleExport = async (format = "excel") => {
    setShowLoginForm(false);
    const isCsv = format === "csv";
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${isCsv ? "export-csv" : "export-excel"}`, { headers });
      if (!response.ok) {
        throw new Error(`Không thể xuất ${isCsv ? "CSV" : "Excel"}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payments_report.${isCsv ? "csv" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      notify(`Không thể xuất ${isCsv ? "CSV" : "Excel"}. Vui lòng thử lại.`, "error");
    }
  };

  const handleJsonPost = async (url, data, method = "POST") => {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || response.statusText || "Lỗi tạo mới");
      }
      await response.json().catch(() => null);
      refreshData();
      return true;
    } catch (error) {
      console.error(error);
      notify(error.message || "Tạo mới thất bại", "error");
      return false;
    }
  };

  const handleCreateCar = async (e) => {
    e.preventDefault();
    const body = {
      ...newCar,
      price_per_day: Number(newCar.price_per_day) || 0,
      seats: newCar.seats ? Number(newCar.seats) : null,
      year: newCar.year ? Number(newCar.year) : null,
    };
    const ok = await handleJsonPost(`${API_BASE_URL}/cars`, body);
    if (!ok) return;
    await refreshCarsContext?.();
    setNewCar({
      name: "",
      brand: "",
      license_plate: "",
      price_per_day: "",
      status: "available",
      color: "",
      seats: "",
      fuel_type: "",
      transmission: "",
      year: "",
      description: "",
      image_url: "",
    });
    setShowCreateCarForm(false);
    notify("Thêm xe mới thành công.", "success");
  };

  const handleStartEditCar = (car) => {
    setEditingCar({
      car_id: car.car_id,
      name: car.name || "",
      brand: car.brand || "",
      license_plate: car.license_plate || "",
      price_per_day: car.price_per_day || "",
      status: car.status || "available",
      color: car.color || "",
      seats: car.seats || "",
      fuel_type: car.fuel_type || "",
      transmission: car.transmission || "",
      year: car.year || "",
      description: car.description || "",
      image_url: car.image_url || getCarImageUrl(car, fallbackCars) || "",
    });
  };

  const handleCarImageChange = async (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imageUrl = await readCarImageFile(file);
      setter((current) => ({ ...current, image_url: imageUrl }));
    } catch (error) {
      notify(error.message || "Không thể tải ảnh xe", "error");
      event.target.value = "";
    }
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    if (!editingCar) return;
    const body = {
      ...editingCar,
      price_per_day: Number(editingCar.price_per_day) || 0,
      seats: editingCar.seats ? Number(editingCar.seats) : null,
      year: editingCar.year ? Number(editingCar.year) : null,
    };
    delete body.car_id;
    const ok = await handleJsonPost(`${API_BASE_URL}/cars/${editingCar.car_id}`, body, "PUT");
    if (!ok) return;
    await refreshCarsContext?.();
    setEditingCar(null);
    notify("Lưu thành công.", "success");
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    await handleJsonPost(`${API_BASE_URL}/customers`, newCustomer);
    setNewCustomer({ name: "", phone: "", email: "", password: "", address: "" });
    setShowCreateCustomerForm(false);
  };

  const handleStartEditCustomer = (customer) => {
    setEditingCustomer({
      customer_id: customer.customer_id,
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      password: customer.password || "",
      address: customer.address || "",
    });
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    await handleJsonPost(`${API_BASE_URL}/customers/${editingCustomer.customer_id}`, {
      name: editingCustomer.name,
      phone: editingCustomer.phone,
      email: editingCustomer.email,
      password: editingCustomer.password,
      address: editingCustomer.address,
    }, "PUT");
    setEditingCustomer(null);
    notify("Lưu khách hàng thành công.", "success");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    await handleJsonPost(`${API_BASE_URL}/users`, newUser);
    setNewUser({ name: "", username: "", password: "", role: "staff" });
    setShowCreateUserForm(false);
  };

  const handleStartEditUser = (user) => {
    setEditingUser({
      user_id: user.user_id,
      name: user.name || "",
      username: user.username || "",
      password: user.password || "",
      role: user.role || "staff",
    });
  };

  const dashboardUsers = users.filter((user) => user.role !== "customer");
  const staffEmails = new Set(
    dashboardUsers
      .map((user) => String(user.username || "").toLowerCase())
      .filter((email) => email.includes("@"))
  );
  const dashboardCustomers = customers.filter(
    (customer) => !customer.email || !staffEmails.has(String(customer.email).toLowerCase())
  );
  const customerById = new Map(customers.map((customer) => [Number(customer.customer_id), customer]));
  const carById = new Map(cars.map((car) => [Number(car.car_id), car]));
  const contractById = new Map(contracts.map((contract) => [Number(contract.contract_id), contract]));

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    await handleJsonPost(`${API_BASE_URL}/users/${editingUser.user_id}`, {
      name: editingUser.name,
      username: editingUser.username,
      password: editingUser.password,
      role: editingUser.role,
    }, "PUT");
    setEditingUser(null);
    notify("Lưu nhân sự thành công.", "success");
  };

  const handleDeleteUser = async (userId) => {
    await handleAction(`${API_BASE_URL}/users/${userId}`, "DELETE");
  };

  const handleAction = async (url, method = "PUT") => {
    // Debug: kiểm tra URL và method
    console.log("handleAction called with:", { url, method, role });
    
    // Nếu là DELETE, hỏi xác nhận
    if (method === "DELETE") {
      const confirmDelete = confirm("Bạn có chắc chắn muốn xóa mục này không?");
      if (!confirmDelete) {
        return;
      }
    }
    
    try {
      console.log("Sending request to:", url, "with method:", method, "headers:", headers);
      
      const response = await fetch(url, { 
        method, 
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { detail: response.statusText };
        }
        
        const errorMessage = errorData?.detail || response.statusText || "Lỗi hành động";
        console.log("Error data:", errorData);
        
        // Hiển thị lỗi cụ thể hơn
        if (response.status === 403) {
          notify("Bạn không có quyền thực hiện hành động này. Chỉ admin mới có thể xóa xe.", "error");
        } else if (response.status === 400 && errorMessage.includes("rented")) {
          notify("Không thể xóa xe đang được thuê.", "error");
        } else if (response.status === 404) {
          notify("Không tìm thấy xe để xóa.", "error");
        } else {
          notify(`Lỗi ${response.status}: ${errorMessage}`, "error");
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json().catch(() => null);
      console.log("Response data:", responseData);
      refreshData();
      notify("Thao tác thành công!", "success");
    } catch (error) {
      console.error("Error in handleAction:", error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        notify("Lỗi kết nối đến server. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.", "error");
      } else {
        notify("Lỗi: " + error.message, "error");
      }
    }
  };

  const handleCreateContract = async (requestId) => {
    if (creatingContractIds.includes(requestId)) {
      return;
    }

    setCreatingContractIds((prev) => [...prev, requestId]);
    try {
      await handleAction(`${API_BASE_URL}/contracts/${requestId}`, "POST");
    } finally {
      setCreatingContractIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const renderTabContent = () => {
    if (activeTab === "summary") {
      const contractById = new Map(contracts.map((contract) => [Number(contract.contract_id), contract]));
      const filteredPaidPayments = payments.filter((payment) => {
        if (payment.status !== "paid") return false;
        const contract = contractById.get(Number(payment.contract_id));
        return isDateInSummaryRange(contract?.start_date);
      });
      const filteredRevenue = filteredPaidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const filteredContractCount = new Set(filteredPaidPayments.map((payment) => payment.contract_id)).size;
      const monthlyRevenueMap = filteredPaidPayments.reduce((monthly, payment) => {
        const contract = contractById.get(Number(payment.contract_id));
        const month = contract?.start_date ? String(contract.start_date).slice(0, 7) : "Không rõ";
        monthly.set(month, (monthly.get(month) || 0) + Number(payment.amount || 0));
        return monthly;
      }, new Map());
      const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([month, revenue]) => ({ month, revenue }));
      const chartRows = monthlyRevenue.length
        ? monthlyRevenue
        : (stats?.monthly_revenue || []).map((item) => ({ month: item.month, revenue: Number(item.revenue || 0) }));
      const chartMaxRevenue = Math.max(...chartRows.map((item) => Number(item.revenue || 0)), 1);
      const isFilteredSummary = Boolean(summaryStartDate || summaryEndDate);
      const totalRevenue = isFilteredSummary ? filteredRevenue : (stats?.total_revenue || 0);
      const totalContracts = isFilteredSummary ? filteredContractCount : (stats?.total_contracts || 0);
      const filteredPaymentsInRange = payments.filter((payment) => {
        const contract = contractById.get(Number(payment.contract_id));
        return isDateInSummaryRange(contract?.start_date);
      });
      const unpaidAmount = filteredPaymentsInRange
        .filter((payment) => payment.status !== "paid")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const averageRevenuePerContract = totalContracts ? totalRevenue / totalContracts : 0;
      const peakMonth = chartRows.reduce(
        (peak, item) => (Number(item.revenue || 0) > Number(peak.revenue || 0) ? item : peak),
        { month: "Chưa có", revenue: 0 }
      );
      const sortedChartRows = [...chartRows].sort((left, right) => left.month.localeCompare(right.month));
      const latestRevenue = sortedChartRows.at(-1)?.revenue;
      const previousRevenue = sortedChartRows.at(-2)?.revenue;
      const revenueGrowth = previousRevenue
        ? ((Number(latestRevenue || 0) - Number(previousRevenue || 0)) / Number(previousRevenue)) * 100
        : null;
      const revenueGrowthLabel = revenueGrowth === null
        ? "Chưa đủ dữ liệu"
        : `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`;
      const rentedCars = Number(stats?.cars_rented || 0);
      const availableCars = Math.max(Number(stats?.total_cars || 0) - rentedCars, 0);
      const usagePercent = Math.max(0, Math.min(Number(stats?.usage_rate || 0) * 100, 100));
      const columnChartRows = Array.from({ length: 12 }, (_, index) => ({
        month: `T${index + 1}`,
        revenue: 0,
      }));
      chartRows.forEach((item) => {
        const monthPart = String(item.month || "").split("-").pop();
        const monthIndex = Number(monthPart) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          columnChartRows[monthIndex].revenue += Number(item.revenue || 0);
        }
      });
      const columnMaxRevenue = Math.max(...columnChartRows.map((item) => Number(item.revenue || 0)), 0);
      const columnUnitDivisor = columnMaxRevenue >= 1_000_000_000 ? 1_000_000_000 : 1_000_000;
      const columnUnitLabel = columnMaxRevenue >= 1_000_000_000 ? "Tỷ" : "Triệu";
      const columnMaxValue = Math.max(...columnChartRows.map((item) => Number(item.revenue || 0) / columnUnitDivisor), 1);
      const getNiceChartStep = (maxValue) => {
        const rawStep = Math.max(maxValue / 3, 1);
        const magnitude = 10 ** Math.floor(Math.log10(rawStep));
        const normalized = rawStep / magnitude;
        if (normalized <= 1) return magnitude;
        if (normalized <= 2) return 2 * magnitude;
        if (normalized <= 5) return 5 * magnitude;
        return 10 * magnitude;
      };
      const columnStep = getNiceChartStep(columnMaxValue);
      const columnYAxisMax = Math.ceil(columnMaxValue / columnStep) * columnStep;
      const columnYAxisTicks = Array.from(
        { length: Math.floor(columnYAxisMax / columnStep) + 1 },
        (_, index) => columnYAxisMax - index * columnStep
      );

      return (
        <div className="table-section">
          <div className="summary-heading-row">
            <h3>Tổng quan hệ thống</h3>
            <div className="summary-export-actions">
              <button className="action-button" type="button" onClick={() => handleExport("excel")}>
                Xuất Excel
              </button>
              <button className="action-button" type="button" onClick={() => handleExport("csv")}>
                Xuất CSV
              </button>
            </div>
          </div>
          {stats ? (
            <>
              <div className="summary-toolbar">
                <label>
                  Mốc thời gian
                  <select value={summaryRange} onChange={(event) => handleSummaryRangeChange(event.target.value)}>
                    <option value="all">Toàn bộ</option>
                    <option value="month">Tháng này</option>
                    <option value="quarter">Quý này</option>
                    <option value="year">Năm nay</option>
                    <option value="custom">Tùy chọn</option>
                  </select>
                </label>
                <label>
                  Từ ngày
                  <input
                    type="date"
                    value={summaryStartDate}
                    onChange={(event) => {
                      setSummaryRange("custom");
                      setSummaryStartDate(event.target.value);
                    }}
                  />
                </label>
                <label>
                  Đến ngày
                  <input
                    type="date"
                    value={summaryEndDate}
                    onChange={(event) => {
                      setSummaryRange("custom");
                      setSummaryEndDate(event.target.value);
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="action-button secondary summary-clear-filter"
                  onClick={() => {
                    setSummaryRange("all");
                    setSummaryStartDate("");
                    setSummaryEndDate("");
                  }}
                >
                  Xóa lọc
                </button>
              </div>
              <div className="dashboard-grid summary-stats-grid">
                <div className="dashboard-card">
                  <h3>Tổng doanh thu</h3>
                  <p>{Number(totalRevenue).toLocaleString()} VND</p>
                </div>
                <div className="dashboard-card">
                  <h3>Tổng hợp đồng</h3>
                  <p>{totalContracts}</p>
                </div>
                <div className="dashboard-card">
                  <h3>Tổng số xe</h3>
                  <p>{stats.total_cars}</p>
                </div>
                <div className="dashboard-card">
                  <h3>Xe đang thuê</h3>
                  <p>{stats.cars_rented}</p>
                </div>
                <div className="dashboard-card">
                  <h3>Tỷ lệ sử dụng</h3>
                  <p>{(stats.usage_rate * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="summary-insights-grid">
                <div className="summary-insight-card">
                  <span>Doanh thu TB / hợp đồng</span>
                  <strong>{Number(averageRevenuePerContract).toLocaleString()} VND</strong>
                </div>
                <div className="summary-insight-card">
                  <span>Tháng doanh thu cao nhất</span>
                  <strong>{peakMonth.month}</strong>
                  <small>{Number(peakMonth.revenue || 0).toLocaleString()} VND</small>
                </div>
                <div className="summary-insight-card">
                  <span>Tăng trưởng tháng gần nhất</span>
                  <strong>{revenueGrowthLabel}</strong>
                </div>
                <div className="summary-insight-card">
                  <span>Thanh toán đã thu</span>
                  <strong>{filteredPaidPayments.length}</strong>
                </div>
                <div className="summary-insight-card">
                  <span>Số tiền chờ thu</span>
                  <strong>{Number(unpaidAmount).toLocaleString()} VND</strong>
                </div>
              </div>
              <div className="summary-visual-grid">
                <div className="summary-chart-card summary-column-card revenue-column-card">
                  <div className="summary-chart-header">
                    <h3>Doanh số theo tháng</h3>
                    <span aria-hidden="true">▣</span>
                  </div>
                  {columnMaxRevenue > 0 ? (
                    <div className="revenue-bar-chart">
                      <div className="revenue-y-axis">
                        {columnYAxisTicks.map((tick) => (
                          <span key={tick}>{Number.isInteger(tick) ? tick : tick.toFixed(1)}</span>
                        ))}
                      </div>
                      <div className="revenue-y-label">{columnUnitLabel}</div>
                      <div className="revenue-plot">
                        <div className="revenue-grid-lines" aria-hidden="true">
                          {columnYAxisTicks.map((tick) => (
                            <span key={tick} />
                          ))}
                        </div>
                        <div className="revenue-bars">
                          {columnChartRows.map((item) => {
                            const value = Number(item.revenue || 0) / columnUnitDivisor;
                            const height = value > 0 ? Math.max((value / columnYAxisMax) * 100, 2) : 0;
                            return (
                              <div className="revenue-bar-item" key={item.month}>
                                <div className="revenue-bar-track">
                                  <div
                                    className="revenue-bar"
                                    style={{ height: `${height}%` }}
                                    title={`${item.month}: ${Number(item.revenue || 0).toLocaleString("vi-VN")} VND`}
                                    data-tooltip={`${item.month}: ${Number(item.revenue || 0).toLocaleString("vi-VN")} VND`}
                                  />
                                </div>
                                <span>{item.month}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="revenue-chart-legend">
                        <span />
                        Giá trị thực tế
                      </div>
                    </div>
                  ) : (
                    <p className="summary-chart-empty">Chưa có doanh thu để hiển thị biểu đồ cột.</p>
                  )}
                </div>

                <div className="summary-chart-card summary-pie-card">
                  <div className="summary-chart-header">
                    <h3>Biểu đồ tròn tình trạng xe</h3>
                    <span>{stats.total_cars} xe</span>
                  </div>
                  <div className="summary-pie-content">
                    <div
                      className="summary-pie"
                      style={{
                        background: `conic-gradient(var(--accent-color) 0 ${usagePercent}%, rgba(255, 255, 255, 0.16) ${usagePercent}% 100%)`,
                      }}
                      aria-label={`Tỷ lệ sử dụng ${usagePercent.toFixed(1)}%`}
                    >
                      <div>
                        <strong>{usagePercent.toFixed(1)}%</strong>
                        <span>Đang thuê</span>
                      </div>
                    </div>
                    <div className="summary-pie-legend">
                      <div>
                        <span className="summary-legend-dot active" />
                        Xe đang thuê
                        <strong>{rentedCars}</strong>
                      </div>
                      <div>
                        <span className="summary-legend-dot" />
                        Xe còn lại
                        <strong>{availableCars}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="summary-chart-card">
                <div className="summary-chart-header">
                  <h3>Doanh thu theo tháng</h3>
                  <span>{isFilteredSummary ? "Theo mốc đã chọn" : "Toàn bộ dữ liệu"}</span>
                </div>
                <div className="summary-chart">
                  {chartRows.length ? (
                    chartRows.map((item) => (
                      <div className="summary-chart-row" key={item.month}>
                        <span>{item.month}</span>
                        <div className="summary-chart-track">
                          <div style={{ width: `${Math.max((Number(item.revenue || 0) / chartMaxRevenue) * 100, 4)}%` }} />
                        </div>
                        <strong>{Number(item.revenue || 0).toLocaleString()} VND</strong>
                      </div>
                    ))
                  ) : (
                    <p className="summary-chart-empty">Chưa có doanh thu trong mốc thời gian này.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p>Đang tải dữ liệu tổng quan...</p>
          )}
        </div>
      );
    }

    if (activeTab === "cars") {
      const carsPerPage = 10;
      const normalizedSearch = carSearch.trim().toLowerCase();
      const uniqueCarValues = (key) => (
        [...new Set(cars.map((car) => car?.[key]).filter((value) => value !== null && value !== undefined && value !== ""))]
          .sort((a, b) => String(a).localeCompare(String(b), "vi", { numeric: true }))
      );
      const setCarFilterValue = (key, value) => {
        setCarFilters((prev) => ({ ...prev, [key]: value }));
        setCarsPage(1);
      };
      const resetCarFilters = () => {
        setCarSearch("");
        setCarFilters({
          brand: "",
          minPrice: "",
          maxPrice: "",
          status: "",
          seats: "",
          transmission: "",
          year: "",
        });
        setCarsPage(1);
      };
      const filteredCars = cars.filter((car) => {
        const searchable = [
          car.name,
          car.brand,
          car.license_plate,
          car.color,
          car.fuel_type,
          car.transmission,
          car.year,
          car.description,
        ].join(" ").toLowerCase();
        const price = Number(car.price_per_day || 0);
        if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
        if (carFilters.brand && String(car.brand) !== carFilters.brand) return false;
        if (carFilters.status && String(car.status) !== carFilters.status) return false;
        if (carFilters.seats && String(car.seats) !== carFilters.seats) return false;
        if (carFilters.transmission && String(car.transmission) !== carFilters.transmission) return false;
        if (carFilters.year && String(car.year) !== carFilters.year) return false;
        if (carFilters.minPrice && price < Number(carFilters.minPrice)) return false;
        if (carFilters.maxPrice && price > Number(carFilters.maxPrice)) return false;
        return true;
      });
      const totalCarPages = Math.max(1, Math.ceil(filteredCars.length / carsPerPage));
      const safeCarsPage = Math.min(carsPage, totalCarPages);
      const pagedCars = filteredCars.slice((safeCarsPage - 1) * carsPerPage, safeCarsPage * carsPerPage);

      return (
        <div className="table-section">
          <div className="table-heading-row">
            <h3>Danh sách xe</h3>
            <div className="car-table-actions">
              <input
                className="table-search-input"
                type="search"
                value={carSearch}
                onChange={(event) => {
                  setCarSearch(event.target.value);
                  setCarsPage(1);
                }}
                placeholder="Tìm xe..."
              />
              <button type="button" className="action-button table-create-button" onClick={() => setShowCreateCarForm(true)}>
                Thêm xe mới
              </button>
            </div>
          </div>
          <div className="car-filter-grid">
            <label>
              Hãng
              <select value={carFilters.brand} onChange={(event) => setCarFilterValue("brand", event.target.value)}>
                <option value="">Tất cả</option>
                {uniqueCarValues("brand").map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </label>
            <label>
              Giá từ
              <input type="number" value={carFilters.minPrice} onChange={(event) => setCarFilterValue("minPrice", event.target.value)} placeholder="VND/ngày" />
            </label>
            <label>
              Giá đến
              <input type="number" value={carFilters.maxPrice} onChange={(event) => setCarFilterValue("maxPrice", event.target.value)} placeholder="VND/ngày" />
            </label>
            <label>
              Trạng thái
              <select value={carFilters.status} onChange={(event) => setCarFilterValue("status", event.target.value)}>
                <option value="">Tất cả</option>
                {uniqueCarValues("status").map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Chỗ
              <select value={carFilters.seats} onChange={(event) => setCarFilterValue("seats", event.target.value)}>
                <option value="">Tất cả</option>
                {uniqueCarValues("seats").map((seats) => (
                  <option key={seats} value={seats}>{seats}</option>
                ))}
              </select>
            </label>
            <label>
              Hộp số
              <select value={carFilters.transmission} onChange={(event) => setCarFilterValue("transmission", event.target.value)}>
                <option value="">Tất cả</option>
                {uniqueCarValues("transmission").map((transmission) => (
                  <option key={transmission} value={transmission}>{transmission}</option>
                ))}
              </select>
            </label>
            <label>
              Năm
              <select value={carFilters.year} onChange={(event) => setCarFilterValue("year", event.target.value)}>
                <option value="">Tất cả</option>
                {uniqueCarValues("year").map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <button type="button" className="action-button secondary car-filter-clear" onClick={resetCarFilters}>
              Xóa lọc
            </button>
          </div>
          {showCreateCarForm ? (
            <>
              <div className="modal-overlay" onClick={() => setShowCreateCarForm(false)} />
              <div className="user-edit-modal">
                <form className="user-edit-card" onSubmit={handleCreateCar}>
                  <div className="user-edit-header">
                    <h3>Thêm xe mới</h3>
                    <button type="button" className="modal-close" onClick={() => setShowCreateCarForm(false)}>×</button>
                  </div>
                  <div className="user-edit-grid">
                    <label>
                      Tên xe
                      <input value={newCar.name} onChange={(e) => setNewCar({ ...newCar, name: e.target.value })} required />
                    </label>
                    <label>
                      Hãng
                      <input value={newCar.brand} onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })} required />
                    </label>
                    <label>
                      Biển số
                      <input value={newCar.license_plate} onChange={(e) => setNewCar({ ...newCar, license_plate: e.target.value })} required />
                    </label>
                    <label>
                      Giá/ngày
                      <input type="number" value={newCar.price_per_day} onChange={(e) => setNewCar({ ...newCar, price_per_day: e.target.value })} required />
                    </label>
                    <label>
                      Trạng thái
                      <select value={newCar.status} onChange={(e) => setNewCar({ ...newCar, status: e.target.value })}>
                        <option value="available">available</option>
                        <option value="rented">rented</option>
                      </select>
                    </label>
                    <label>
                      Màu sắc
                      <input value={newCar.color} onChange={(e) => setNewCar({ ...newCar, color: e.target.value })} />
                    </label>
                    <label>
                      Chỗ ngồi
                      <input type="number" value={newCar.seats} onChange={(e) => setNewCar({ ...newCar, seats: e.target.value })} />
                    </label>
                    <label>
                      Nhiên liệu
                      <input value={newCar.fuel_type} onChange={(e) => setNewCar({ ...newCar, fuel_type: e.target.value })} />
                    </label>
                    <label>
                      Hộp số
                      <input value={newCar.transmission} onChange={(e) => setNewCar({ ...newCar, transmission: e.target.value })} />
                    </label>
                    <label>
                      Năm sản xuất
                      <input type="number" value={newCar.year} onChange={(e) => setNewCar({ ...newCar, year: e.target.value })} />
                    </label>
                    <label>
                      Mô tả
                      <textarea value={newCar.description} onChange={(e) => setNewCar({ ...newCar, description: e.target.value })} rows="3" />
                    </label>
                    <label className="car-image-field">
                      Ảnh xe
                      <input type="file" accept="image/*" onChange={(event) => handleCarImageChange(event, setNewCar)} />
                    </label>
                  </div>
                  <div className="user-edit-actions">
                    <button type="button" className="action-button secondary" onClick={() => setShowCreateCarForm(false)}>Hủy</button>
                    <button type="submit" className="action-button">Thêm xe</button>
                  </div>
                </form>
              </div>
            </>
          ) : null}
          {editingCar ? (
            <>
              <div className="modal-overlay" onClick={() => setEditingCar(null)} />
              <div className="user-edit-modal">
                <form className="user-edit-card" onSubmit={handleUpdateCar}>
                  <div className="user-edit-header">
                    <h3>Sửa xe</h3>
                    <button type="button" className="modal-close" onClick={() => setEditingCar(null)}>×</button>
                  </div>
                  <div className="user-edit-grid">
                    <label>
                      Tên xe
                      <input value={editingCar.name} onChange={(e) => setEditingCar({ ...editingCar, name: e.target.value })} required />
                    </label>
                    <label>
                      Hãng
                      <input value={editingCar.brand} onChange={(e) => setEditingCar({ ...editingCar, brand: e.target.value })} required />
                    </label>
                    <label>
                      Biển số
                      <input value={editingCar.license_plate} onChange={(e) => setEditingCar({ ...editingCar, license_plate: e.target.value })} required />
                    </label>
                    <label>
                      Giá/ngày
                      <input type="number" value={editingCar.price_per_day} onChange={(e) => setEditingCar({ ...editingCar, price_per_day: e.target.value })} required />
                    </label>
                    <label>
                      Trạng thái
                      <select value={editingCar.status} onChange={(e) => setEditingCar({ ...editingCar, status: e.target.value })}>
                        <option value="available">available</option>
                        <option value="rented">rented</option>
                      </select>
                    </label>
                    <label>
                      Màu sắc
                      <input value={editingCar.color} onChange={(e) => setEditingCar({ ...editingCar, color: e.target.value })} />
                    </label>
                    <label>
                      Chỗ ngồi
                      <input type="number" value={editingCar.seats} onChange={(e) => setEditingCar({ ...editingCar, seats: e.target.value })} />
                    </label>
                    <label>
                      Nhiên liệu
                      <input value={editingCar.fuel_type} onChange={(e) => setEditingCar({ ...editingCar, fuel_type: e.target.value })} />
                    </label>
                    <label>
                      Hộp số
                      <input value={editingCar.transmission} onChange={(e) => setEditingCar({ ...editingCar, transmission: e.target.value })} />
                    </label>
                    <label>
                      Năm sản xuất
                      <input type="number" value={editingCar.year} onChange={(e) => setEditingCar({ ...editingCar, year: e.target.value })} />
                    </label>
                    <label>
                      Mô tả
                      <textarea value={editingCar.description} onChange={(e) => setEditingCar({ ...editingCar, description: e.target.value })} rows="3" />
                    </label>
                    <label className="car-image-field">
                      Ảnh xe
                      <input type="file" accept="image/*" onChange={(event) => handleCarImageChange(event, setEditingCar)} />
                      {editingCar.image_url ? (
                        <a className="car-image-current" href={editingCar.image_url} target="_blank" rel="noreferrer">
                          Xem ảnh hiện tại
                        </a>
                      ) : (
                        <span className="car-image-current muted">Chưa có ảnh</span>
                      )}
                    </label>
                  </div>
                  <div className="user-edit-actions">
                    <button type="button" className="action-button secondary" onClick={() => setEditingCar(null)}>Hủy</button>
                    <button type="submit" className="action-button">Lưu</button>
                  </div>
                </form>
              </div>
            </>
          ) : null}
          <table className="cars-table">
            <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên</th>
                  <th>Hãng</th>
                  <th>Biển số</th>
                  <th>Giá/ngày</th>
                  <th>Trạng thái</th>
                  <th>Màu</th>
                  <th>Chỗ</th>
                  <th>Nhiên liệu</th>
                  <th>Hộp số</th>
                  <th>Năm</th>
                  <th>Mô tả</th>
                  <th>Ảnh</th>
                  <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedCars.map((car, index) => (
                <tr key={car.car_id}>
                  <td>{(safeCarsPage - 1) * carsPerPage + index + 1}</td>
                  <td>{car.name}</td>
                  <td>{car.brand}</td>
                  <td>{car.license_plate}</td>
                  <td>{Number(car.price_per_day || 0).toLocaleString("vi-VN")}</td>
                  <td>{car.status}</td>
                  <td>{car.color || "-"}</td>
                  <td>{car.seats || "-"}</td>
                  <td>{car.fuel_type || "-"}</td>
                  <td>{car.transmission || "-"}</td>
                  <td>{car.year || "-"}</td>
                  <td>{car.description || "-"}</td>
                  <td>
                    {getCarImageUrl(car, fallbackCars) ? (
                      <img className="cars-table-image" src={getCarImageUrl(car, fallbackCars)} alt={car.name || "Ảnh xe"} />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="table-icon-button"
                        type="button"
                        title="Sửa"
                        aria-label="Sửa"
                        onClick={() => handleStartEditCar(car)}
                      >
                        <PaymentActionIcon type="edit" />
                      </button>
                      <button 
                        className="table-icon-button danger" 
                        type="button"
                        title="Xóa"
                        aria-label="Xóa"
                        onClick={() => {
                          console.log("Delete button clicked for car:", car.car_id);
                          handleAction(`${API_BASE_URL}/cars/${car.car_id}`, "DELETE");
                        }}
                      >
                        <PaymentActionIcon type="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedCars.length === 0 ? (
                <tr>
                  <td colSpan="14">Không có xe nào khớp với bộ lọc.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="table-pagination">
            <span>
              Hiển thị {pagedCars.length ? (safeCarsPage - 1) * carsPerPage + 1 : 0}
              {" - "}
              {Math.min(safeCarsPage * carsPerPage, filteredCars.length)} / {filteredCars.length} xe
            </span>
            <div className="table-pagination-actions">
              <button type="button" className="action-button secondary" disabled={safeCarsPage <= 1} onClick={() => setCarsPage((page) => Math.max(1, page - 1))}>
                Trước
              </button>
              <div className="table-page-numbers" aria-label="Chọn trang">
                {getPaginationItems(safeCarsPage, totalCarPages).map((pageItem, index) => pageItem === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="table-page-ellipsis">...</span>
                ) : (
                  <button
                    key={pageItem}
                    type="button"
                    className={`table-page-number ${pageItem === safeCarsPage ? "active" : ""}`}
                    onClick={() => setCarsPage(pageItem)}
                    aria-current={pageItem === safeCarsPage ? "page" : undefined}
                  >
                    {pageItem}
                  </button>
                ))}
              </div>
              <button type="button" className="action-button" disabled={safeCarsPage >= totalCarPages} onClick={() => setCarsPage((page) => Math.min(totalCarPages, page + 1))}>
                Sau
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "customers") {
      const normalizedCustomerSearch = customerSearch.trim().toLowerCase();
      const filteredCustomers = dashboardCustomers.filter((customer) => {
        if (!normalizedCustomerSearch) return true;
        return [customer.name, customer.phone, customer.email, customer.address]
          .join(" ")
          .toLowerCase()
          .includes(normalizedCustomerSearch);
      });
      const { pageRows: pagedCustomers, safePage, totalPages } = paginateRows(filteredCustomers, customersPage);

      return (
        <div className="table-section">
          <div className="table-heading-row">
            <h3>Danh sách khách hàng</h3>
            <div className="customer-table-actions">
              <input
                className="table-search-input"
                type="search"
                value={customerSearch}
                onChange={(event) => {
                  setCustomerSearch(event.target.value);
                  setCustomersPage(1);
                }}
                placeholder="Tìm khách hàng..."
              />
              <button type="button" className="action-button table-create-button" onClick={() => setShowCreateCustomerForm(true)}>
                Thêm khách hàng
              </button>
            </div>
          </div>
          {showCreateCustomerForm ? (
            <>
              <div className="modal-overlay" onClick={() => setShowCreateCustomerForm(false)} />
              <div className="user-edit-modal">
                <form className="user-edit-card" onSubmit={handleCreateCustomer}>
                  <div className="user-edit-header">
                    <h3>Thêm khách hàng</h3>
                    <button type="button" className="modal-close" onClick={() => setShowCreateCustomerForm(false)}>×</button>
                  </div>
                  <div className="user-edit-grid">
                    <label>
                      Tên *
                      <input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
                    </label>
                    <label>
                      Số điện thoại *
                      <input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} required />
                    </label>
                    <label>
                      Email *
                      <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} required />
                    </label>
                    <label>
                      Password *
                      <input value={newCustomer.password} onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })} required />
                    </label>
                    <label>
                      Địa chỉ
                      <input value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                    </label>
                  </div>
                  <div className="user-edit-actions">
                    <button type="button" className="action-button secondary" onClick={() => setShowCreateCustomerForm(false)}>Hủy</button>
                    <button type="submit" className="action-button">Thêm</button>
                  </div>
                </form>
              </div>
            </>
          ) : null}
          {editingCustomer ? (
            <>
              <div className="modal-overlay" onClick={() => setEditingCustomer(null)} />
              <div className="user-edit-modal">
                <form className="user-edit-card" onSubmit={handleUpdateCustomer}>
                  <div className="user-edit-header">
                    <h3>Sửa khách hàng</h3>
                    <button type="button" className="modal-close" onClick={() => setEditingCustomer(null)}>×</button>
                  </div>
                  <div className="user-edit-grid">
                    <label>
                      Tên
                      <input value={editingCustomer.name} onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })} required />
                    </label>
                    <label>
                      Số điện thoại
                      <input value={editingCustomer.phone} onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })} required />
                    </label>
                    <label>
                      Email
                      <input type="email" value={editingCustomer.email} onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })} />
                    </label>
                    <label>
                      Password
                      <input value={editingCustomer.password} onChange={(e) => setEditingCustomer({ ...editingCustomer, password: e.target.value })} />
                    </label>
                    <label>
                      Địa chỉ
                      <input value={editingCustomer.address} onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })} />
                    </label>
                  </div>
                  <div className="user-edit-actions">
                    <button type="button" className="action-button secondary" onClick={() => setEditingCustomer(null)}>Hủy</button>
                    <button type="submit" className="action-button">Lưu</button>
                  </div>
                </form>
              </div>
            </>
          ) : null}
          <table className="customers-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên</th>
                <th>Điện thoại</th>
                <th>Email</th>
                <th>Password</th>
                <th>Địa chỉ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedCustomers.map((customer, index) => (
                <tr key={customer.customer_id}>
                  <td>{(safePage - 1) * 10 + index + 1}</td>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || "-"}</td>
                  <td>{customer.password ? "*".repeat(Math.min(String(customer.password).length, 12)) : "-"}</td>
                  <td>{customer.address || "-"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="table-icon-button"
                        type="button"
                        title="Sửa"
                        aria-label="Sửa"
                        onClick={() => handleStartEditCustomer(customer)}
                      >
                        <PaymentActionIcon type="edit" />
                      </button>
                      <button
                        className="table-icon-button danger"
                        type="button"
                        title="Xóa"
                        aria-label="Xóa"
                        onClick={() => handleAction(`${API_BASE_URL}/customers/${customer.customer_id}`, "DELETE")}
                      >
                        <PaymentActionIcon type="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7">Không có khách hàng nào.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {renderTablePagination({
            total: filteredCustomers.length,
            pageRowsLength: pagedCustomers.length,
            safePage,
            totalPages,
            setPage: setCustomersPage,
            itemLabel: "khách hàng",
          })}
        </div>
      );
    }

    if (activeTab === "requests") {
      const formatRequestStatus = (status) => {
        const normalized = String(status || "").trim().toLowerCase();
        if (normalized === "pending") return "Chờ duyệt";
        if (normalized === "approved") return "Đã duyệt";
        if (normalized === "rejected") return "Đã từ chối";
        if (normalized === "completed") return "Hoàn thành";
        return status || "-";
      };
      const filteredRequests = [...requests]
        .filter((request) => isItemInDateRange(request, requestStartFilter, requestEndFilter))
        .sort((a, b) => Number(b?.request_id || 0) - Number(a?.request_id || 0));
      const { pageRows: pagedRequests, safePage, totalPages } = paginateRows(filteredRequests, requestsPage);

      return (
        <div className="table-section">
          <h3>Danh sách yêu cầu</h3>
          {renderDateFilter({
            startValue: requestStartFilter,
            endValue: requestEndFilter,
            onStartChange: (value) => {
              setRequestStartFilter(value);
              setRequestsPage(1);
            },
            onEndChange: (value) => {
              setRequestEndFilter(value);
              setRequestsPage(1);
            },
            onClear: () => {
              setRequestStartFilter("");
              setRequestEndFilter("");
              setRequestsPage(1);
            },
          })}
          <table className="requests-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Tên xe</th>
                <th>Địa điểm nhận xe</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedRequests.map((req, index) => {
                const customer = customerById.get(Number(req.customer_id));
                const car = carById.get(Number(req.car_id));
                return (
                  <tr key={req.request_id}>
                    <td>{(safePage - 1) * 10 + index + 1}</td>
                    <td>{customer?.name || "-"}</td>
                    <td>{customer?.email || "-"}</td>
                    <td>{customer?.phone || "-"}</td>
                    <td>{car?.name || "-"}</td>
                    <td>{req.pickup_location || "-"}</td>
                    <td>{req.start_date}</td>
                    <td>{req.end_date}</td>
                    <td>{formatRequestStatus(req.status)}</td>
                    <td>
                      {req.status === "pending" ? (
                        <div className="action-buttons">
                          <button
                            className="table-icon-button"
                            type="button"
                            title="Duyệt"
                            aria-label="Duyệt"
                            onClick={() => handleAction(`${API_BASE_URL}/rental_requests/${req.request_id}/approve`)}
                          >
                            <PaymentActionIcon type="check" />
                          </button>
                          <button
                            className="table-icon-button danger"
                            type="button"
                            title="Từ chối"
                            aria-label="Từ chối"
                            onClick={() => handleAction(`${API_BASE_URL}/rental_requests/${req.request_id}/reject`)}
                          >
                            <PaymentActionIcon type="reject" />
                          </button>
                        </div>
                      ) : req.status === "approved" ? (
                        (() => {
                          const contractExists = contracts.some((contract) => contract.request_id === req.request_id);
                          const isCreating = creatingContractIds.includes(req.request_id);
                          return contractExists ? (
                            <button className="action-button secondary" disabled>
                              Đã tạo hợp đồng
                            </button>
                          ) : (
                            <button
                              className="action-button"
                              disabled={isCreating}
                              onClick={() => handleCreateContract(req.request_id)}
                            >
                              {isCreating ? "Đang tạo..." : "Tạo hợp đồng"}
                            </button>
                          );
                        })()
                      ) : (
                        <span>Từ chối</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {pagedRequests.length === 0 ? (
                <tr>
                  <td colSpan="10">Không có yêu cầu nào trong khoảng ngày đã chọn.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {renderTablePagination({
            total: filteredRequests.length,
            pageRowsLength: pagedRequests.length,
            safePage,
            totalPages,
            setPage: setRequestsPage,
            itemLabel: "yêu cầu",
          })}
        </div>
      );
    }

    if (activeTab === "contracts") {
      const formatContractStatus = (status) => {
        const normalized = String(status || "").trim().toLowerCase();
        if (normalized === "pending") return "Chờ duyệt";
        if (normalized === "approved") return "Đã duyệt";
        if (normalized === "completed") return "Hoàn thành";
        if (normalized === "rejected") return "Đã từ chối";
        return status || "-";
      };
      const contractBrandOptions = [
        ...new Set(
          contracts
            .map((contract) => carById.get(Number(contract.car_id))?.brand)
            .filter(Boolean)
        ),
      ].sort((a, b) => String(a).localeCompare(String(b), "vi"));
      const contractStatusOptions = [...new Set(contracts.map((contract) => contract.status).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), "vi"));
      const normalizedContractSearch = contractSearch.trim().toLowerCase();
      const filteredContracts = sortNewestByDate(contracts.filter((contract) => {
        const customer = customerById.get(Number(contract.customer_id));
        const car = carById.get(Number(contract.car_id));
        if (!isItemInDateRange(contract, contractStartFilter, contractEndFilter)) return false;
        if (contractBrandFilter && car?.brand !== contractBrandFilter) return false;
        if (contractStatusFilter && contract.status !== contractStatusFilter) return false;
        if (normalizedContractSearch) {
          const searchable = [
            customer?.name,
            customer?.phone,
            customer?.email,
            car?.brand,
            car?.name,
            car?.license_plate,
            contract.start_date,
            contract.end_date,
            contract.total_price,
            contract.status,
          ].join(" ").toLowerCase();
          if (!searchable.includes(normalizedContractSearch)) return false;
        }
        return true;
      }), "start_date", "contract_id");
      const { pageRows: pagedContracts, safePage, totalPages } = paginateRows(filteredContracts, contractsPage);

      return (
        <div className="table-section">
          <div className="table-heading-row">
            <h3>Danh sách hợp đồng</h3>
            <input
              className="table-search-input"
              type="search"
              value={contractSearch}
              onChange={(event) => {
                setContractSearch(event.target.value);
                setContractsPage(1);
              }}
              placeholder="Tìm hợp đồng..."
            />
          </div>
          <div className="contract-filter-grid">
            <label>
              Từ ngày
              <input
                type="date"
                value={contractStartFilter}
                onChange={(event) => {
                  setContractStartFilter(event.target.value);
                  setContractsPage(1);
                }}
              />
            </label>
            <label>
              Đến ngày
              <input
                type="date"
                value={contractEndFilter}
                onChange={(event) => {
                  setContractEndFilter(event.target.value);
                  setContractsPage(1);
                }}
              />
            </label>
            <label>
              Hãng xe
              <select
                value={contractBrandFilter}
                onChange={(event) => {
                  setContractBrandFilter(event.target.value);
                  setContractsPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {contractBrandOptions.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </label>
            <label>
              Trạng thái
              <select
                value={contractStatusFilter}
                onChange={(event) => {
                  setContractStatusFilter(event.target.value);
                  setContractsPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {contractStatusOptions.map((status) => (
                  <option key={status} value={status}>{formatContractStatus(status)}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="action-button secondary contract-filter-clear"
              onClick={() => {
                setContractStartFilter("");
                setContractEndFilter("");
                setContractBrandFilter("");
                setContractStatusFilter("");
                setContractSearch("");
                setContractsPage(1);
              }}
            >
              Xóa lọc
            </button>
          </div>
          <table className="contracts-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên khách hàng</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Hãng xe</th>
                <th>Tên xe</th>
                <th>Biển số</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedContracts.map((contract, index) => {
                const customer = customerById.get(Number(contract.customer_id));
                const car = carById.get(Number(contract.car_id));
                return (
                  <tr key={contract.contract_id}>
                    <td>{(safePage - 1) * 10 + index + 1}</td>
                    <td>{customer?.name || "-"}</td>
                    <td>{customer?.phone || "-"}</td>
                    <td>{customer?.email || "-"}</td>
                    <td>{car?.brand || "-"}</td>
                    <td>{car?.name || "-"}</td>
                    <td>{car?.license_plate || "-"}</td>
                    <td>{contract.start_date}</td>
                    <td>{contract.end_date}</td>
                    <td>{Number(contract.total_price || 0).toLocaleString("vi-VN")}</td>
                    <td>{formatContractStatus(contract.status)}</td>
                    <td>
                      {contract.status === "pending" ? (
                        <button
                          className="table-icon-button"
                          onClick={() => handleAction(`${API_BASE_URL}/contracts/${contract.contract_id}/approve`)}
                          title="Duyệt"
                          aria-label="Duyệt"
                        >
                          <PaymentActionIcon type="check" />
                        </button>
                      ) : contract.status === "approved" ? (
                        <button
                          className="table-icon-button"
                          onClick={() => handleAction(`${API_BASE_URL}/contracts/${contract.contract_id}/return`)}
                          title="Trả xe"
                          aria-label="Trả xe"
                        >
                          <PaymentActionIcon type="return" />
                        </button>
                      ) : (
                        <button
                          className="table-icon-button"
                          title="Đã trả xe"
                          aria-label="Đã trả xe"
                          disabled
                        >
                          <PaymentActionIcon type="return" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {pagedContracts.length === 0 ? (
                <tr>
                  <td colSpan="12">Không có hợp đồng nào trong khoảng ngày đã chọn.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {renderTablePagination({
            total: filteredContracts.length,
            pageRowsLength: pagedContracts.length,
            safePage,
            totalPages,
            setPage: setContractsPage,
            itemLabel: "hợp đồng",
          })}
        </div>
      );
    }

    if (activeTab === "payments") {
      const formatPaymentMethod = (method) => {
        const normalized = String(method || "").trim().toLowerCase();
        if (normalized === "cash") return "Tiền mặt";
        if (normalized === "transfer") return "Chuyển khoản";
        return method || "-";
      };
      const formatPaymentStatus = (status) => {
        const normalized = String(status || "").trim().toLowerCase();
        if (normalized === "paid") return "Đã thanh toán";
        if (normalized === "unpaid") return "Chưa thanh toán";
        return status || "-";
      };
      const paymentCarOptions = [
        ...new Set(
          payments
            .map((payment) => {
              const contract = contractById.get(Number(payment.contract_id));
              return carById.get(Number(contract?.car_id))?.name;
            })
            .filter(Boolean)
        ),
      ].sort((a, b) => String(a).localeCompare(String(b), "vi", { numeric: true }));
      const paymentStatusOptions = [...new Set(payments.map((payment) => payment.status).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), "vi"));
      const normalizedPaymentSearch = paymentSearch.trim().toLowerCase();
      const filteredPayments = payments.filter((payment) => {
        const contract = contractById.get(Number(payment.contract_id));
        const customer = customerById.get(Number(contract?.customer_id));
        const car = carById.get(Number(contract?.car_id));
        if (paymentCarFilter && car?.name !== paymentCarFilter) return false;
        if (paymentStatusFilter && payment.status !== paymentStatusFilter) return false;
        if (!normalizedPaymentSearch) return true;
        const searchable = [
          payment.payment_id,
          payment.contract_id,
          customer?.name,
          car?.name,
          payment.amount,
          payment.method,
          formatPaymentMethod(payment.method),
          payment.status,
          formatPaymentStatus(payment.status),
        ].join(" ").toLowerCase();
        return searchable.includes(normalizedPaymentSearch);
      });
      const sortedPayments = [...filteredPayments].sort((a, b) => {
        const contractA = contractById.get(Number(a.contract_id));
        const contractB = contractById.get(Number(b.contract_id));
        const dateDiff = getRowTime(contractB?.start_date) - getRowTime(contractA?.start_date);
        if (dateDiff !== 0) return dateDiff;
        return Number(b.payment_id || 0) - Number(a.payment_id || 0);
      });
      const { pageRows: pagedPayments, safePage, totalPages } = paginateRows(sortedPayments, paymentsPage);

      return (
        <div className="table-section">
          <div className="table-heading-row">
            <h3>Danh sách thanh toán</h3>
            <input
              className="table-search-input"
              type="search"
              value={paymentSearch}
              onChange={(event) => {
                setPaymentSearch(event.target.value);
                setPaymentsPage(1);
              }}
              placeholder="Tìm thanh toán..."
            />
          </div>
          <div className="payment-filter-grid">
            <label>
              Tên xe
              <select
                value={paymentCarFilter}
                onChange={(event) => {
                  setPaymentCarFilter(event.target.value);
                  setPaymentsPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {paymentCarOptions.map((carName) => (
                  <option key={carName} value={carName}>{carName}</option>
                ))}
              </select>
            </label>
            <label>
              Trạng thái
              <select
                value={paymentStatusFilter}
                onChange={(event) => {
                  setPaymentStatusFilter(event.target.value);
                  setPaymentsPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>{formatPaymentStatus(status)}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="action-button secondary payment-filter-clear"
              onClick={() => {
                setPaymentSearch("");
                setPaymentCarFilter("");
                setPaymentStatusFilter("");
                setPaymentsPage(1);
              }}
            >
              Xóa lọc
            </button>
          </div>
          <table className="payments-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Khách hàng</th>
                <th>Tên xe</th>
                <th>Số tiền</th>
                <th>Phương thức thanh toán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedPayments.map((payment, index) => {
                const contract = contractById.get(Number(payment.contract_id));
                const customer = customerById.get(Number(contract?.customer_id));
                const car = carById.get(Number(contract?.car_id));
                return (
                  <tr key={payment.payment_id}>
                    <td>{(safePage - 1) * 10 + index + 1}</td>
                    <td>{customer?.name || "-"}</td>
                    <td>{car?.name || "-"}</td>
                    <td>{Number(payment.amount || 0).toLocaleString("vi-VN")}</td>
                    <td>{formatPaymentMethod(payment.method)}</td>
                    <td>{formatPaymentStatus(payment.status)}</td>
                    <td>
                      <div className="table-icon-actions">
                        <button
                          className="table-icon-button"
                          type="button"
                          title="Thanh toán"
                          aria-label="Thanh toán"
                          disabled={payment.status === "paid"}
                          onClick={() => handleAction(`${API_BASE_URL}/payments/${payment.payment_id}/pay`)}
                        >
                          <PaymentActionIcon type="money" />
                        </button>
                        <button
                          className="table-icon-button danger"
                          type="button"
                          title="Xóa"
                          aria-label="Xóa"
                          onClick={() => handleAction(`${API_BASE_URL}/payments/${payment.payment_id}`, "DELETE")}
                        >
                          <PaymentActionIcon type="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pagedPayments.length === 0 ? (
                <tr>
                  <td colSpan="7">Không có thanh toán nào.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {renderTablePagination({
            total: sortedPayments.length,
            pageRowsLength: pagedPayments.length,
            safePage,
            totalPages,
            setPage: setPaymentsPage,
            itemLabel: "thanh toán",
          })}
        </div>
      );
    }

    if (activeTab === "users") {
      const canManagePersonnel = isAdmin;
      const userRoleOptions = [...new Set(dashboardUsers.map((user) => user.role).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), "vi"));
      const normalizedUserSearch = userSearch.trim().toLowerCase();
      const filteredUsers = dashboardUsers.filter((user) => {
        if (userRoleFilter && user.role !== userRoleFilter) return false;
        if (!normalizedUserSearch) return true;
        return [user.name, user.username, user.role]
          .join(" ")
          .toLowerCase()
          .includes(normalizedUserSearch);
      });
      const { pageRows: pagedUsers, safePage, totalPages } = paginateRows(filteredUsers, usersPage);

      return (
        <div className="table-section">
          <div className="table-heading-row">
            <h3>Danh sách nhân sự</h3>
            <div className="user-table-actions">
              <input
                className="table-search-input"
                type="search"
                value={userSearch}
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  setUsersPage(1);
                }}
                placeholder="Tìm tên hoặc email..."
              />
              {canManagePersonnel ? (
                <button type="button" className="action-button table-create-button" onClick={() => setShowCreateUserForm(true)}>
                  Tạo nhân sự
                </button>
              ) : null}
            </div>
          </div>
          <div className="user-filter-grid">
            <label>
              Role
              <select
                value={userRoleFilter}
                onChange={(event) => {
                  setUserRoleFilter(event.target.value);
                  setUsersPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {userRoleOptions.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>{roleOption}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="action-button secondary user-filter-clear"
              onClick={() => {
                setUserSearch("");
                setUserRoleFilter("");
                setUsersPage(1);
              }}
            >
              Xóa lọc
            </button>
          </div>
          {canManagePersonnel && showCreateUserForm ? (
            <>
              <div className="modal-overlay" onClick={() => setShowCreateUserForm(false)} />
              <div className="user-edit-modal">
                <form className="user-edit-card" onSubmit={handleCreateUser}>
                  <div className="user-edit-header">
                    <h3>Tạo nhân sự</h3>
                    <button type="button" className="modal-close" onClick={() => setShowCreateUserForm(false)}>×</button>
                  </div>
                  <div className="user-edit-grid">
                    <label>
                      Tên *
                      <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
                    </label>
                    <label>
                      Email *
                      <input type="email" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
                    </label>
                    <label>
                      Password *
                      <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                    </label>
                    <label>
                      Role *
                      <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                    </label>
                  </div>
                  <div className="user-edit-actions">
                    <button type="button" className="action-button secondary" onClick={() => setShowCreateUserForm(false)}>Hủy</button>
                    <button type="submit" className="action-button">Tạo</button>
                  </div>
                </form>
              </div>
            </>
          ) : null}
          {canManagePersonnel && editingUser ? (
            <>
              <div className="modal-overlay" onClick={() => setEditingUser(null)} />
              <div className="user-edit-modal">
                <form className="user-edit-card" onSubmit={handleUpdateUser}>
                  <div className="user-edit-header">
                    <h3>Sửa nhân sự</h3>
                    <button type="button" className="modal-close" onClick={() => setEditingUser(null)}>×</button>
                  </div>
                  <div className="user-edit-grid">
                    <label>
                      Tên
                      <input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} required />
                    </label>
                    <label>
                      Email
                      <input type="email" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} required />
                    </label>
                    <label>
                      Password
                      <input value={editingUser.password} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} required />
                    </label>
                    <label>
                      Role
                      <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                    </label>
                  </div>
                  <div className="user-edit-actions">
                    <button type="button" className="action-button secondary" onClick={() => setEditingUser(null)}>Hủy</button>
                    <button type="submit" className="action-button">Lưu</button>
                  </div>
                </form>
              </div>
            </>
          ) : null}
          <table className="users-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Password</th>
                <th>Role</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((user, index) => (
                <tr key={user.user_id}>
                  <td>{(safePage - 1) * 10 + index + 1}</td>
                  <td>{user.name || "-"}</td>
                  <td>{user.username}</td>
                  <td>{user.password ? "•".repeat(Math.min(String(user.password).length, 12)) : "-"}</td>
                  <td>{user.role}</td>
                  <td>
                    {canManagePersonnel ? (
                      <div className="action-buttons">
                        <button
                          className="table-icon-button"
                          type="button"
                          title="Sửa"
                          aria-label="Sửa"
                          onClick={() => handleStartEditUser(user)}
                        >
                          <PaymentActionIcon type="edit" />
                        </button>
                        <button
                          className="table-icon-button danger"
                          type="button"
                          title="Xóa"
                          aria-label="Xóa"
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          <PaymentActionIcon type="trash" />
                        </button>
                      </div>
                    ) : (
                      <span className="readonly-note">Chỉ xem</span>
                    )}
                  </td>
                </tr>
              ))}
              {pagedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6">Không có nhân sự nào.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {renderTablePagination({
            total: filteredUsers.length,
            pageRowsLength: pagedUsers.length,
            safePage,
            totalPages,
            setPage: setUsersPage,
            itemLabel: "nhân sự",
          })}
        </div>
      );
    }

    return null;
  };

  const renderAboutSection = () => (
    <section className="about" id="gioi-thieu" ref={aboutRef}>
      <div className="about-container">
        <p className="about-eyebrow">Công ty Cổ phần TĐ Phương Đông</p>
        <h2 className="section-title about-title">Giới thiệu</h2>
        <p className="about-lead">
          Thành lập năm 2017, Phương Đông là doanh nghiệp chuyên cho thuê xe ô tô tự lái và có lái,
          phục vụ khách hàng cá nhân và doanh nghiệp trong và ngoài nước với đội xe đa dạng từ phổ thông
          đến cao cấp: 4 chỗ, 7 chỗ, 16 chỗ, 29 chỗ và 45 chỗ.
        </p>

        <div className="about-services-grid">
          <article className="about-service-card">
            <HomeSectionIcon type="enterprise" className="about-service-icon" />
            <h3>Đưa đón cán bộ, nhân viên</h3>
            <p>
              Dịch vụ được các doanh nghiệp lựa chọn để đưa đón lãnh đạo, chuyên gia nước ngoài và
              nhân viên tại khu công nghiệp hoặc đi công tác. Khách hàng chủ động sử dụng xe cho từng
              chuyến mà không lo bảo hiểm, đăng kiểm hay chi phí bảo dưỡng.
            </p>
          </article>
          <article className="about-service-card">
            <HomeSectionIcon type="airport" className="about-service-icon" />
            <h3>Du lịch &amp; công tác theo chuyến</h3>
            <p>
              Thuê xe chuyến lẻ (tự lái hoặc có lái) khi không cần tần suất cao: du lịch, công tác,
              đưa đón sân bay, sử dụng xe theo ngày trong thành phố và nhiều mục đích khác.
            </p>
          </article>
          <article className="about-service-card">
            <HomeSectionIcon type="customService" className="about-service-icon" />
            <h3>Dịch vụ xe theo yêu cầu</h3>
            <p>
              Cho thuê xe cưới, quay phim, chụp mẫu, trưng bày triển lãm… Liên hệ trực tiếp để được
              tư vấn và hỗ trợ cho mọi nhu cầu về ô tô.
            </p>
          </article>
        </div>

        <div className="about-split">
          <article className="about-panel">
            <HomeSectionIcon type="history" className="about-panel-icon" />
            <h3>Lịch sử phát triển</h3>
            <p>
              Công ty được thành lập ngày 22/5/2017 với dịch vụ vận tải hành khách – cho thuê ô tô theo
              hợp đồng. Khởi đầu với quy mô nhỏ, chuyên phục vụ các chuyến lẻ; sau đó mở rộng sang khách
              hàng doanh nghiệp với nhiều hình thức cho thuê xe đưa đón và phục vụ dài hạn.
            </p>
          </article>
          <article className="about-panel">
            <HomeSectionIcon type="mission" className="about-panel-icon" />
            <h3>Tầm nhìn &amp; sứ mệnh</h3>
            <p>
              Trở thành người bạn đồng hành đáng tin cậy mà khách hàng nghĩ tới đầu tiên cho mỗi chuyến đi.
            </p>
            <p>
              Mang tới sự thoải mái, an tâm và hài lòng trên mọi phương diện nhờ sự chuyên nghiệp và nhiệt
              tình của đội ngũ nhân viên và lái xe.
            </p>
          </article>
        </div>

        <h3 className="about-subtitle">Giá trị cốt lõi</h3>
        <div className="about-values-grid">
          <article className="about-value-card">
            <div className="about-value-tags">
              <span>Uy tín</span>
              <span>Chuyên nghiệp</span>
            </div>
            <p>
              Nỗ lực tạo dựng và giữ gìn uy tín với khách hàng, đối tác và nhân viên. Dịch vụ chất lượng
              nhờ đội ngũ lái xe và nhân viên chuyên nghiệp.
            </p>
          </article>
          <article className="about-value-card">
            <div className="about-value-tags">
              <span>An toàn</span>
              <span>Trải nghiệm</span>
            </div>
            <p>
              Lái xe giàu kinh nghiệm, xe chất lượng cao được theo dõi và bảo dưỡng thường xuyên — mang lại
              sự an tâm và trải nghiệm hài lòng trên mỗi hành trình.
            </p>
          </article>
          <article className="about-value-card">
            <div className="about-value-tags">
              <span>Đồng hành</span>
              <span>Kết nối</span>
            </div>
            <p>
              Giao tiếp hiệu quả với khách hàng và đối tác, môi trường làm việc thoải mái trong nội bộ —
              nâng cao chất lượng dịch vụ từng ngày.
            </p>
          </article>
        </div>

        <div className="about-highlights">
          <div className="about-highlight">
            <HomeSectionIcon type="gps" className="about-highlight-icon" />
            <strong>GPS &amp; giám sát</strong>
            <span>Kiểm soát vị trí, tình trạng xe và hỗ trợ kịp thời</span>
          </div>
          <div className="about-highlight">
            <HomeSectionIcon type="fuel" className="about-highlight-icon" />
            <strong>Quản lý nhiên liệu</strong>
            <span>Mua xăng dầu qua thẻ, vận hành minh bạch</span>
          </div>
          <div className="about-highlight">
            <HomeSectionIcon type="team" className="about-highlight-icon" />
            <strong>Đội ngũ</strong>
            <span>CSKH tận tâm, nhân sự văn phòng đúng chuyên ngành</span>
          </div>
        </div>
      </div>
    </section>
  );

  const renderCustomerView = () => (
    <section className="customer-view">
      <div className="customer-view-header">
        <h2>{loggedInUser ? "Khám phá mẫu xe của chúng tôi" : "Xem mẫu xe cho thuê"}</h2>
        <p>
          {loggedInUser
            ? "Chọn xe, xem thông tin chi tiết và liên hệ để đặt thuê."
            : "Duyệt qua các mẫu xe sẵn có ngay cả khi bạn chưa đăng nhập."}
        </p>
      </div>
      <div
        ref={carGridRef}
        className="car-grid"
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
        onPointerCancel={handleGridPointerUp}
      >
        {displayCars.map((car) => (
          <div
            key={car.car_id}
            className="car-card car-card-link"
            data-car-detail-path={selfDriveDetailPath(car)}
            role="button"
            tabIndex={0}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            onClick={(event) => handleCarCardClick(event, car)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(selfDriveDetailPath(car));
              }
            }}
          >
            <div className="car-card-top">
              <span className="car-card-badge">{getCarCategory(car)}</span>
              {isCarRented(car) ? (
                <span className="car-card-badge car-card-badge-rented">Đang cho thuê</span>
              ) : null}
            </div>
            <h3>{car.name}</h3>
            <p className="car-card-subtitle">{getCarSubtitle(car)}</p>
            <div className="car-card-image car-card-image-img">
              <img src={getCarImageUrl(car, fallbackCars)} alt={car.name} loading="lazy" />
            </div>
            <div className="car-card-info-row">
              <div>
                <div className="car-card-price">{car.price_per_day.toLocaleString()} VND</div>
                <div className="car-card-note">Giá/ngày</div>
              </div>
              <span className="car-card-button" role="button">
                Xem chi tiết
              </span>
            </div>
            <div className="car-card-specs">
              <div>
                <span className="car-card-spec-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M3.8 19.5c.7-3 2.2-4.5 4.2-4.5s3.5 1.5 4.2 4.5" />
                    <path d="M11.8 19.5c.7-3 2.2-4.5 4.2-4.5s3.5 1.5 4.2 4.5" />
                  </svg>
                </span>
                <strong>{getCarSeats(car)}</strong>
              </div>
              <div>
                <span className="car-card-spec-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 5v14" />
                    <path d="M17 5v14" />
                    <path d="M7 12h10" />
                    <path d="M7 5h4" />
                    <path d="M17 19h-4" />
                    <circle cx="7" cy="5" r="2" />
                    <circle cx="17" cy="12" r="2" />
                    <circle cx="17" cy="19" r="2" />
                  </svg>
                </span>
                <strong>{getCarTransmission(car)}</strong>
              </div>
              <div>
                <span
                  className="car-card-spec-icon color"
                  style={{ "--spec-color": getCarColorSwatch(car.color) }}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3.8s6 6.2 6 10.2a6 6 0 0 1-12 0c0-4 6-10.2 6-10.2Z" />
                    <path d="M9.3 16.7c.8 1.2 2.2 1.9 3.7 1.7" />
                  </svg>
                </span>
                <strong>{car.color || "-"}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="view-all-cars-wrapper">
        <Link to="/thue-xe-tu-lai" className="cta-button view-all-cars-button">
          Xem tất cả các xe
        </Link>
      </div>
    </section>
  );

  return (
    <div className={`app${!adminMode && showAboutSection ? " about-view" : ""}`}>
      {/* HEADER */}
      <header className={`header${showLoginForm ? " header-auth-open" : ""}${isHeaderHidden && !showServiceOptions && !showLoginForm ? " header-hidden" : ""}`}>
        <div className="header-container">
          <button className="logo" type="button" onClick={() => navigate('/')}>
            <span className="logo-icon"><img src="/image/brand/logo.png" alt="Phương Đông" /></span>
            <div className="logo-text">
              <p className="logo-main">Dịch vụ cho thuê xe linh hoạt</p>
            </div>
          </button>

          <nav className="nav">
            {canAccessDashboard && loggedInUser ? (
              <>
                <button className="nav-item" onClick={() => navigate('/')}>Trang chủ</button>
                <button className="nav-item" onClick={() => navigate('/admin')}>Dashboard</button>
              </>
            ) : (
              <button className="nav-item" onClick={() => navigate('/')}>Trang chủ</button>
            )}
            <button
              className={`nav-item service-button ${showServiceOptions ? "active" : ""}`}
              onClick={() => {
                setShowAboutSection(false);
                setShowServiceOptions((prev) => !prev);
              }}
            >
              Dịch vụ
            </button>
            <button
              className={`nav-item ${showAboutSection ? "active" : ""}`}
              type="button"
              onClick={handleAboutNavClick}
            >
              Giới thiệu
            </button>
            <button
              className="nav-item"
              type="button"
              onClick={() => {
                setShowAboutSection(false);
                navigate("/tin-tuc");
              }}
            >
              Tin tức
            </button>
          </nav>

          <div className="login-controls">
            {loggedInUser ? (
              <>
              <div className="notification-container">
                <button
                  type="button"
                  className={`notification-bell ${unreadNotificationCount > 0 ? "has-unread" : ""}`}
                  aria-label="Thông báo"
                  title="Thông báo"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowNotifications((prev) => !prev);
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                  {unreadNotificationCount > 0 ? (
                    <span className="notification-count">{unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}</span>
                  ) : null}
                </button>
                {showNotifications ? (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      <div>
                        <strong>Thông báo</strong>
                        <span>{unreadNotificationCount > 0 ? `${unreadNotificationCount} mới` : "Đã đọc"}</span>
                      </div>
                      <button
                        type="button"
                        className="notification-read-all"
                        disabled={unreadNotificationCount === 0}
                        onClick={(event) => {
                          event.stopPropagation();
                          markNotificationsRead();
                        }}
                      >
                        Đã đọc tất cả
                      </button>
                    </div>
                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`notification-item ${item.read ? "" : "unread"}`}
                            onClick={() => {
                              markNotificationRead(item.id);
                              setShowNotifications(false);
                              if (canAccessDashboard) {
                                refreshData();
                                navigate("/admin");
                                setActiveTab("requests");
                              } else {
                                navigate("/my-rentals");
                              }
                            }}
                          >
                            <span className="notification-dot" />
                            <span>
                              <strong>{item.title}</strong>
                              <small>{item.message}</small>
                              <em>{formatNotificationTime(item.createdAt)}</em>
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="notification-empty">Chưa có thông báo mới.</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="user-menu-container">
                <button 
                  className="user-avatar-btn" 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    <span>👤</span>
                  </div>
                  <span className="user-name">{loggedInUser}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-info">
                        <div className="user-avatar-large">👤</div>
                        <div>
                          <div className="user-display-name">{loggedInUser}</div>
                          <div className="user-role">Vai trò: {normalizedRole === 'admin' ? 'Quản trị viên' : normalizedRole === 'staff' ? 'Nhân viên' : 'Khách hàng'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="user-dropdown-menu">
                      <button className="dropdown-item" onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}>
                        <span>👤</span>
                        Thông tin cá nhân
                      </button>
                      {canAccessDashboard ? (
                        <button className="dropdown-item" onClick={() => {
                          navigate('/admin');
                          setShowUserMenu(false);
                        }}>
                          <span>📋</span>
                          Quản lý
                        </button>
                      ) : null}
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <span>🚪</span>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
            ) : (
              <>
                <button className="login-btn" onClick={handleLoginClick}>Đăng nhập</button>
                {showLoginForm && (
                  <>
                    <div className="modal-overlay" onClick={handleCloseAuth} />
                    <div className="login-modal">
                      <button type="button" className="modal-close" onClick={handleCloseAuth}>×</button>
                      <div className="auth-card">
                        <div className="auth-panel">
                          <div className="auth-header">
                            <h3>{authMode === "login" ? "Đăng nhập" : "Đăng ký"}</h3>
                            <p>{authMode === "login" ? "Nhập tài khoản để tiếp tục." : "Tạo tài khoản mới để bắt đầu."}</p>
                          </div>
                          <div className="auth-switch">
                            <button className={`auth-toggle ${authMode === "login" ? "active" : ""}`} type="button" onClick={() => handleAuthModeChange("login")}>Đăng nhập</button>
                            <button className={`auth-toggle ${authMode === "register" ? "active" : ""}`} type="button" onClick={() => handleAuthModeChange("register")}>Đăng ký</button>
                          </div>
                          {authMode === "login" ? (
                            <form className="auth-form" onSubmit={handleLoginSubmit}>
                              <label>
                                Email
                                <input
                                  type="email"
                                  placeholder="Nhập email"
                                  value={loginData.username}
                                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                  required
                                />
                              </label>
                              <label className="password-field">
                                Mật khẩu
                                <div className="password-input-wrapper">
                                  <input
                                    type={showLoginPassword ? "text" : "password"}
                                    placeholder="Nhập mật khẩu"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    required
                                  />
                                  <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowLoginPassword((prev) => !prev)}
                                    aria-label={showLoginPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                  >
                                    <PasswordVisibilityIcon visible={showLoginPassword} />
                                  </button>
                                </div>
                              </label>
                              <button type="submit" className="cta-button auth-submit">Đăng nhập</button>
                              <button type="button" className="auth-secondary" onClick={() => notify("Chức năng quên mật khẩu chưa có.", "info")}>Quên mật khẩu</button>
                              <div className="auth-footer">
                                <span>Bạn chưa có tài khoản?</span>
                                <button type="button" className="auth-link" onClick={() => handleAuthModeChange("register")}>Đăng ký tài khoản</button>
                              </div>
                            </form>
                          ) : (
                            <form className="auth-form" onSubmit={handleRegisterSubmit}>
                              <label>
                                Họ và tên*
                                <input
                                  type="text"
                                  placeholder="Nhập họ và tên"
                                  value={registerData.fullName}
                                  onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                                  required
                                />
                              </label>
                              <label>
                                Email*
                                <input
                                  type="email"
                                  placeholder="Nhập email"
                                  value={registerData.email}
                                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                  required
                                />
                              </label>
                              <label>
                                Số điện thoại*
                                <input
                                  type="tel"
                                  placeholder="Nhập số điện thoại"
                                  value={registerData.phone}
                                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                                  required
                                />
                              </label>
                              <label>
                                Địa chỉ
                                <input
                                  type="text"
                                  placeholder="Nhập địa chỉ"
                                  value={registerData.address}
                                  onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                                />
                              </label>
                              <label className="password-field">
                                Mật khẩu*
                                <div className="password-input-wrapper">
                                  <input
                                    type={showRegisterPassword ? "text" : "password"}
                                    placeholder="Nhập mật khẩu"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    required
                                  />
                                  <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                                    aria-label={showRegisterPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                  >
                                    <PasswordVisibilityIcon visible={showRegisterPassword} />
                                  </button>
                                </div>
                              </label>
                              <button type="submit" className="cta-button auth-submit">Đăng ký</button>
                              <div className="auth-footer">
                                <span>Đã có tài khoản?</span>
                                <button type="button" className="auth-link" onClick={() => handleAuthModeChange("login")}>Đăng nhập</button>
                              </div>
                            </form>
                          )}
                        </div>
                        <div className="auth-image" />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {showServiceOptions && !showAboutSection && (
          <section className="top-service-bar">
            <div className="service-toggle">
              <button
                type="button"
                className={`service-option ${selectedRentalType === "tự lái" ? "active" : ""}`}
                onClick={() => handleSelectRentalType("tự lái")}
              >
                Thuê xe tự lái
              </button>
              <button
                type="button"
                className={`service-option ${selectedRentalType === "có lái" ? "active" : ""}`}
                onClick={() => handleSelectRentalType("có lái")}
              >
                Thuê xe có lái
              </button>
            </div>
          </section>
        )}
      </header>

      {!adminMode && showAboutSection && renderAboutSection()}

      {!adminMode && !showAboutSection && (
        <>
      {/* HERO SECTION - FULL VIEWPORT */}
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Đáp ứng mọi nhu cầu thuê xe
          </h1>

          <p className="hero-subtitle">
            Cung cấp dịch vụ thuê xe{" "}
            {selectedRentalType === "tự lái" ? "tự lái" : "có lái"},
            phục vụ mọi nhu cầu di chuyển của bạn
          </p>

          <button
            className="cta-button"
            type="button"
            onClick={() => {
              if (selectedRentalType === "tự lái")
                navigate("/thue-xe-tu-lai");
              else
                navigate("/thue-xe-co-lai");
            }}
          >
            {selectedRentalType === "tự lái"
              ? "Bắt đầu thuê xe tự lái"
              : "Bắt đầu thuê xe có lái"}
          </button>
        </div>
      </section>
      {renderCustomerView()}
        </>
      )}

      {/* DASHBOARD SECTION */}
      {adminMode && (
        canAccessDashboard ? (
          <section className="dashboard">
          <div className="dashboard-container">
            <div className="dashboard-layout">
              <aside className="dashboard-sidebar">
                <div className="dashboard-sidebar-title">Quản lý</div>
                <div className="dashboard-tabs dashboard-tabs-vertical">
                  {[
                    { key: "summary", label: "Tổng quan" },
                    { key: "cars", label: "Xe" },
                    { key: "customers", label: "Khách hàng" },
                    { key: "requests", label: "Yêu cầu" },
                    { key: "contracts", label: "Hợp đồng" },
                    { key: "payments", label: "Thanh toán" },
                    ...(isAdmin ? [{ key: "users", label: "Nhân sự" }] : []),
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      className={`dashboard-tab ${activeTab === tab.key ? "active" : ""}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </aside>
              <div className="dashboard-table dashboard-content">{renderTabContent()}</div>
            </div>
          </div>
        </section>
      ) : (
        <section className="dashboard">
          <div className="dashboard-container">
            <h2 className="section-title">Không có quyền truy cập</h2>
            <p>Bạn cần đăng nhập bằng tài khoản quản trị để xem trang này.</p>
            <button className="cta-button" type="button" onClick={() => navigate('/')}>Về trang chủ</button>
          </div>
        </section>
      ))}

      {!adminMode && !showAboutSection && (
        <>
      {/* SERVICES SECTION */}
      <section className="services" ref={servicesRef}>
        <div className="services-container">
          <h2 className="section-title">Dịch vụ của chúng tôi</h2>
          <div className="services-grid">
            <div className={`service-card ${selectedRentalType === "tự lái" ? "active" : ""}`}>
              <HomeSectionIcon type="selfDrive" className="service-icon" />
              <h3>Thuê xe tự lái</h3>
              <p>Chủ động hành trình, đa dạng dòng xe từ phổ thông đến cao cấp</p>
            </div>
            <div className={`service-card ${selectedRentalType === "có lái" ? "active" : ""}`}>
              <HomeSectionIcon type="chauffeur" className="service-icon" />
              <h3>Thuê xe có lái</h3>
              <p>Tài xế giàu kinh nghiệm, an toàn và thoải mái trên mọi chuyến đi</p>
            </div>
            <div className="service-card">
              <HomeSectionIcon type="enterprise" className="service-icon" />
              <h3>Đưa đón doanh nghiệp</h3>
              <p>Phục vụ nhân viên, chuyên gia tại khu công nghiệp theo tháng hoặc dài hạn</p>
            </div>
            <div className="service-card">
              <HomeSectionIcon type="route" className="service-icon" />
              <h3>Chuyến lẻ &amp; dự án</h3>
              <p>Du lịch, công tác, sân bay và xe phục vụ dự án theo yêu cầu</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className="why-choose">
        <div className="why-choose-container">
          <h2 className="section-title">Tại sao chọn Phương Đông?</h2>
          <div className="why-choose-grid">
            <div className="why-item">
              <h3>✓ Uy tín &amp; chuyên nghiệp</h3>
              <p>Đội ngũ lái xe và nhân viên tận tâm, dịch vụ chất lượng ổn định</p>
            </div>
            <div className="why-item">
              <h3>✓ An toàn trên mọi hành trình</h3>
              <p>Xe được bảo dưỡng định kỳ, giám sát GPS và hỗ trợ kịp thời</p>
            </div>
            <div className="why-item">
              <h3>✓ Đa dạng đội xe</h3>
              <p>Từ sedan đến xe 45 chỗ, đáp ứng cá nhân và doanh nghiệp</p>
            </div>
            <div className="why-item">
              <h3>✓ Đồng hành lâu dài</h3>
              <p>Hợp tác với nhiều đối tác trong và ngoài nước từ năm 2017</p>
            </div>
          </div>
        </div>
      </section>

      {/* FLEET SECTION */}
      <section className="fleet">
        <div className="fleet-container">
          <h2 className="section-title">Các loại xe của chúng tôi</h2>
          <p className="fleet-intro">
            Cung cấp nhiều hãng và dòng xe tùy nhu cầu — từ sedan cao cấp đến xe khách 45 chỗ.
            Liên hệ để được tư vấn thêm các mẫu xe khác.
          </p>
          <div className="fleet-grid">
            <div className="fleet-card">
              <HomeSectionIcon type="sedan" className="fleet-image" />
              <h3>Toyota Camry / Vios</h3>
              <p>Sedan cao cấp &amp; tiết kiệm — công tác, sân bay, nội thành</p>
            </div>
            <div className="fleet-card">
              <HomeSectionIcon type="van" className="fleet-image" />
              <h3>Kia Sedona / Carnival</h3>
              <p>7 chỗ rộng rãi — đưa đón sếp, chuyên gia, du lịch</p>
            </div>
            <div className="fleet-card">
              <HomeSectionIcon type="limousine" className="fleet-image" />
              <h3>Dcar / Limousine</h3>
              <p>Sang trọng, thoải mái — du lịch công ty, gia đình</p>
            </div>
            <div className="fleet-card">
              <HomeSectionIcon type="bus" className="fleet-image" />
              <h3>Transit / Universe / Aero</h3>
              <p>16–45 chỗ — du lịch, đưa đón nhân viên doanh nghiệp</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials">
        <div className="testimonials-container">
          <h2 className="section-title">Cảm nhận từ khách hàng</h2>
          {customerReviews.length > 0 ? (
            <div className="submitted-reviews">
              <h3>Đánh giá mới nhất</h3>
              <div className="submitted-reviews-grid">
                {customerReviews.map((review) => (
                  <article className="testimonial-card submitted-review-card" key={review.id}>
                    <HomeSectionIcon type="quote" className="testimonial-icon" />
                    <p>"{review.message}"</p>
                    <h4>{review.name}</h4>
                    <RatingRow rating={review.rating} />
                  </article>
                ))}
              </div>
            </div>
          ) : null}
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <HomeSectionIcon type="quote" className="testimonial-icon" />
              <p>"Dịch vụ rất tuyệt vời, xe mới, giá hợp lý. Sẽ thuê lại!"</p>
              <h4>Nguyễn Văn A</h4>
              <RatingRow rating={5} />
            </div>
            <div className="testimonial-card">
              <HomeSectionIcon type="quote" className="testimonial-icon" />
              <p>"Tài xế chuyên nghiệp, xe sạch sẽ, thoải mái cho chuyến đi"</p>
              <h4>Trần Thị B</h4>
              <RatingRow rating={5} />
            </div>
            <div className="testimonial-card">
              <HomeSectionIcon type="quote" className="testimonial-icon" />
              <p>"Quá tuyệt vời, từ đặt lịch đến giao xe rất nhanh chóng"</p>
              <h4>Phạm Văn C</h4>
              <RatingRow rating={5} />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="contact">
        <div className="contact-container">
          <h2 className="section-title">Đánh giá dịch vụ</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3><HomeSectionIcon type="review" className="contact-icon" /> Chia sẻ trải nghiệm</h3>
                <p>Đánh giá của bạn sẽ được hiển thị trong phần cảm nhận khách hàng.</p>
              </div>
              <div className="contact-item">
                <h3><HomeSectionIcon type="account" className="contact-icon" /> Tài khoản</h3>
                <p>{loggedInUser ? `Bạn đang đăng nhập với tên ${loggedInUser}.` : "Bạn cần đăng nhập trước khi gửi đánh giá."}</p>
              </div>
              <div className="contact-item">
                <h3><HomeSectionIcon type="support" className="contact-icon" /> Hỗ trợ</h3>
                <p>0566 999 666 / 0979 402 470</p>
              </div>
            </div>
            <form className="contact-form review-form" onSubmit={handleReviewSubmit}>
              <label>
                Mức đánh giá
                <select
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}
                >
                  <option value="5">5 sao - Rất hài lòng</option>
                  <option value="4">4 sao - Hài lòng</option>
                  <option value="3">3 sao - Bình thường</option>
                  <option value="2">2 sao - Chưa hài lòng</option>
                  <option value="1">1 sao - Cần cải thiện</option>
                </select>
              </label>
              <label>
                Nội dung đánh giá
                <textarea
                  placeholder="Nhập cảm nhận của bạn..."
                  rows="5"
                  value={reviewForm.message}
                  onChange={(event) => {
                    setReviewNotice("");
                    setReviewForm({ ...reviewForm, message: event.target.value });
                  }}
                />
              </label>
              {reviewNotice ? <div className="review-notice">{reviewNotice}</div> : null}
              <button type="submit" className="cta-button">Gửi đánh giá</button>
            </form>
          </div>
        </div>
      </section>
        </>
      )}

      {/* FOOTER */}
      <AppFooter />
    </div>
  );
}

export default App;
