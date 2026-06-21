import { apiJson } from "./apiClient.js";

export const supportChatService = {
  getMessages: (conversationId) => apiJson(`/support/conversations/${conversationId}/messages`),
  getConversation: (conversationId) => apiJson(`/support/conversations/${conversationId}`),
  markRead: (conversationId, reader) => (
    apiJson(`/support/conversations/${conversationId}/read/${reader}`, { method: "POST" })
  ),
  getConversations: () => (
    apiJson("/support/conversations")
  ),
  createConversation: (data) => (
    apiJson("/support/conversations", { method: "POST", body: data })
  ),
  sendCustomerMessage: (conversationId, message) => (
    apiJson(`/support/conversations/${conversationId}/customer-message`, {
      method: "POST",
      body: { message },
    })
  ),
  sendStaffMessage: (conversationId, message) => (
    apiJson(`/support/conversations/${conversationId}/staff-message`, {
      method: "POST",
      body: { message },
    })
  ),
};

export const aiChatService = {
  sendMessage: (data) => apiJson("/ai/chat", { method: "POST", body: data, fallbackError: "AI không phản hồi." }),
};
