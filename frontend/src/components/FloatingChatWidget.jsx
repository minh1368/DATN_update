import { useCallback, useEffect, useRef, useState } from "react";
import { authStorage, normalizeRoleValue } from "../lib/auth.js";
import { aiChatService, supportChatService } from "../services/supportChatService.js";

export default function FloatingChatWidget() {
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
      name: userData.name || authStorage.getItem("loggedInUser") || "Khách hàng ẩn danh",
      email: userData.email || userData.username || "",
    };
  };

  const chatUser = getChatUser();
  const isStaffChat = chatUser.role === "admin" || chatUser.role === "staff";

  const loadSupportMessages = useCallback(async (id) => {
    if (!id) return;
    const data = await supportChatService.getMessages(id).catch(() => []);
    setSupportMessages(Array.isArray(data) ? data : []);
  }, []);

  const refreshCustomerUnread = useCallback(async (id = conversationId) => {
    if (!id || isStaffChat) return;
    const data = await supportChatService.getConversation(id).catch(() => null);
    if (!data) return;
    setSupportUnreadCount(Number(data.customer_unread_count || 0));
  }, [conversationId, isStaffChat]);

  const loadSupportConversations = useCallback(async () => {
    const data = await supportChatService.getConversations().catch(() => []);
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
  }, [loadSupportMessages]);

  const markSupportRead = useCallback(async (id, reader) => {
    if (!id) return;
    await supportChatService.markRead(id, reader).catch(() => {});
    if (reader === "customer") {
      refreshCustomerUnread(id);
    } else {
      loadSupportConversations();
    }
  }, [loadSupportConversations, refreshCustomerUnread]);

  const ensureSupportConversation = useCallback(async () => {
    if (conversationId) return conversationId;
    const data = await supportChatService.createConversation({
      customer_id: chatUser.customerId ? Number(chatUser.customerId) : null,
      customer_name: chatUser.name,
      customer_email: chatUser.email,
    });
    authStorage.setItem("supportConversationId", String(data.conversation_id));
    setConversationId(String(data.conversation_id));
    return String(data.conversation_id);
  }, [chatUser.customerId, chatUser.email, chatUser.name, conversationId]);

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
  }, [
    chatMode,
    ensureSupportConversation,
    isOpen,
    isStaffChat,
    loadSupportConversations,
    loadSupportMessages,
    markSupportRead,
    selectedSupportConversation?.conversation_id,
  ]);

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
  }, [conversationId, isStaffChat, loadSupportConversations, refreshCustomerUnread]);

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
  }, [
    chatMode,
    conversationId,
    isOpen,
    isStaffChat,
    loadSupportConversations,
    loadSupportMessages,
    markSupportRead,
    selectedSupportConversation?.conversation_id,
  ]);

  useEffect(() => {
    if (!isOpen || chatMode !== "human") return;
    window.requestAnimationFrame(() => {
      supportMessagesEndRef.current?.scrollIntoView({ block: "end" });
    });
  }, [supportMessages, isOpen, chatMode, selectedSupportConversation?.conversation_id]);

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
      const data = await aiChatService.sendMessage({ message: trimmedInput, messages: history });
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
      await supportChatService.sendCustomerMessage(id, trimmedMessage);
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

    try {
      await supportChatService.sendStaffMessage(selectedSupportConversation.conversation_id, text);
    } catch {
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
              {humanSent ? <span className="human-chat-status">Đã gửi tin nhắn. Chúng tôi sẽ sớm phản hồi.</span> : null}
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


