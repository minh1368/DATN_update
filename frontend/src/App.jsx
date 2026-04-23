import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [cars, setCars] = useState([]);
  const [newCar, setNewCar] = useState({
    name: "",
    brand: "",
    price_per_day: ""
  });

  // load danh sách xe
  const fetchCars = () => {
    axios.get("http://127.0.0.1:8000/cars/")
      .then(res => setCars(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchCars();
  }, []);

  // thêm xe
  const handleAddCar = () => {
    axios.post("http://127.0.0.1:8000/cars/", newCar)
      .then(() => {
        fetchCars();
        setNewCar({ name: "", brand: "", price_per_day: "" });
      })
      .catch(err => console.error(err));
  };

  // xóa xe
  const handleDelete = (id) => {
    axios.delete(`http://127.0.0.1:8000/cars/${id}`)
      .then(() => fetchCars())
      .catch(err => console.error(err));
  };

  return (
    <div style={{
      backgroundColor: "#fff",
      color: "#000",
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "Arial"
      }}>
      <h1 style={{ textAlign: "center" }}>🚗 Hệ thống thuê xe</h1>

      {/* FORM THÊM XE */}
      <div style={{
        marginBottom: "20px",
        padding: "15px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        maxWidth: "400px"
      }}>
        <h3>Thêm xe</h3>

        <input
          placeholder="Tên xe"
          value={newCar.name}
          onChange={e => setNewCar({ ...newCar, name: e.target.value })}
        /><br /><br />

        <input
          placeholder="Hãng"
          value={newCar.brand}
          onChange={e => setNewCar({ ...newCar, brand: e.target.value })}
        /><br /><br />

        <input
          placeholder="Giá/ngày"
          type="number"
          value={newCar.price_per_day}
          onChange={e => setNewCar({ ...newCar, price_per_day: e.target.value })}
        /><br /><br />

        <button onClick={handleAddCar}>➕ Thêm xe</button>
      </div>

      {/* DANH SÁCH XE */}
      <h2>Danh sách xe</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "15px"
      }}>
        {cars.map(car => (
          <div key={car.car_id} style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "15px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
          }}>
            <h3>{car.name}</h3>
            <p><b>Hãng:</b> {car.brand}</p>
            <p><b>Giá:</b> {car.price_per_day} VND/ngày</p>
            <p><b>Trạng thái:</b> {car.status}</p>

            <button
                style={{
                  background: "#ff4d4f",
                  color: "#fff",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  cursor: "pointer"
                  }}
              onClick={() => handleDelete(car.car_id)}
            >
              ❌ Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;