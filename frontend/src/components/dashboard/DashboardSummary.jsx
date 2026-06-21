import { canonicalizeBrand } from "../../lib/carUtils.js";

export default function DashboardSummary({
  contracts,
  payments,
  requests,
  stats,
  summaryRange,
  setSummaryRange,
  summaryStartDate,
  setSummaryStartDate,
  summaryEndDate,
  setSummaryEndDate,
  handleSummaryRangeChange,
  handleExport,
  isDateInSummaryRange,
  getPaymentDate,
  requestById,
  carById,
}) {
  const contractById = new Map(contracts.map((contract) => [Number(contract.contract_id), contract]));
  const filteredPaidPayments = payments.filter((payment) => (
    payment.status === "paid" && isDateInSummaryRange(getPaymentDate(payment))
  ));
  const filteredRevenue = filteredPaidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const filteredContractCount = new Set(
    filteredPaidPayments.map((payment) => payment.contract_id).filter(Boolean)
  ).size;
  const monthlyRevenueMap = filteredPaidPayments.reduce((monthly, payment) => {
    const paymentDate = getPaymentDate(payment);
    const month = paymentDate ? String(paymentDate).slice(0, 7) : "Không rõ";
    monthly.set(month, (monthly.get(month) || 0) + Number(payment.amount || 0));
    return monthly;
  }, new Map());
  const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, revenue]) => ({ month, revenue }));
  const chartRows = monthlyRevenue.length
    ? monthlyRevenue
    : (stats?.monthly_revenue || []).map((item) => ({ month: item.month, revenue: Number(item.revenue || 0) }));
  const isFilteredSummary = Boolean(summaryStartDate || summaryEndDate);
  const totalRevenue = isFilteredSummary ? filteredRevenue : (stats?.total_revenue || 0);
  const totalContracts = isFilteredSummary ? filteredContractCount : (stats?.total_contracts || 0);
  const filteredPaymentsInRange = payments.filter((payment) => isDateInSummaryRange(getPaymentDate(payment)));
  const columnChartRows = Array.from({ length: 12 }, (_, index) => ({
    month: `T${index + 1}`,
    revenue: 0,
  }));
  chartRows.forEach((item) => {
    const monthPart = String(item.month || "").split("-").pop();
    const monthIndex = Number(monthPart) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      columnChartRows[monthIndex].revenue += Number(item.revenue || 0);
    }
  });
  const columnMaxRevenue = Math.max(...columnChartRows.map((item) => Number(item.revenue || 0)), 0);
  const columnUnitDivisor = columnMaxRevenue >= 1_000_000_000 ? 1_000_000_000 : 1_000_000;
  const columnUnitLabel = columnMaxRevenue >= 1_000_000_000 ? "Tỷ" : "Triệu";
  const columnMaxValue = Math.max(...columnChartRows.map((item) => Number(item.revenue || 0) / columnUnitDivisor), 1);
  const getNiceChartStep = (maxValue) => {
    const rawStep = Math.max(maxValue / 3, 1);
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const normalized = rawStep / magnitude;
    if (normalized <= 1) return magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
  };
  const columnStep = getNiceChartStep(columnMaxValue);
  const columnYAxisMax = Math.ceil(columnMaxValue / columnStep) * columnStep;
  const columnYAxisTicks = Array.from(
    { length: Math.floor(columnYAxisMax / columnStep) + 1 },
    (_, index) => columnYAxisMax - index * columnStep
  );
  const rangeContracts = contracts.filter((contract) => isDateInSummaryRange(contract.start_date || contract.created_at));
  const rangeRequests = requests.filter((request) => isDateInSummaryRange(request.start_date || request.created_at));
  const contractStatusItems = [
    {
      label: "Hoàn thành",
      value: rangeContracts.filter((contract) => String(contract.status || "").toLowerCase() === "completed").length,
      color: "#00d084",
    },
    {
      label: "Đang thuê",
      value: rangeContracts.filter((contract) => ["approved", "active", "pending"].includes(String(contract.status || "").toLowerCase())).length,
      color: "#31b7ff",
    },
    {
      label: "Chờ duyệt",
      value: rangeRequests.filter((request) => ["pending", "deposit_pending"].includes(String(request.status || "").toLowerCase())).length,
      color: "#ffcc4d",
    },
    {
      label: "Đã hủy",
      value: [
        ...rangeContracts.filter((contract) => ["rejected", "cancelled"].includes(String(contract.status || "").toLowerCase())),
        ...rangeRequests.filter((request) => ["rejected", "cancelled"].includes(String(request.status || "").toLowerCase())),
      ].length,
      color: "#ff6b6b",
    },
  ];
  const paymentStatusItems = [
    {
      label: "Đã thanh toán",
      value: filteredPaymentsInRange
        .filter((payment) => String(payment.status || "").toLowerCase() === "paid")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      color: "#00d084",
    },
    {
      label: "Chờ thanh toán",
      value: filteredPaymentsInRange
        .filter((payment) => ["pending", "unpaid", "refund_pending"].includes(String(payment.status || "").toLowerCase()))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      color: "#ffcc4d",
    },
    {
      label: "Đã hoàn tiền",
      value: filteredPaymentsInRange
        .filter((payment) => String(payment.status || "").toLowerCase() === "refunded")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      color: "#31b7ff",
    },
  ];
  const brandRevenueMap = filteredPaidPayments.reduce((brandMap, payment) => {
    const contract = contractById.get(Number(payment.contract_id));
    const request = requestById.get(Number(payment.request_id || contract?.request_id));
    const car = carById.get(Number(contract?.car_id || request?.car_id));
    const brand = canonicalizeBrand(car?.brand) || "Khác";
    brandMap.set(brand, (brandMap.get(brand) || 0) + Number(payment.amount || 0));
    return brandMap;
  }, new Map());
  const brandRevenueItems = Array.from(brandRevenueMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);
  const topCarMap = rangeContracts.reduce((carMap, contract) => {
    const car = carById.get(Number(contract.car_id));
    const carName = car?.name || `Xe #${contract.car_id || "-"}`;
    carMap.set(carName, (carMap.get(carName) || 0) + 1);
    return carMap;
  }, new Map());
  const topCarItems = Array.from(topCarMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
  const makeDonutGradient = (items) => {
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
    if (!total) return "conic-gradient(rgba(255,255,255,0.16) 0 100%)";
    let cursor = 0;
    const stops = items.map((item) => {
      const start = cursor;
      cursor += (Number(item.value || 0) / total) * 100;
      return `${item.color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  };
  const formatCompactMoney = (value) => {
    const amount = Number(value || 0);
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} triệu`;
    return `${amount.toLocaleString("vi-VN")} VND`;
  };
  const getBarMax = (items) => Math.max(...items.map((item) => Number(item.value || 0)), 1);
  
  return (
    <div className="table-section">
      <div className="summary-heading-row">
        <h3>Tổng quan hệ thống</h3>
        <div className="summary-export-actions">
          <button className="action-button" type="button" onClick={() => handleExport("excel")}>
            Xuất Excel
          </button>
          <button className="action-button" type="button" onClick={() => handleExport("csv")}>
            Xuất CSV
          </button>
        </div>
      </div>
      {stats ? (
        <>
          <div className="summary-toolbar">
            <label>
              Mốc thời gian
              <select value={summaryRange} onChange={(event) => handleSummaryRangeChange(event.target.value)}>
                <option value="all">Toàn bộ</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
                <option value="year">Năm nay</option>
                <option value="custom">Tùy chọn</option>
              </select>
            </label>
            <label>
              Từ ngày
              <input
                type="date"
                value={summaryStartDate}
                onChange={(event) => {
                  setSummaryRange("custom");
                  setSummaryStartDate(event.target.value);
                }}
              />
            </label>
            <label>
              Đến ngày
              <input
                type="date"
                value={summaryEndDate}
                onChange={(event) => {
                  setSummaryRange("custom");
                  setSummaryEndDate(event.target.value);
                }}
              />
            </label>
            <button
              type="button"
              className="action-button secondary summary-clear-filter"
              onClick={() => {
                setSummaryRange("all");
                setSummaryStartDate("");
                setSummaryEndDate("");
              }}
            >
              Xóa lọc
            </button>
          </div>
          <div className="dashboard-grid summary-stats-grid">
            <div className="dashboard-card">
              <h3>Tổng doanh thu</h3>
              <p>{Number(totalRevenue).toLocaleString()} VND</p>
            </div>
            <div className="dashboard-card">
              <h3>Tổng hợp đồng</h3>
              <p>{totalContracts}</p>
            </div>
            <div className="dashboard-card">
              <h3>Tổng số xe</h3>
              <p>{stats.total_cars}</p>
            </div>
            <div className="dashboard-card">
              <h3>Xe đang thuê</h3>
              <p>{stats.cars_rented}</p>
            </div>
            <div className="dashboard-card">
              <h3>Tỷ lệ sử dụng</h3>
              <p>{(stats.usage_rate * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="summary-visual-grid">
            <div className="summary-chart-card summary-column-card revenue-column-card">
              <div className="summary-chart-header">
                <h3>Doanh thu theo tháng</h3>
                <span aria-hidden="true">▣</span>
              </div>
              {columnMaxRevenue > 0 ? (
                <div className="revenue-bar-chart">
                  <div className="revenue-y-axis">
                    {columnYAxisTicks.map((tick) => (
                      <span key={tick}>{Number.isInteger(tick) ? tick : tick.toFixed(1)}</span>
                    ))}
                  </div>
                  <div className="revenue-y-label">{columnUnitLabel}</div>
                  <div className="revenue-plot">
                    <div className="revenue-grid-lines" aria-hidden="true">
                      {columnYAxisTicks.map((tick) => (
                        <span key={tick} />
                      ))}
                    </div>
                    <div className="revenue-bars">
                      {columnChartRows.map((item) => {
                        const value = Number(item.revenue || 0) / columnUnitDivisor;
                        const height = value > 0 ? Math.max((value / columnYAxisMax) * 100, 2) : 0;
                        return (
                          <div className="revenue-bar-item" key={item.month}>
                            <div className="revenue-bar-track">
                              <div
                                className="revenue-bar"
                                style={{ height: `${height}%` }}
                                title={`${item.month}: ${Number(item.revenue || 0).toLocaleString("vi-VN")} VND`}
                                data-tooltip={`${item.month}: ${Number(item.revenue || 0).toLocaleString("vi-VN")} VND`}
                              />
                            </div>
                            <span>{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="revenue-chart-legend">
                    <span />
                    Giá trị thực tế
                  </div>
                </div>
              ) : (
                <p className="summary-chart-empty">Chưa có doanh thu để hiển thị biểu đồ cột.</p>
              )}
            </div>
  
            <div className="summary-chart-card summary-pie-card">
              <div className="summary-chart-header">
                <h3>Trạng thái hợp đồng</h3>
                <span>{contractStatusItems.reduce((sum, item) => sum + item.value, 0)} mục</span>
              </div>
              <div className="summary-pie-content">
                <div
                  className="summary-pie"
                  style={{
                    "--donut-gradient": makeDonutGradient(contractStatusItems),
                    "--donut-target": "100%",
                  }}
                  aria-label="Trạng thái hợp đồng"
                >
                  <div>
                    <strong>{contractStatusItems.reduce((sum, item) => sum + item.value, 0)}</strong>
                    <span>Tổng mục</span>
                  </div>
                </div>
                <div className="summary-pie-legend">
                  {contractStatusItems.map((item) => (
                    <div key={item.label}>
                      <span className="summary-legend-dot" style={{ background: item.color }} />
                      {item.label}
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="summary-finance-grid">
            <div className="summary-chart-card">
              <div className="summary-chart-header">
                <h3>Doanh thu theo hãng xe</h3>
                <span>{isFilteredSummary ? "Theo mốc đã chọn" : "Toàn bộ dữ liệu"}</span>
              </div>
              <div className="summary-horizontal-bars">
                {brandRevenueItems.length ? (
                  brandRevenueItems.map((item) => (
                    <div className="summary-horizontal-row" key={item.label}>
                      <span>{item.label}</span>
                      <div className="summary-horizontal-track">
                        <div style={{ width: `${Math.max((Number(item.value || 0) / getBarMax(brandRevenueItems)) * 100, 4)}%` }} />
                      </div>
                      <strong>{formatCompactMoney(item.value)}</strong>
                    </div>
                  ))
                ) : (
                  <p className="summary-chart-empty">Chưa có doanh thu theo hãng xe.</p>
                )}
              </div>
            </div>
  
            <div className="summary-chart-card summary-pie-card">
              <div className="summary-chart-header">
                <h3>Tình trạng thanh toán</h3>
                <span>Công nợ</span>
              </div>
              <div className="summary-pie-content summary-pie-content-compact">
                <div
                  className="summary-pie"
                  style={{
                    "--donut-gradient": makeDonutGradient(paymentStatusItems),
                    "--donut-target": "100%",
                  }}
                  aria-label="Tình trạng thanh toán"
                >
                  <div>
                    <strong>{formatCompactMoney(paymentStatusItems.reduce((sum, item) => sum + item.value, 0))}</strong>
                    <span>Tổng tiền</span>
                  </div>
                </div>
                <div className="summary-pie-legend">
                  {paymentStatusItems.map((item) => (
                    <div key={item.label}>
                      <span className="summary-legend-dot" style={{ background: item.color }} />
                      {item.label}
                      <strong>{formatCompactMoney(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="summary-chart-card summary-top-card">
            <div className="summary-chart-header">
              <h3>Top 5 xe được thuê nhiều nhất</h3>
              <span>{isFilteredSummary ? "Theo mốc đã chọn" : "Toàn bộ dữ liệu"}</span>
            </div>
            <div className="summary-horizontal-bars summary-top-bars">
              {topCarItems.length ? (
                topCarItems.map((item, index) => (
                  <div className="summary-horizontal-row" key={item.label}>
                    <span>{index + 1}. {item.label}</span>
                    <div className="summary-horizontal-track">
                      <div style={{ width: `${Math.max((Number(item.value || 0) / getBarMax(topCarItems)) * 100, 6)}%` }} />
                    </div>
                    <strong>{item.value} lượt</strong>
                  </div>
                ))
              ) : (
                <p className="summary-chart-empty">Chưa có dữ liệu thuê xe để xếp hạng.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p>Đang tải dữ liệu tổng quan...</p>
      )}
    </div>
  );
}
