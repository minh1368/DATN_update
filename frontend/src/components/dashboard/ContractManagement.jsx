import { PaymentActionIcon } from "../AppIcons.jsx";
import { canonicalizeBrand, uniqueCanonicalBrands } from "../../lib/carUtils.js";

function formatContractStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "approved") return "Đang thuê";
  if (normalized === "completed") return "Hoàn thành";
  return status || "-";
}

export default function ContractManagement({
  contracts,
  contractSearch,
  setContractSearch,
  contractStartFilter,
  setContractStartFilter,
  contractEndFilter,
  setContractEndFilter,
  contractBrandFilter,
  setContractBrandFilter,
  contractStatusFilter,
  setContractStatusFilter,
  contractsPage,
  setContractsPage,
  customerById,
  carById,
  isItemInDateRange,
  sortNewestByDate,
  paginateRows,
  renderTablePagination,
  getContractPaymentSummary,
  formatMoneyValue,
  openPaymentDetail,
  onReturnCar,
}) {
  const visibleContracts = contracts.filter((contract) => (
    ["approved", "completed"].includes(String(contract.status || "").toLowerCase())
  ));
  const contractBrandOptions = uniqueCanonicalBrands(
    visibleContracts.map((contract) => carById.get(Number(contract.car_id))).filter(Boolean)
  );
  const contractStatusOptions = ["approved", "completed"];
  const normalizedContractSearch = contractSearch.trim().toLowerCase();
  const filteredContracts = sortNewestByDate(visibleContracts.filter((contract) => {
    const customer = customerById.get(Number(contract.customer_id));
    const car = carById.get(Number(contract.car_id));
    if (!isItemInDateRange(contract, contractStartFilter, contractEndFilter)) return false;
    if (contractBrandFilter && canonicalizeBrand(car?.brand) !== contractBrandFilter) return false;
    if (contractStatusFilter && contract.status !== contractStatusFilter) return false;
    if (normalizedContractSearch) {
      const contractCode = `HD${String(contract.contract_id || "").padStart(3, "0")}`;
      const searchable = [
        contractCode,
        contract.contract_id,
        String(contract.contract_id || "").padStart(3, "0"),
        customer?.name,
        customer?.phone,
        customer?.email,
        canonicalizeBrand(car?.brand),
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

  const clearFilters = () => {
    setContractStartFilter("");
    setContractEndFilter("");
    setContractBrandFilter("");
    setContractStatusFilter("");
    setContractSearch("");
    setContractsPage(1);
  };

  return (
    <div className="table-section">
      <div className="table-heading-row">
        <h3>Danh sách hợp đồng</h3>
      </div>
      <div className="contract-filter-grid">
        <label>
          Tìm kiếm
          <input
            type="search"
            value={contractSearch}
            onChange={(event) => {
              setContractSearch(event.target.value);
              setContractsPage(1);
            }}
            placeholder="Tìm hợp đồng..."
          />
        </label>
        <label>
          Từ ngày
          <input type="date" value={contractStartFilter} onChange={(event) => { setContractStartFilter(event.target.value); setContractsPage(1); }} />
        </label>
        <label>
          Đến ngày
          <input type="date" value={contractEndFilter} onChange={(event) => { setContractEndFilter(event.target.value); setContractsPage(1); }} />
        </label>
        <label>
          Hãng xe
          <select value={contractBrandFilter} onChange={(event) => { setContractBrandFilter(event.target.value); setContractsPage(1); }}>
            <option value="">Tất cả</option>
            {contractBrandOptions.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select value={contractStatusFilter} onChange={(event) => { setContractStatusFilter(event.target.value); setContractsPage(1); }}>
            <option value="">Tất cả</option>
            {contractStatusOptions.map((status) => (
              <option key={status} value={status}>{formatContractStatus(status)}</option>
            ))}
          </select>
        </label>
        <button type="button" className="action-button secondary contract-filter-clear" onClick={clearFilters}>
          Xóa lọc
        </button>
      </div>
      <table className="contracts-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã HĐ</th>
            <th>Khách hàng</th>
            <th>Xe</th>
            <th>Tổng tiền</th>
            <th>
              <select value={contractStatusFilter} onChange={(event) => { setContractStatusFilter(event.target.value); setContractsPage(1); }} className="header-filter-select">
                <option value="">Trạng thái</option>
                {contractStatusOptions.map((status) => (
                  <option key={status} value={status}>{formatContractStatus(status)}</option>
                ))}
              </select>
            </th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {pagedContracts.map((contract, index) => {
            const customer = customerById.get(Number(contract.customer_id));
            const car = carById.get(Number(contract.car_id));
            const paymentSummary = getContractPaymentSummary(contract);
            const hasRejectedPayment = paymentSummary.payments.some((payment) => (
              String(payment.status || "").toLowerCase() === "rejected"
            ));
            const canReturnCar = contract.status === "approved" && paymentSummary.remaining <= 0 && !hasRejectedPayment;
            return (
              <tr key={contract.contract_id}>
                <td>{(safePage - 1) * 10 + index + 1}</td>
                <td>HD{String(contract.contract_id).padStart(3, "0")}</td>
                <td>{customer?.name || "-"}</td>
                <td>{car?.name || "-"}</td>
                <td>{formatMoneyValue(paymentSummary.total)}</td>
                <td>
                  <span className={`request-status-pill status-${String(contract.status || "").toLowerCase()}`}>
                    {formatContractStatus(contract.status)}
                  </span>
                </td>
                <td>
                  <div className="table-icon-actions">
                    <button className="table-icon-button" type="button" onClick={() => openPaymentDetail({ contract }, false)} title="Xem thanh toán" aria-label="Xem thanh toán">
                      <PaymentActionIcon type="view" />
                    </button>
                    {contract.status === "approved" && canReturnCar ? (
                      <button className="table-icon-button" onClick={() => onReturnCar(contract.contract_id)} title="Trả xe" aria-label="Trả xe">
                        <PaymentActionIcon type="return" />
                      </button>
                    ) : contract.status === "approved" ? (
                      <button className="table-icon-button" title="Chưa thanh toán đủ, không thể trả xe" aria-label="Chưa thanh toán đủ, không thể trả xe" disabled>
                        <PaymentActionIcon type="return" />
                      </button>
                    ) : (
                      <button className="table-icon-button" title="Đã trả xe" aria-label="Đã trả xe" disabled>
                        <PaymentActionIcon type="return" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {pagedContracts.length === 0 ? (
            <tr>
              <td colSpan="7">Không có hợp đồng nào trong khoảng ngày đã chọn.</td>
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
