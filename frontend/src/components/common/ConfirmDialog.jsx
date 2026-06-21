export default function ConfirmDialog({
  open,
  title = "Xác nhận thao tác",
  message = "Bạn có chắc chắn muốn tiếp tục?",
  confirmText = "Xóa",
  cancelText = "Hủy",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onCancel} />
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="confirm-dialog-header">
          <h3 id="confirm-dialog-title">{title}</h3>
          <button className="modal-close" type="button" onClick={onCancel} aria-label="Đóng">
            ×
          </button>
        </div>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={danger ? "action-button danger" : "action-button"}
            type="button"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
