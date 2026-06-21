import DashboardSidebar from "../DashboardSidebar.jsx";
import { fallbackCars } from "../../lib/carData.js";
import {
  formatMoneyValue,
  formatPaymentMethod,
  formatPaymentStatus,
  formatPaymentType,
  getPaymentGroupKey,
  getPaymentGroupSummary,
  getPaymentStatusClass,
} from "../../lib/paymentUtils.js";
import {
  formatContractStatusLabel,
  formatDepositStatus,
  formatRequestStatus,
} from "../../lib/requestUtils.js";
import CarManagement from "./CarManagement.jsx";
import ContractManagement from "./ContractManagement.jsx";
import CustomerManagement from "./CustomerManagement.jsx";
import DashboardSummary from "./DashboardSummary.jsx";
import PaymentDetailModal from "./PaymentDetailModal.jsx";
import PaymentManagement from "./PaymentManagement.jsx";
import PaymentNotReceivedModal from "./PaymentNotReceivedModal.jsx";
import RequestDetailModal from "./RequestDetailModal.jsx";
import RequestManagement from "./RequestManagement.jsx";
import UserManagement from "./UserManagement.jsx";

export default function DashboardWorkspace({
  activeTab,
  setActiveTab,
  isAdmin,
  data,
  filters,
  crud,
  actions,
  helpers,
  payment,
  requestDetail,
}) {
  const renderTabContent = () => {
    if (activeTab === "summary") {
      return (
        <DashboardSummary
          contracts={data.contracts}
          payments={data.payments}
          requests={data.requests}
          stats={data.stats}
          summaryRange={filters.summaryRange}
          setSummaryRange={filters.setSummaryRange}
          summaryStartDate={filters.summaryStartDate}
          setSummaryStartDate={filters.setSummaryStartDate}
          summaryEndDate={filters.summaryEndDate}
          setSummaryEndDate={filters.setSummaryEndDate}
          handleSummaryRangeChange={helpers.handleSummaryRangeChange}
          handleExport={actions.handleExport}
          isDateInSummaryRange={helpers.isDateInSummaryRange}
          getPaymentDate={payment.getPaymentDate}
          requestById={data.requestById}
          carById={data.carById}
        />
      );
    }

    if (activeTab === "cars") {
      return (
        <CarManagement
          cars={data.cars}
          fallbackCars={fallbackCars}
          carSearch={filters.carSearch}
          setCarSearch={filters.setCarSearch}
          carFilters={filters.carFilters}
          setCarFilters={filters.setCarFilters}
          carsPage={filters.carsPage}
          setCarsPage={filters.setCarsPage}
          showCreateCarForm={crud.showCreateCarForm}
          setShowCreateCarForm={crud.setShowCreateCarForm}
          newCar={crud.newCar}
          setNewCar={crud.setNewCar}
          handleCreateCar={crud.handleCreateCar}
          handleCarImageChange={crud.handleCarImageChange}
          editingCar={crud.editingCar}
          setEditingCar={crud.setEditingCar}
          handleUpdateCar={crud.handleUpdateCar}
          handleStartEditCar={crud.handleStartEditCar}
          canDeleteData={actions.canDeleteData}
          handleDeleteCar={actions.handleDeleteCar}
          formatCarStatusLabel={helpers.formatCarStatusLabel}
          getPaginationItems={helpers.getPaginationItems}
        />
      );
    }

    if (activeTab === "customers") {
      return (
        <CustomerManagement
          customers={data.dashboardCustomers}
          customerSearch={filters.customerSearch}
          setCustomerSearch={filters.setCustomerSearch}
          customersPage={filters.customersPage}
          setCustomersPage={filters.setCustomersPage}
          paginateRows={helpers.paginateRows}
          renderTablePagination={helpers.renderTablePagination}
          showCreateCustomerForm={crud.showCreateCustomerForm}
          setShowCreateCustomerForm={crud.setShowCreateCustomerForm}
          newCustomer={crud.newCustomer}
          setNewCustomer={crud.setNewCustomer}
          handleCreateCustomer={crud.handleCreateCustomer}
          editingCustomer={crud.editingCustomer}
          setEditingCustomer={crud.setEditingCustomer}
          handleUpdateCustomer={crud.handleUpdateCustomer}
          handleStartEditCustomer={crud.handleStartEditCustomer}
          canDeleteData={actions.canDeleteData}
          handleDeleteCustomer={actions.handleDeleteCustomer}
        />
      );
    }

    if (activeTab === "requests") {
      return (
        <RequestManagement
          requests={data.requests}
          requestStartFilter={filters.requestStartFilter}
          setRequestStartFilter={filters.setRequestStartFilter}
          requestEndFilter={filters.requestEndFilter}
          setRequestEndFilter={filters.setRequestEndFilter}
          requestStatusFilter={filters.requestStatusFilter}
          setRequestStatusFilter={filters.setRequestStatusFilter}
          requestBrandFilter={filters.requestBrandFilter}
          setRequestBrandFilter={filters.setRequestBrandFilter}
          requestSearch={filters.requestSearch}
          setRequestSearch={filters.setRequestSearch}
          requestsPage={filters.requestsPage}
          setRequestsPage={filters.setRequestsPage}
          isItemInDateRange={helpers.isItemInDateRange}
          paginateRows={helpers.paginateRows}
          renderDateFilter={helpers.renderDateFilter}
          renderTablePagination={helpers.renderTablePagination}
          customerById={data.customerById}
          carById={data.carById}
          formatRequestStatus={formatRequestStatus}
          openRequestDetail={requestDetail.openRequestDetail}
          canDeleteData={actions.canDeleteData}
          handleDeleteRequest={actions.handleDeleteRequest}
        />
      );
    }

    if (activeTab === "contracts") {
      return (
        <ContractManagement
          contracts={data.contracts}
          contractSearch={filters.contractSearch}
          setContractSearch={filters.setContractSearch}
          contractStartFilter={filters.contractStartFilter}
          setContractStartFilter={filters.setContractStartFilter}
          contractEndFilter={filters.contractEndFilter}
          setContractEndFilter={filters.setContractEndFilter}
          contractBrandFilter={filters.contractBrandFilter}
          setContractBrandFilter={filters.setContractBrandFilter}
          contractStatusFilter={filters.contractStatusFilter}
          setContractStatusFilter={filters.setContractStatusFilter}
          contractsPage={filters.contractsPage}
          setContractsPage={filters.setContractsPage}
          customerById={data.customerById}
          carById={data.carById}
          isItemInDateRange={helpers.isItemInDateRange}
          sortNewestByDate={helpers.sortNewestByDate}
          paginateRows={helpers.paginateRows}
          renderTablePagination={helpers.renderTablePagination}
          getContractPaymentSummary={payment.getContractPaymentSummary}
          formatMoneyValue={formatMoneyValue}
          openPaymentDetail={payment.openPaymentDetail}
          onApproveContract={actions.onApproveContract}
          onReturnCar={actions.onReturnCar}
        />
      );
    }

    if (activeTab === "payments") {
      return (
        <PaymentManagement
          payments={data.payments}
          paymentSearch={payment.paymentSearch}
          setPaymentSearch={payment.setPaymentSearch}
          paymentStartFilter={payment.paymentStartFilter}
          setPaymentStartFilter={payment.setPaymentStartFilter}
          paymentEndFilter={payment.paymentEndFilter}
          setPaymentEndFilter={payment.setPaymentEndFilter}
          paymentBrandFilter={payment.paymentBrandFilter}
          setPaymentBrandFilter={payment.setPaymentBrandFilter}
          paymentStatusFilter={payment.paymentStatusFilter}
          setPaymentStatusFilter={payment.setPaymentStatusFilter}
          paymentSortOrder={payment.paymentSortOrder}
          setPaymentSortOrder={payment.setPaymentSortOrder}
          paymentsPage={filters.paymentsPage}
          setPaymentsPage={filters.setPaymentsPage}
          expandedPaymentGroupKey={payment.expandedPaymentGroupKey}
          setExpandedPaymentGroupKey={payment.setExpandedPaymentGroupKey}
          creatingContractIds={payment.creatingContractIds}
          canDeleteData={actions.canDeleteData}
          getPaymentContext={payment.getPaymentContext}
          getPaymentGroupKey={getPaymentGroupKey}
          getPaymentGroupSummary={getPaymentGroupSummary}
          isItemInDateRange={helpers.isItemInDateRange}
          paginateRows={helpers.paginateRows}
          renderTablePagination={helpers.renderTablePagination}
          formatPaymentType={formatPaymentType}
          formatPaymentMethod={formatPaymentMethod}
          formatPaymentStatus={formatPaymentStatus}
          getPaymentStatusClass={getPaymentStatusClass}
          formatMoneyValue={formatMoneyValue}
          handleDeletePaymentGroup={payment.handleDeletePaymentGroup}
          handleCreateContract={payment.handleCreateContract}
          handlePaymentAction={payment.handlePaymentAction}
          handlePaymentRejectNotify={payment.handlePaymentRejectNotify}
          notReceivedPayment={payment.notReceivedPayment}
          setNotReceivedPayment={payment.setNotReceivedPayment}
        />
      );
    }

    if (activeTab === "users") {
      return (
        <UserManagement
          isAdmin={isAdmin}
          users={data.dashboardUsers}
          userSearch={filters.userSearch}
          setUserSearch={filters.setUserSearch}
          userRoleFilter={filters.userRoleFilter}
          setUserRoleFilter={filters.setUserRoleFilter}
          usersPage={filters.usersPage}
          setUsersPage={filters.setUsersPage}
          paginateRows={helpers.paginateRows}
          renderTablePagination={helpers.renderTablePagination}
          showCreateUserForm={crud.showCreateUserForm}
          setShowCreateUserForm={crud.setShowCreateUserForm}
          newUser={crud.newUser}
          setNewUser={crud.setNewUser}
          handleCreateUser={crud.handleCreateUser}
          editingUser={crud.editingUser}
          setEditingUser={crud.setEditingUser}
          handleUpdateUser={crud.handleUpdateUser}
          handleStartEditUser={crud.handleStartEditUser}
          handleDeleteUser={actions.handleDeleteUser}
        />
      );
    }

    return null;
  };

  return (
    <section className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-layout">
          <DashboardSidebar activeTab={activeTab} isAdmin={isAdmin} onTabChange={setActiveTab} />
          <div className="dashboard-table dashboard-content">{renderTabContent()}</div>
          <PaymentDetailModal
            selectedPaymentDetail={payment.selectedPaymentDetail}
            getPaymentDetailData={payment.getPaymentDetailData}
            formatContractStatusLabel={formatContractStatusLabel}
            formatRequestStatus={formatRequestStatus}
            closePaymentDetail={payment.closePaymentDetail}
            formatMoneyValue={formatMoneyValue}
            formatPaymentType={formatPaymentType}
            formatPaymentMethod={formatPaymentMethod}
            formatPaymentStatus={formatPaymentStatus}
            handlePaymentAction={payment.handlePaymentAction}
            handlePaymentRejectNotify={payment.handlePaymentRejectNotify}
            handleRejectRequestFromPayment={payment.handleRejectRequestFromPayment}
            notReceivedPayment={payment.notReceivedPayment}
            setNotReceivedPayment={payment.setNotReceivedPayment}
          />
          <RequestDetailModal
            selectedRequestDetail={requestDetail.selectedRequestDetail}
            customerById={data.customerById}
            carById={data.carById}
            depositPaymentByRequestId={data.depositPaymentByRequestId}
            getRequestTotalPrice={requestDetail.getRequestTotalPrice}
            formatMoneyValue={formatMoneyValue}
            formatDepositStatus={formatDepositStatus}
            formatRequestStatus={formatRequestStatus}
            requestRejectReason={requestDetail.requestRejectReason}
            setRequestRejectReason={requestDetail.setRequestRejectReason}
            showRequestRejectNote={requestDetail.showRequestRejectNote}
            setShowRequestRejectNote={requestDetail.setShowRequestRejectNote}
            setSelectedRequestDetail={requestDetail.setSelectedRequestDetail}
            handleConfirmRequestDeposit={requestDetail.handleConfirmRequestDeposit}
            handleRejectRequestFromDetail={requestDetail.handleRejectRequestFromDetail}
          />
        </div>
        <PaymentNotReceivedModal
          notReceivedPayment={payment.notReceivedPayment}
          setNotReceivedPayment={payment.setNotReceivedPayment}
          onRejectNotify={payment.handlePaymentRejectNotify}
          onRejectRequest={payment.handleRejectRequestFromPayment}
          formatMoneyValue={formatMoneyValue}
        />
      </div>
    </section>
  );
}
