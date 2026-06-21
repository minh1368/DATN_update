import { useState } from "react";
import { PasswordVisibilityIcon, PaymentActionIcon } from "../AppIcons.jsx";

export default function CustomerManagement({
  customers,
  customerSearch,
  setCustomerSearch,
  customersPage,
  setCustomersPage,
  paginateRows,
  renderTablePagination,
  showCreateCustomerForm,
  setShowCreateCustomerForm,
  newCustomer,
  setNewCustomer,
  handleCreateCustomer,
  editingCustomer,
  setEditingCustomer,
  handleUpdateCustomer,
  handleStartEditCustomer,
  canDeleteData,
  handleDeleteCustomer,
}) {
  const [showEditingCustomerPassword, setShowEditingCustomerPassword] = useState(false);
  const normalizedCustomerSearch = customerSearch.trim().toLowerCase();
  const formatCustomerCreatedDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const closeEditingCustomer = () => {
    setShowEditingCustomerPassword(false);
    setEditingCustomer(null);
  };
  const filteredCustomers = customers.filter((customer) => {
    if (!normalizedCustomerSearch) return true;
    return [customer.name, customer.phone, customer.email, customer.address, formatCustomerCreatedDate(customer.created_at)]
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
                  <input value={newCustomer.name} onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })} required />
                </label>
                <label>
                  Số điện thoại *
                  <input value={newCustomer.phone} onChange={(event) => setNewCustomer({ ...newCustomer, phone: event.target.value })} required />
                </label>
                <label>
                  Email *
                  <input type="email" value={newCustomer.email} onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })} required />
                </label>
                <label>
                  Mật khẩu *
                  <input value={newCustomer.password} onChange={(event) => setNewCustomer({ ...newCustomer, password: event.target.value })} required />
                </label>
                <label>
                  Địa chỉ
                  <input value={newCustomer.address} onChange={(event) => setNewCustomer({ ...newCustomer, address: event.target.value })} />
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
          <div className="modal-overlay" onClick={closeEditingCustomer} />
          <div className="user-edit-modal">
            <form className="user-edit-card" onSubmit={handleUpdateCustomer}>
              <div className="user-edit-header">
                <h3>Sửa khách hàng</h3>
                <button type="button" className="modal-close" onClick={closeEditingCustomer}>×</button>
              </div>
              <div className="user-edit-grid">
                <label>
                  Tên
                  <input value={editingCustomer.name} onChange={(event) => setEditingCustomer({ ...editingCustomer, name: event.target.value })} required />
                </label>
                <label>
                  Số điện thoại
                  <input value={editingCustomer.phone} onChange={(event) => setEditingCustomer({ ...editingCustomer, phone: event.target.value })} required />
                </label>
                <label>
                  Email
                  <input type="email" value={editingCustomer.email} onChange={(event) => setEditingCustomer({ ...editingCustomer, email: event.target.value })} />
                </label>
                <label>
                  Mật khẩu
                  <div className="password-input-wrapper dashboard-password-wrapper">
                    <input
                      type={showEditingCustomerPassword ? "text" : "password"}
                      value={editingCustomer.password}
                      onChange={(event) => setEditingCustomer({ ...editingCustomer, password: event.target.value })}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowEditingCustomerPassword((current) => !current)}
                      aria-label={showEditingCustomerPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      title={showEditingCustomerPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <PasswordVisibilityIcon visible={showEditingCustomerPassword} />
                    </button>
                  </div>
                </label>
                <label className="user-edit-full-width">
                  Địa chỉ
                  <input value={editingCustomer.address} onChange={(event) => setEditingCustomer({ ...editingCustomer, address: event.target.value })} />
                </label>
              </div>
              <div className="user-edit-actions">
                <button type="button" className="action-button secondary" onClick={closeEditingCustomer}>Hủy</button>
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
            <th>Địa chỉ</th>
            <th>Ngày tạo</th>
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
              <td>{customer.address || "-"}</td>
              <td>{formatCustomerCreatedDate(customer.created_at)}</td>
              <td>
                <div className="action-buttons">
                  <button className="table-icon-button" type="button" title="Sửa" aria-label="Sửa" onClick={() => handleStartEditCustomer(customer)}>
                    <PaymentActionIcon type="edit" />
                  </button>
                  <button className="table-icon-button danger" type="button" title="Xóa" aria-label="Xóa" disabled={!canDeleteData} onClick={() => handleDeleteCustomer(customer.customer_id)}>
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
