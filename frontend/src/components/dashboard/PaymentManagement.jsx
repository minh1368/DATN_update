import { Fragment } from "react";
import { PaymentActionIcon } from "../AppIcons.jsx";
import { canonicalizeBrand, uniqueCanonicalBrands } from "../../lib/carUtils.js";
import { sortPaymentGroups } from "../../lib/paymentUtils.js";
import PaymentRowActions from "./PaymentRowActions.jsx";

const formatPaymentCode = (paymentId) => `TT${String(paymentId || "").padStart(3, "0")}`;
const formatPaymentGroupCode = (group) => (
  group.contract?.contract_id
    ? `HD${String(group.contract.contract_id).padStart(3, "0")}`
    : `YC${String(group.request?.request_id || "-").padStart(3, "0")}`
);

export default function PaymentManagement({
  payments,
  paymentSearch,
  setPaymentSearch,
  paymentStartFilter,
  setPaymentStartFilter,
  paymentEndFilter,
  setPaymentEndFilter,
  paymentBrandFilter,
  setPaymentBrandFilter,
  paymentStatusFilter,
  setPaymentStatusFilter,
  paymentSortOrder,
  setPaymentSortOrder,
  paymentsPage,
  setPaymentsPage,
  expandedPaymentGroupKey,
  setExpandedPaymentGroupKey,
  creatingContractIds,
  canDeleteData,
  getPaymentContext,
  getPaymentGroupKey,
  getPaymentGroupSummary,
  isItemInDateRange,
  paginateRows,
  renderTablePagination,
  formatPaymentType,
  formatPaymentStatus,
  getPaymentStatusClass,
  formatMoneyValue,
  handleDeletePaymentGroup,
  handleCreateContract,
  handlePaymentAction,
  handlePaymentRejectNotify,
  notReceivedPayment,
  setNotReceivedPayment,
}) {
  const paymentGroupsMap = new Map();
  payments.forEach((payment) => {
    const context = getPaymentContext(payment);
    const key = getPaymentGroupKey({ ...context, payment });
    const existing = paymentGroupsMap.get(key) || {
      key,
      contract: context.contract,
      request: context.request,
      customer: context.customer,
      car: context.car,
      payments: [],
    };
    existing.contract = existing.contract || context.contract;
    existing.request = existing.request || context.request;
    existing.customer = existing.customer || context.customer;
    existing.car = existing.car || context.car;
    existing.payments.push(payment);
    paymentGroupsMap.set(key, existing);
  });

  const paymentGroups = [...paymentGroupsMap.values()].map((group) => {
    const sortedGroupPayments = [...group.payments].sort((a, b) => {
      const typeOrder = { deposit: 1, remaining: 2, rental: 2, refund: 3 };
      const left = typeOrder[String(a.payment_type || "").toLowerCase()] || 9;
      const right = typeOrder[String(b.payment_type || "").toLowerCase()] || 9;
      if (left !== right) return left - right;
      return Number(a.payment_id || 0) - Number(b.payment_id || 0);
    });
    const requestStatus = String(group.request?.status || "").toLowerCase();
    const normalizedGroupPayments = sortedGroupPayments.map((payment) => {
      const paymentType = String(payment.payment_type || "").toLowerCase();
      const paymentStatus = String(payment.status || "").toLowerCase();
      if (
        paymentType === "deposit" &&
        ["approved", "completed"].includes(requestStatus) &&
        ["pending", "unpaid"].includes(paymentStatus)
      ) {
        return { ...payment, status: "paid", paid_at: payment.paid_at || new Date().toISOString() };
      }
      return payment;
    });
    const summary = getPaymentGroupSummary({ ...group, payments: normalizedGroupPayments });
    return { ...group, payments: normalizedGroupPayments, summary };
  }).filter((group) => {
    const requestStatus = String(group.request?.status || "").toLowerCase();
    const hasPaidPayment = group.payments.some((payment) => String(payment.status || "").toLowerCase() === "paid");
    const hasOnlyPendingDeposit = group.payments.every((payment) => (
      String(payment.payment_type || "").toLowerCase() === "deposit" &&
      ["pending", "unpaid"].includes(String(payment.status || "").toLowerCase())
    ));
    return !(["deposit_pending", "pending"].includes(requestStatus) && hasOnlyPendingDeposit && !hasPaidPayment);
  });

  const paymentBrandOptions = uniqueCanonicalBrands(
    paymentGroups.map((group) => group.car).filter(Boolean)
  );
  const paymentStatusOptions = ["pending", "paid", "rejected"];
  const normalizedPaymentSearch = paymentSearch.trim().toLowerCase();
  const filteredPaymentGroups = paymentGroups.filter((group) => {
    const dateSource = group.contract || group.request || group.payments.find((payment) => payment.paid_at);
    const dateRangeItem = group.contract || group.request || {
      start_date: dateSource?.paid_at,
      end_date: dateSource?.paid_at,
    };
    if (!isItemInDateRange(dateRangeItem, paymentStartFilter, paymentEndFilter)) return false;
    if (paymentBrandFilter && canonicalizeBrand(group.car?.brand) !== paymentBrandFilter) return false;
    if (paymentStatusFilter) {
      if (paymentStatusFilter === "pending") {
        if (!["pending", "unpaid"].includes(group.summary.status)) return false;
      } else if (group.summary.status !== paymentStatusFilter) return false;
    }
    if (!normalizedPaymentSearch) return true;
    const paymentCodes = group.payments.map((payment) => formatPaymentCode(payment.payment_id));
    const groupCode = formatPaymentGroupCode(group);
    const searchable = [
      groupCode,
      group.contract?.contract_id,
      group.contract?.contract_id ? String(group.contract.contract_id).padStart(3, "0") : null,
      group.request?.request_id,
      group.request?.request_id ? String(group.request.request_id).padStart(3, "0") : null,
      group.customer?.name,
      group.customer?.email,
      group.car?.name,
      group.summary.total,
      group.summary.paid,
      group.summary.remaining,
      group.summary.statusLabel,
      ...paymentCodes,
      ...group.payments.flatMap((payment) => [
        payment.payment_id,
        payment.payment_type,
        formatPaymentType(payment.payment_type),
        payment.status,
        formatPaymentStatus(payment.status),
      ]),
    ].join(" ").toLowerCase();
    return searchable.includes(normalizedPaymentSearch);
  });
  const sortedPaymentGroups = sortPaymentGroups(filteredPaymentGroups, paymentSortOrder);
  const { pageRows: pagedPaymentGroups, safePage, totalPages } = paginateRows(sortedPaymentGroups, paymentsPage);
  const clearFilters = () => {
    setPaymentSearch("");
    setPaymentStartFilter("");
    setPaymentEndFilter("");
    setPaymentBrandFilter("");
    setPaymentStatusFilter("");
    setPaymentSortOrder("newest");
    setPaymentsPage(1);
  };

  return (
    <div className="table-section">
      <div className="table-heading-row">
        <h3>Danh sách thanh toán</h3>
      </div>
      <div className="contract-filter-grid">
        <label>
          Tìm kiếm
          <input
            type="search"
            value={paymentSearch}
            onChange={(event) => {
              setPaymentSearch(event.target.value);
              setPaymentsPage(1);
            }}
            placeholder="Tìm thanh toán..."
          />
        </label>
        <label>
          Từ ngày
          <input type="date" value={paymentStartFilter} onChange={(event) => { setPaymentStartFilter(event.target.value); setPaymentsPage(1); }} />
        </label>
        <label>
          Đến ngày
          <input type="date" value={paymentEndFilter} onChange={(event) => { setPaymentEndFilter(event.target.value); setPaymentsPage(1); }} />
        </label>
        <label>
          Hãng xe
          <select value={paymentBrandFilter} onChange={(event) => { setPaymentBrandFilter(event.target.value); setPaymentsPage(1); }}>
            <option value="">Tất cả</option>
            {paymentBrandOptions.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select value={paymentStatusFilter} onChange={(event) => { setPaymentStatusFilter(event.target.value); setPaymentsPage(1); }}>
            <option value="">Tất cả</option>
            {paymentStatusOptions.map((status) => (
              <option key={status} value={status}>{formatPaymentStatus(status)}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="action-button secondary contract-filter-clear"
          onClick={clearFilters}
        >
          Xóa lọc
        </button>
      </div>
      <table className="payments-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã</th>
            <th>Khách hàng</th>
            <th>Xe</th>
            <th>Tổng tiền</th>
            <th>Đã trả</th>
            <th>Còn lại</th>
            <th>
              <select value={paymentStatusFilter} onChange={(event) => { setPaymentStatusFilter(event.target.value); setPaymentsPage(1); }} className="header-filter-select">
                <option value="">Trạng thái</option>
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>{formatPaymentStatus(status)}</option>
                ))}
              </select>
            </th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {pagedPaymentGroups.map((group, index) => {
            const isExpanded = expandedPaymentGroupKey === group.key;
            const hasContract = Boolean(group.contract?.contract_id);
            const hasRequest = Boolean(group.request?.request_id);
            const isCreating = creatingContractIds.includes(group.request?.request_id);
            const canCreateContract = hasRequest && !hasContract &&
              String(group.request?.status || "").toLowerCase() === "approved" &&
              group.summary.total > 0 && group.summary.remaining <= 0;
            return (
              <Fragment key={group.key}>
                <tr>
                  <td>{(safePage - 1) * 10 + index + 1}</td>
                  <td>{formatPaymentGroupCode(group)}</td>
                  <td>{group.customer?.name || "-"}</td>
                  <td>{group.car?.name || "-"}</td>
                  <td>{formatMoneyValue(group.summary.total)} VND</td>
                  <td>{formatMoneyValue(group.summary.paid)} VND</td>
                  <td>{formatMoneyValue(group.summary.remaining)} VND</td>
                  <td>
                    <span className={`payment-status-pill ${getPaymentStatusClass(group.summary.status)}`}>
                      {group.summary.statusLabel}
                    </span>
                  </td>
                  <td>
                    <div className="table-icon-actions">
                      <button className="table-icon-button" type="button" title={isExpanded ? "Thu gọn" : "Mở rộng"} aria-label={isExpanded ? "Thu gọn" : "Mở rộng"} onClick={() => { setExpandedPaymentGroupKey(isExpanded ? "" : group.key); if (isExpanded) setNotReceivedPayment(null); }}>
                        <PaymentActionIcon type="view" />
                      </button>
                      <button className="table-icon-button danger" type="button" title="Xóa" aria-label="Xóa" disabled={!canDeleteData} onClick={() => handleDeletePaymentGroup(group)}>
                        <PaymentActionIcon type="trash" />
                      </button>
                      {canCreateContract ? (
                        <button className="table-icon-button" type="button" title={isCreating ? "Đang tạo hợp đồng" : "Tạo hợp đồng"} aria-label={isCreating ? "Đang tạo hợp đồng" : "Tạo hợp đồng"} disabled={isCreating} onClick={() => handleCreateContract(group.request.request_id)}>
                          <PaymentActionIcon type="contract" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="payment-expanded-row">
                    <td colSpan="9">
                      <div className="payment-expanded-panel">
                        <div className="payment-expanded-header" aria-hidden="true">
                          <span>Mã thanh toán</span>
                          <span>Loại</span>
                          <span>Số tiền</span>
                          <span>Trạng thái</span>
                          <span>Thao tác</span>
                        </div>
                        {group.payments.map((payment) => (
                            <div className="payment-expanded-item" key={payment.payment_id}>
                              <div className="payment-expanded-code">
                                {formatPaymentCode(payment.payment_id)}
                              </div>
                              <div className="payment-expanded-type">
                                <strong>{formatPaymentType(payment.payment_type)}</strong>
                              </div>
                              <div className="payment-expanded-amount">{formatMoneyValue(payment.amount)} VND</div>
                              <span className={`payment-status-pill ${getPaymentStatusClass(payment.status)}`}>
                                {formatPaymentStatus(payment.status)}
                              </span>
                              <div className="table-icon-actions">
                                <PaymentRowActions
                                  payment={payment}
                                  groupPayments={group.payments}
                                  notReceivedPayment={notReceivedPayment}
                                  setNotReceivedPayment={setNotReceivedPayment}
                                  onConfirm={(paymentId) => handlePaymentAction(paymentId, "confirm")}
                                  onRejectNotify={handlePaymentRejectNotify}
                                  onRefund={(paymentId) => handlePaymentAction(paymentId, "refund")}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
          {pagedPaymentGroups.length === 0 ? (
            <tr>
              <td colSpan="9">Không có thanh toán nào.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {renderTablePagination({
        total: sortedPaymentGroups.length,
        pageRowsLength: pagedPaymentGroups.length,
        safePage,
        totalPages,
        setPage: setPaymentsPage,
        itemLabel: "thanh toán",
      })}
    </div>
  );
}
