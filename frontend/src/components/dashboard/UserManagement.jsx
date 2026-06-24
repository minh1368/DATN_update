import { PaymentActionIcon } from "../AppIcons.jsx";

export default function UserManagement({
  isAdmin,
  users,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  usersPage,
  setUsersPage,
  paginateRows,
  renderTablePagination,
  showCreateUserForm,
  setShowCreateUserForm,
  newUser,
  setNewUser,
  handleCreateUser,
  editingUser,
  setEditingUser,
  handleUpdateUser,
  handleStartEditUser,
  handleDeleteUser,
}) {
  const canManagePersonnel = isAdmin;
  const userRoleOptions = [...new Set(users.map((user) => user.role).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "vi"));
  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const formatUserCreatedDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const filteredUsers = users.filter((user) => {
    if (userRoleFilter && user.role !== userRoleFilter) return false;
    if (!normalizedUserSearch) return true;
    return [user.name, user.email || user.username, user.role, formatUserCreatedDate(user.created_at)]
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
                  <input value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} required />
                </label>
                <label>
                  Email *
                  <input type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} required />
                </label>
                <label>
                  Password *
                  <input type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} required />
                </label>
                <label>
                  Role *
                  <select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}>
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
                  <input value={editingUser.name} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} required />
                </label>
                <label>
                  Email
                  <input type="email" value={editingUser.email} onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })} required />
                </label>
                <label>
                  Password
                  <input value={editingUser.password} onChange={(event) => setEditingUser({ ...editingUser, password: event.target.value })} required />
                </label>
                <label>
                  Role
                  <select value={editingUser.role} onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value })}>
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

      <div className="users-table-scroll">
        <table className="users-table">
          <colgroup>
            <col className="users-col-index" />
            <col className="users-col-name" />
            <col className="users-col-email" />
            <col className="users-col-role" />
            <col className="users-col-created" />
            <col className="users-col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Role</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagedUsers.map((user, index) => (
              <tr key={user.user_id}>
                <td>{(safePage - 1) * 10 + index + 1}</td>
                <td>{user.name || "-"}</td>
                <td>{user.email || user.username}</td>
                <td>{user.role}</td>
                <td>{formatUserCreatedDate(user.created_at)}</td>
                <td>
                  {canManagePersonnel ? (
                    <div className="action-buttons">
                      <button className="table-icon-button" type="button" title="Sửa" aria-label="Sửa" onClick={() => handleStartEditUser(user)}>
                        <PaymentActionIcon type="edit" />
                      </button>
                      <button className="table-icon-button danger" type="button" title="Xóa" aria-label="Xóa" onClick={() => handleDeleteUser(user.user_id)}>
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
      </div>

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
