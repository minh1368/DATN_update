import { useState } from "react";
import { fallbackCars } from "../lib/carData.js";
import { readCarImageFile } from "../lib/carImage.js";
import { canonicalizeBrand, getCarImageUrl } from "../lib/carUtils.js";
import { carService, customerService, userService } from "../services/dashboardService.js";

const EMPTY_CAR = {
  name: "",
  brand: "",
  license_plate: "",
  price_per_day: "",
  status: "available",
  color: "",
  seats: "",
  fuel_type: "",
  transmission: "",
  year: "",
  description: "",
  image_url: "",
};

const EMPTY_CUSTOMER = { name: "", phone: "", email: "", password: "", address: "" };
const EMPTY_USER = { name: "", email: "", password: "", role: "staff" };

export default function useDashboardCrud({ headers, refreshData, refreshCarsContext, notify }) {
  const [newCar, setNewCar] = useState(EMPTY_CAR);
  const [showCreateCarForm, setShowCreateCarForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showCreateCustomerForm, setShowCreateCustomerForm] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);

  const runMutation = async (mutation, fallbackMessage = "Thao tác thất bại") => {
    try {
      await mutation();
      refreshData();
      return true;
    } catch (error) {
      console.error(error);
      notify(error.message || fallbackMessage, "error");
      return false;
    }
  };

  const normalizeCarPayload = (car) => ({
    ...car,
    brand: canonicalizeBrand(car.brand),
    price_per_day: Number(car.price_per_day) || 0,
    seats: car.seats ? Number(car.seats) : null,
    year: car.year ? Number(car.year) : null,
  });

  const handleCreateCar = async (event) => {
    event.preventDefault();
    const ok = await runMutation(() => carService.create(normalizeCarPayload(newCar), headers), "Thêm xe thất bại");
    if (!ok) return;
    await refreshCarsContext?.();
    setNewCar(EMPTY_CAR);
    setShowCreateCarForm(false);
    notify("Thêm xe mới thành công.", "success");
  };

  const handleStartEditCar = (car) => {
    setEditingCar({
      car_id: car.car_id,
      name: car.name || "",
      brand: canonicalizeBrand(car.brand) || "",
      license_plate: car.license_plate || "",
      price_per_day: car.price_per_day || "",
      status: car.status || "available",
      color: car.color || "",
      seats: car.seats || "",
      fuel_type: car.fuel_type || "",
      transmission: car.transmission || "",
      year: car.year || "",
      description: car.description || "",
      image_url: car.image_url || getCarImageUrl(car, fallbackCars) || "",
    });
  };

  const handleCarImageChange = async (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imageUrl = await readCarImageFile(file);
      setter((current) => ({ ...current, image_url: imageUrl }));
    } catch (error) {
      notify(error.message || "Không thể tải ảnh xe", "error");
      event.target.value = "";
    }
  };

  const handleUpdateCar = async (event) => {
    event.preventDefault();
    if (!editingCar) return;
    const body = normalizeCarPayload(editingCar);
    delete body.car_id;
    const ok = await runMutation(() => carService.update(editingCar.car_id, body, headers), "Lưu xe thất bại");
    if (!ok) return;
    await refreshCarsContext?.();
    setEditingCar(null);
    notify("Lưu thành công.", "success");
  };

  const handleCreateCustomer = async (event) => {
    event.preventDefault();
    const ok = await runMutation(() => customerService.create(newCustomer, headers), "Thêm khách hàng thất bại");
    if (!ok) return;
    setNewCustomer(EMPTY_CUSTOMER);
    setShowCreateCustomerForm(false);
  };

  const handleStartEditCustomer = (customer) => {
    setEditingCustomer({
      customer_id: customer.customer_id,
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      password: customer.password || "",
      address: customer.address || "",
    });
  };

  const handleUpdateCustomer = async (event) => {
    event.preventDefault();
    if (!editingCustomer) return;
    const ok = await runMutation(() => customerService.update(editingCustomer.customer_id, {
      name: editingCustomer.name,
      phone: editingCustomer.phone,
      email: editingCustomer.email,
      password: editingCustomer.password,
      address: editingCustomer.address,
    }, headers), "Lưu khách hàng thất bại");
    if (!ok) return;
    setEditingCustomer(null);
    notify("Lưu khách hàng thành công.", "success");
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    const ok = await runMutation(() => userService.create(newUser, headers), "Tạo nhân sự thất bại");
    if (!ok) return;
    setNewUser(EMPTY_USER);
    setShowCreateUserForm(false);
    notify("Tạo nhân sự thành công.", "success");
  };

  const handleStartEditUser = (user) => {
    setEditingUser({
      user_id: user.user_id,
      name: user.name || "",
      email: user.email || user.username || "",
      password: user.password || "",
      role: user.role || "staff",
    });
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    const ok = await runMutation(() => userService.update(editingUser.user_id, {
      name: editingUser.name,
      email: editingUser.email,
      password: editingUser.password,
      role: editingUser.role,
    }, headers), "Lưu nhân sự thất bại");
    if (!ok) return;
    setEditingUser(null);
    notify("Lưu nhân sự thành công.", "success");
  };

  return {
    newCar,
    setNewCar,
    showCreateCarForm,
    setShowCreateCarForm,
    editingCar,
    setEditingCar,
    newCustomer,
    setNewCustomer,
    editingCustomer,
    setEditingCustomer,
    showCreateCustomerForm,
    setShowCreateCustomerForm,
    newUser,
    setNewUser,
    editingUser,
    setEditingUser,
    showCreateUserForm,
    setShowCreateUserForm,
    handleCreateCar,
    handleStartEditCar,
    handleCarImageChange,
    handleUpdateCar,
    handleCreateCustomer,
    handleStartEditCustomer,
    handleUpdateCustomer,
    handleCreateUser,
    handleStartEditUser,
    handleUpdateUser,
  };
}
