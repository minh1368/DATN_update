import { DashboardNavIcon } from "./AppIcons.jsx";

const BASE_DASHBOARD_TABS = [
  { key: "summary", label: "Tổng quan", icon: "summary" },
  { key: "cars", label: "Xe", icon: "cars" },
  { key: "customers", label: "Khách hàng", icon: "customers" },
  { key: "requests", label: "Yêu cầu", icon: "requests" },
  { key: "contracts", label: "Hợp đồng", icon: "contracts" },
  { key: "payments", label: "Thanh toán", icon: "payments" },
];

const ADMIN_ONLY_TABS = [{ key: "users", label: "Nhân sự", icon: "users" }];

export default function DashboardSidebar({ activeTab, isAdmin, onTabChange }) {
  const tabs = isAdmin ? [...BASE_DASHBOARD_TABS, ...ADMIN_ONLY_TABS] : BASE_DASHBOARD_TABS;

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-tabs dashboard-tabs-vertical">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`dashboard-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => onTabChange(tab.key)}
            type="button"
          >
            <DashboardNavIcon type={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
