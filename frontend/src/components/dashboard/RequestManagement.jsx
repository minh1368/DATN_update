import { PaymentActionIcon } from "../AppIcons.jsx";
import { canonicalizeBrand, uniqueCanonicalBrands } from "../../lib/carUtils.js";

export default function RequestManagement({
  requests,
  requestStartFilter,
  setRequestStartFilter,
  requestEndFilter,
  setRequestEndFilter,
  requestStatusFilter,
  setRequestStatusFilter,
  requestBrandFilter,
  setRequestBrandFilter,
  requestSearch,
  setRequestSearch,
  requestsPage,
  setRequestsPage,
  isItemInDateRange,
  paginateRows,
  renderTablePagination,
  customerById,
  carById,
  formatRequestStatus,
  openRequestDetail,
  canDeleteData,
  handleDeleteRequest,
}) {
  const normalizedRequestSearch = String(requestSearch || "").trim().toLowerCase();
  const requestBrandOptions = uniqueCanonicalBrands(
    requests.map((request) => carById.get(Number(request.car_id))).filter(Boolean)
  );
  const requestStatusOptions = [
    { value: "waiting_confirmation", label: "Chờ duyệt" },
    { value: "approved", label: "Đã duyệt" },
    { value: "rejected", label: "Đã từ chối" },
  ];
  const getRequestDateRange = (request) => {
    const startDate = request?.start_date || "-";
    const endDate = request?.end_date || "-";
    return `${startDate} → ${endDate}`;
  };
  const getRequestTableStatus = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();
    return normalizedStatus === "completed" ? "approved" : status;
  };
  const filteredRequests = [...requests]
    .filter((request) => isItemInDateRange(request, requestStartFilter, requestEndFilter))
    .filter((request) => {
      if (!requestBrandFilter) return true;
      const car = carById.get(Number(request.car_id));
      return canonicalizeBrand(car?.brand) === requestBrandFilter;
    })
    .filter((request) => {
      if (!requestStatusFilter) return true;
      const normalizedStatus = String(request.status || "").toLowerCase();
      if (requestStatusFilter === "waiting_confirmation") {
        return ["deposit_pending", "pending"].includes(normalizedStatus);
      }
      return normalizedStatus === requestStatusFilter;
    })
    .filter((request) => {
      if (!normalizedRequestSearch) return true;
      const customer = customerById.get(Number(request.customer_id));
      const car = carById.get(Number(request.car_id));
      const searchable = [
        `YC${String(request.request_id || "").padStart(3, "0")}`,
        request.request_id,
        customer?.name,
        customer?.phone,
        customer?.email,
        car?.name,
        car?.brand,
        car?.license_plate,
        request.start_date,
        request.end_date,
        request.pickup_location,
        formatRequestStatus(request.status),
      ].join(" ").toLowerCase();
      return searchable.includes(normalizedRequestSearch);
    })
    .sort((a, b) => Number(b?.request_id || 0) - Number(a?.request_id || 0));
  const { pageRows: pagedRequests, safePage, totalPages } = paginateRows(filteredRequests, requestsPage);
  const clearFilters = () => {
    setRequestStartFilter("");
    setRequestEndFilter("");
    setRequestBrandFilter("");
    setRequestStatusFilter("");
    setRequestSearch("");
    setRequestsPage(1);
  };

  return (
    <div className="table-section">
      <div className="table-heading-row">
        <h3>Danh sách yêu cầu</h3>
      </div>
      <div className="contract-filter-grid">
        <label>
          Tìm kiếm
          <input
            type="search"
            value={requestSearch}
            onChange={(event) => {
              setRequestSearch(event.target.value);
              setRequestsPage(1);
            }}
            placeholder="Tìm yêu cầu..."
          />
        </label>
        <label>
          Từ ngày
          <input type="date" value={requestStartFilter} onChange={(event) => { setRequestStartFilter(event.target.value); setRequestsPage(1); }} />
        </label>
        <label>
          Đến ngày
          <input type="date" value={requestEndFilter} onChange={(event) => { setRequestEndFilter(event.target.value); setRequestsPage(1); }} />
        </label>
        <label>
          Hãng xe
          <select value={requestBrandFilter} onChange={(event) => { setRequestBrandFilter(event.target.value); setRequestsPage(1); }}>
            <option value="">Tất cả</option>
            {requestBrandOptions.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select value={requestStatusFilter} onChange={(event) => { setRequestStatusFilter(event.target.value); setRequestsPage(1); }}>
            <option value="">Tất cả</option>
            {requestStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </label>
        <button type="button" className="action-button secondary contract-filter-clear" onClick={clearFilters}>
          Xóa lọc
        </button>
      </div>
      <table className="requests-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã YC</th>
            <th>Khách hàng</th>
            <th>Xe</th>
            <th>Ngày thuê</th>
            <th>
              <select value={requestStatusFilter} onChange={(event) => { setRequestStatusFilter(event.target.value); setRequestsPage(1); }} className="header-filter-select">
                <option value="">Trạng thái</option>
                <option value="waiting_confirmation">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {pagedRequests.map((request, index) => {
            const customer = customerById.get(Number(request.customer_id));
            const car = carById.get(Number(request.car_id));
            const tableStatus = getRequestTableStatus(request.status);
            return (
              <tr key={request.request_id}>
                <td>{(safePage - 1) * 10 + index + 1}</td>
                <td>YC{String(request.request_id).padStart(3, "0")}</td>
                <td>{customer?.name || "-"}</td>
                <td>{car?.name || "-"}</td>
                <td>{getRequestDateRange(request)}</td>
                <td>
                  <span className={`request-status-pill status-${String(tableStatus || "").toLowerCase()}`}>
                    {formatRequestStatus(tableStatus)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="table-icon-button" type="button" title="Xem" aria-label="Xem" onClick={() => openRequestDetail(request)}>
                      <PaymentActionIcon type="view" />
                    </button>
                    <button className="table-icon-button danger" type="button" title="Xóa" aria-label="Xóa" disabled={!canDeleteData} onClick={() => handleDeleteRequest(request.request_id)}>
                      <PaymentActionIcon type="trash" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {pagedRequests.length === 0 ? (
            <tr>
              <td colSpan="7">Không có yêu cầu nào trong khoảng ngày đã chọn.</td>
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
