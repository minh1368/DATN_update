export function notifyUser(message, type = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { message, type } }));
}

export function getReadableErrorMessage(error, fallback = "Thao tác thất bại. Vui lòng thử lại.") {
  const message = String(error?.message || error || "").trim();

  if (!message) return fallback;
  if (message === "Failed to fetch" || message.includes("NetworkError") || message.includes("fetch")) {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend hoặc link public.";
  }

  return message;
}
