import { PaymentActionIcon } from "../AppIcons.jsx";
import { canonicalizeBrand, uniqueCanonicalBrands } from "../../lib/carUtils.js";
import { getCarImageUrl } from "../../lib/carUtils.js";

export default function CarManagement({
  cars,
  fallbackCars,
  carSearch,
  setCarSearch,
  carFilters,
  setCarFilters,
  carsPage,
  setCarsPage,
  showCreateCarForm,
  setShowCreateCarForm,
  newCar,
  setNewCar,
  handleCreateCar,
  handleCarImageChange,
  editingCar,
  setEditingCar,
  handleUpdateCar,
  handleStartEditCar,
  canDeleteData,
  handleDeleteCar,
  formatCarStatusLabel,
  getPaginationItems,
}) {
  const carsPerPage = 10;
  const normalizedSearch = carSearch.trim().toLowerCase();
  const uniqueCarValues = (key) => (
    [...new Set(cars.map((car) => car?.[key]).filter((value) => value !== null && value !== undefined && value !== ""))]
      .sort((a, b) => String(a).localeCompare(String(b), "vi", { numeric: true }))
  );
  const uniqueCarBrandValues = uniqueCanonicalBrands(cars);
  const setCarFilterValue = (key, value) => {
    setCarFilters((prev) => ({ ...prev, [key]: value }));
    setCarsPage(1);
  };
  const resetCarFilters = () => {
    setCarSearch("");
    setCarFilters({
      brand: "",
      minPrice: "",
      maxPrice: "",
      status: "",
      seats: "",
      transmission: "",
      year: "",
    });
    setCarsPage(1);
  };
  const filteredCars = cars.filter((car) => {
    const searchable = [
      car.name,
      canonicalizeBrand(car.brand),
      car.license_plate,
      car.color,
      car.fuel_type,
      car.transmission,
      car.year,
      car.description,
    ].join(" ").toLowerCase();
    const price = Number(car.price_per_day || 0);
    if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
    if (carFilters.brand && canonicalizeBrand(car.brand) !== carFilters.brand) return false;
    if (carFilters.status && String(car.status) !== carFilters.status) return false;
    if (carFilters.seats && String(car.seats) !== carFilters.seats) return false;
    if (carFilters.transmission && String(car.transmission) !== carFilters.transmission) return false;
    if (carFilters.year && String(car.year) !== carFilters.year) return false;
    if (carFilters.minPrice && price < Number(carFilters.minPrice)) return false;
    if (carFilters.maxPrice && price > Number(carFilters.maxPrice)) return false;
    return true;
  });
  const totalCarPages = Math.max(1, Math.ceil(filteredCars.length / carsPerPage));
  const safeCarsPage = Math.min(carsPage, totalCarPages);
  const pagedCars = filteredCars.slice((safeCarsPage - 1) * carsPerPage, safeCarsPage * carsPerPage);
  
  return (
    <div className="table-section">
      <div className="table-heading-row">
        <h3>Danh sách xe</h3>
        <div className="car-table-actions">
          <input
            className="table-search-input"
            type="search"
            value={carSearch}
            onChange={(event) => {
              setCarSearch(event.target.value);
              setCarsPage(1);
            }}
            placeholder="Tìm xe..."
          />
          <button type="button" className="action-button table-create-button" onClick={() => setShowCreateCarForm(true)}>
            Thêm xe mới
          </button>
        </div>
      </div>
      <div className="car-filter-grid">
        <label>
          Hãng
          <select value={carFilters.brand} onChange={(event) => setCarFilterValue("brand", event.target.value)}>
            <option value="">Tất cả</option>
            {uniqueCarBrandValues.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </label>
        <label>
          Giá từ
          <input type="number" value={carFilters.minPrice} onChange={(event) => setCarFilterValue("minPrice", event.target.value)} placeholder="VND/ngày" />
        </label>
        <label>
          Giá đến
          <input type="number" value={carFilters.maxPrice} onChange={(event) => setCarFilterValue("maxPrice", event.target.value)} placeholder="VND/ngày" />
        </label>
        <label>
          Trạng thái
          <select value={carFilters.status} onChange={(event) => setCarFilterValue("status", event.target.value)}>
            <option value="">Tất cả</option>
            <option value="available">Sẵn sàng</option>
            <option value="rented">Đang thuê</option>
          </select>
        </label>
        <label>
          Chỗ
          <select value={carFilters.seats} onChange={(event) => setCarFilterValue("seats", event.target.value)}>
            <option value="">Tất cả</option>
            {uniqueCarValues("seats").map((seats) => (
              <option key={seats} value={seats}>{seats}</option>
            ))}
          </select>
        </label>
        <label>
          Hộp số
          <select value={carFilters.transmission} onChange={(event) => setCarFilterValue("transmission", event.target.value)}>
            <option value="">Tất cả</option>
            {uniqueCarValues("transmission").map((transmission) => (
              <option key={transmission} value={transmission}>{transmission}</option>
            ))}
          </select>
        </label>
        <label>
          Năm
          <select value={carFilters.year} onChange={(event) => setCarFilterValue("year", event.target.value)}>
            <option value="">Tất cả</option>
            {uniqueCarValues("year").map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <button type="button" className="action-button secondary car-filter-clear" onClick={resetCarFilters}>
          Xóa lọc
        </button>
      </div>
      {showCreateCarForm ? (
        <>
          <div className="modal-overlay" onClick={() => setShowCreateCarForm(false)} />
          <div className="user-edit-modal">
            <form className="user-edit-card" onSubmit={handleCreateCar}>
              <div className="user-edit-header">
                <h3>Thêm xe mới</h3>
                <button type="button" className="modal-close" onClick={() => setShowCreateCarForm(false)}>×</button>
              </div>
              <div className="user-edit-grid">
                <label>
                  Tên xe
                  <input value={newCar.name} onChange={(e) => setNewCar({ ...newCar, name: e.target.value })} required />
                </label>
                <label>
                  Hãng
                  <input value={newCar.brand} onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })} required />
                </label>
                <label>
                  Biển số
                  <input value={newCar.license_plate} onChange={(e) => setNewCar({ ...newCar, license_plate: e.target.value })} required />
                </label>
                <label>
                  Giá/ngày
                  <input type="number" value={newCar.price_per_day} onChange={(e) => setNewCar({ ...newCar, price_per_day: e.target.value })} required />
                </label>
                <label>
                  Trạng thái
                  <select value={newCar.status} onChange={(e) => setNewCar({ ...newCar, status: e.target.value })}>
                    <option value="available">available</option>
                    <option value="rented">rented</option>
                  </select>
                </label>
                <label>
                  Màu sắc
                  <input value={newCar.color} onChange={(e) => setNewCar({ ...newCar, color: e.target.value })} />
                </label>
                <label>
                  Chỗ ngồi
                  <input type="number" value={newCar.seats} onChange={(e) => setNewCar({ ...newCar, seats: e.target.value })} />
                </label>
                <label>
                  Nhiên liệu
                  <input value={newCar.fuel_type} onChange={(e) => setNewCar({ ...newCar, fuel_type: e.target.value })} />
                </label>
                <label>
                  Hộp số
                  <input value={newCar.transmission} onChange={(e) => setNewCar({ ...newCar, transmission: e.target.value })} />
                </label>
                <label>
                  Năm sản xuất
                  <input type="number" value={newCar.year} onChange={(e) => setNewCar({ ...newCar, year: e.target.value })} />
                </label>
                <label>
                  Mô tả
                  <textarea value={newCar.description} onChange={(e) => setNewCar({ ...newCar, description: e.target.value })} rows="3" />
                </label>
                <label className="car-image-field">
                  Ảnh xe
                  <input type="file" accept="image/*" onChange={(event) => handleCarImageChange(event, setNewCar)} />
                </label>
              </div>
              <div className="user-edit-actions">
                <button type="button" className="action-button secondary" onClick={() => setShowCreateCarForm(false)}>Hủy</button>
                <button type="submit" className="action-button">Thêm xe</button>
              </div>
            </form>
          </div>
        </>
      ) : null}
      {editingCar ? (
        <>
          <div className="modal-overlay" onClick={() => setEditingCar(null)} />
          <div className="user-edit-modal">
            <form className="user-edit-card" onSubmit={handleUpdateCar}>
              <div className="user-edit-header">
                <h3>Sửa xe</h3>
                <button type="button" className="modal-close" onClick={() => setEditingCar(null)}>×</button>
              </div>
              <div className="user-edit-grid">
                <label>
                  Tên xe
                  <input value={editingCar.name} onChange={(e) => setEditingCar({ ...editingCar, name: e.target.value })} required />
                </label>
                <label>
                  Hãng
                  <input value={editingCar.brand} onChange={(e) => setEditingCar({ ...editingCar, brand: e.target.value })} required />
                </label>
                <label>
                  Biển số
                  <input value={editingCar.license_plate} onChange={(e) => setEditingCar({ ...editingCar, license_plate: e.target.value })} required />
                </label>
                <label>
                  Giá/ngày
                  <input type="number" value={editingCar.price_per_day} onChange={(e) => setEditingCar({ ...editingCar, price_per_day: e.target.value })} required />
                </label>
                <label>
                  Trạng thái
                  <select value={editingCar.status} onChange={(e) => setEditingCar({ ...editingCar, status: e.target.value })}>
                    <option value="available">available</option>
                    <option value="rented">rented</option>
                  </select>
                </label>
                <label>
                  Màu sắc
                  <input value={editingCar.color} onChange={(e) => setEditingCar({ ...editingCar, color: e.target.value })} />
                </label>
                <label>
                  Chỗ ngồi
                  <input type="number" value={editingCar.seats} onChange={(e) => setEditingCar({ ...editingCar, seats: e.target.value })} />
                </label>
                <label>
                  Nhiên liệu
                  <input value={editingCar.fuel_type} onChange={(e) => setEditingCar({ ...editingCar, fuel_type: e.target.value })} />
                </label>
                <label>
                  Hộp số
                  <input value={editingCar.transmission} onChange={(e) => setEditingCar({ ...editingCar, transmission: e.target.value })} />
                </label>
                <label>
                  Năm sản xuất
                  <input type="number" value={editingCar.year} onChange={(e) => setEditingCar({ ...editingCar, year: e.target.value })} />
                </label>
                <label>
                  Mô tả
                  <textarea value={editingCar.description} onChange={(e) => setEditingCar({ ...editingCar, description: e.target.value })} rows="3" />
                </label>
                <label className="car-image-field">
                  Ảnh xe
                  <input type="file" accept="image/*" onChange={(event) => handleCarImageChange(event, setEditingCar)} />
                  {editingCar.image_url ? (
                    <a className="car-image-current" href={editingCar.image_url} target="_blank" rel="noreferrer">
                      Xem ảnh hiện tại
                    </a>
                  ) : (
                    <span className="car-image-current muted">Chưa có ảnh</span>
                  )}
                </label>
              </div>
              <div className="user-edit-actions">
                <button type="button" className="action-button secondary" onClick={() => setEditingCar(null)}>Hủy</button>
                <button type="submit" className="action-button">Lưu</button>
              </div>
            </form>
          </div>
        </>
      ) : null}
      <table className="cars-table">
        <thead>
            <tr>
              <th>STT</th>
              <th>Tên</th>
              <th>Hãng</th>
              <th>Biển số</th>
              <th>Giá/ngày</th>
              <th>
                <select value={carFilters.status} onChange={(event) => setCarFilterValue("status", event.target.value)} className="header-filter-select">
                  <option value="">Trạng thái</option>
                  <option value="available">Sẵn sàng</option>
                  <option value="rented">Đang thuê</option>
                </select>
              </th>
              <th>Màu</th>
              <th>Chỗ</th>
              <th>Nhiên liệu</th>
              <th>Hộp số</th>
              <th>Năm</th>
              <th>Mô tả</th>
              <th>Ảnh</th>
              <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {pagedCars.map((car, index) => (
            <tr key={car.car_id}>
              <td>{(safeCarsPage - 1) * carsPerPage + index + 1}</td>
              <td>{car.name}</td>
              <td>{canonicalizeBrand(car.brand)}</td>
              <td>{car.license_plate}</td>
              <td>{Number(car.price_per_day || 0).toLocaleString("vi-VN")}</td>
              <td>
                <span className={`request-status-pill status-${String(car.status || "").toLowerCase()}`}>
                  {formatCarStatusLabel(car.status)}
                </span>
              </td>
              <td>{car.color || "-"}</td>
              <td>{car.seats || "-"}</td>
              <td>{car.fuel_type || "-"}</td>
              <td>{car.transmission || "-"}</td>
              <td>{car.year || "-"}</td>
              <td>{car.description || "-"}</td>
              <td>
                {getCarImageUrl(car, fallbackCars) ? (
                  <img className="cars-table-image" src={getCarImageUrl(car, fallbackCars)} alt={car.name || "Ảnh xe"} />
                ) : (
                  "-"
                )}
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="table-icon-button"
                    type="button"
                    title="Sửa"
                    aria-label="Sửa"
                    onClick={() => handleStartEditCar(car)}
                  >
                    <PaymentActionIcon type="edit" />
                  </button>
                      <button 
                        className="table-icon-button danger" 
                        type="button"
                        title="Xóa"
                        aria-label="Xóa"
                        disabled={!canDeleteData}
                        onClick={() => handleDeleteCar(car.car_id)}
                      >
                    <PaymentActionIcon type="trash" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {pagedCars.length === 0 ? (
            <tr>
              <td colSpan="14">Không có xe nào khớp với bộ lọc.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="table-pagination">
        <span>
          Hiển thị {pagedCars.length ? (safeCarsPage - 1) * carsPerPage + 1 : 0}
          {" - "}
          {Math.min(safeCarsPage * carsPerPage, filteredCars.length)} / {filteredCars.length} xe
        </span>
        <div className="table-pagination-actions">
          <button type="button" className="action-button secondary" disabled={safeCarsPage <= 1} onClick={() => setCarsPage((page) => Math.max(1, page - 1))}>
            Trước
          </button>
          <div className="table-page-numbers" aria-label="Chọn trang">
            {getPaginationItems(safeCarsPage, totalCarPages).map((pageItem, index) => pageItem === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="table-page-ellipsis">...</span>
            ) : (
              <button
                key={pageItem}
                type="button"
                className={`table-page-number ${pageItem === safeCarsPage ? "active" : ""}`}
                onClick={() => setCarsPage(pageItem)}
                aria-current={pageItem === safeCarsPage ? "page" : undefined}
              >
                {pageItem}
              </button>
            ))}
          </div>
          <button type="button" className="action-button" disabled={safeCarsPage >= totalCarPages} onClick={() => setCarsPage((page) => Math.min(totalCarPages, page + 1))}>
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
