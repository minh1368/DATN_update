import { useEffect, useState } from "react";

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function useDashboardFilters({ isAdmin }) {
  const [activeTab, setActiveTab] = useState("summary");
  const [summaryRange, setSummaryRange] = useState("all");
  const [summaryStartDate, setSummaryStartDate] = useState("");
  const [summaryEndDate, setSummaryEndDate] = useState("");
  const [requestStartFilter, setRequestStartFilter] = useState("");
  const [requestEndFilter, setRequestEndFilter] = useState("");
  const [contractStartFilter, setContractStartFilter] = useState("");
  const [contractEndFilter, setContractEndFilter] = useState("");
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
  const [requestStatusFilter, setRequestStatusFilter] = useState("");
  const [requestBrandFilter, setRequestBrandFilter] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [contractsPage, setContractsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [contractSearch, setContractSearch] = useState("");
  const [contractBrandFilter, setContractBrandFilter] = useState("");
  const [contractStatusFilter, setContractStatusFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  useEffect(() => {
    if (!isAdmin && activeTab === "users") {
      setActiveTab("summary");
    }
  }, [activeTab, isAdmin]);

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

    if (filterEnd) filterEnd.setHours(23, 59, 59, 999);
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

  const getPaginationItems = (currentPage, totalPages) => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, "ellipsis", totalPages];
    if (currentPage >= totalPages - 2) return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
  };

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

  const formatCarStatusLabel = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "available") return "Sẵn sàng";
    if (normalized === "rented") return "Đang thuê";
    if (normalized === "maintenance") return "Bảo dưỡng";
    if (normalized === "inactive") return "Ngừng h/đ";
    return status;
  };

  return {
    activeTab,
    setActiveTab,
    summaryRange,
    setSummaryRange,
    summaryStartDate,
    setSummaryStartDate,
    summaryEndDate,
    setSummaryEndDate,
    requestStartFilter,
    setRequestStartFilter,
    requestEndFilter,
    setRequestEndFilter,
    contractStartFilter,
    setContractStartFilter,
    contractEndFilter,
    setContractEndFilter,
    carSearch,
    setCarSearch,
    carFilters,
    setCarFilters,
    carsPage,
    setCarsPage,
    customersPage,
    setCustomersPage,
    requestsPage,
    setRequestsPage,
    requestStatusFilter,
    setRequestStatusFilter,
    requestBrandFilter,
    setRequestBrandFilter,
    requestSearch,
    setRequestSearch,
    contractsPage,
    setContractsPage,
    paymentsPage,
    setPaymentsPage,
    usersPage,
    setUsersPage,
    contractSearch,
    setContractSearch,
    contractBrandFilter,
    setContractBrandFilter,
    contractStatusFilter,
    setContractStatusFilter,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    customerSearch,
    setCustomerSearch,
    handleSummaryRangeChange,
    isDateInSummaryRange,
    isItemInDateRange,
    renderDateFilter,
    paginateRows,
    getRowTime,
    sortNewestByDate,
    renderTablePagination,
    getPaginationItems,
    formatCarStatusLabel,
  };
}
