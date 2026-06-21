export function slugify(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function carSlug(car) {
  const base = slugify(car?.name || "xe");
  const id = Number(car?.car_id);
  return Number.isFinite(id) ? `${base}-${id}` : base;
}

export function carIdFromSlug(slug) {
  const match = String(slug || "").match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}

export function carNameFromSlug(slug) {
  const value = String(slug || "").trim().toLowerCase();
  if (!value) return "";
  // Nếu slug có đuôi -id thì bỏ id để lấy phần tên
  return value.replace(/-\d+$/, "");
}

export function selfDriveDetailPath(car) {
  return `/thue-xe-tu-lai/${carSlug(car)}`;
}

const BRAND_ALIASES = {
  audi: "Audi",
  bmw: "BMW",
  byd: "BYD",
  ford: "Ford",
  honda: "Honda",
  hyundai: "Hyundai",
  kia: "KIA",
  lexus: "Lexus",
  mazda: "Mazda",
  mercedes: "Mercedes",
  "mercedes-benz": "Mercedes-Benz",
  mg: "MG",
  mini: "MINI",
  mitsubishi: "Mitsubishi",
  nissan: "Nissan",
  peugeot: "Peugeot",
  porsche: "Porsche",
  suzuki: "Suzuki",
  tesla: "Tesla",
  toyota: "Toyota",
  vinfast: "VinFast",
  volkswagen: "Volkswagen",
};

export function normalizeBrandKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function canonicalizeBrand(value) {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  const key = normalizeBrandKey(cleaned);
  if (BRAND_ALIASES[key]) return BRAND_ALIASES[key];

  return cleaned
    .split(" ")
    .map((part) => {
      if (!part) return part;
      const lowerPart = part.toLocaleLowerCase("vi-VN");
      return lowerPart.charAt(0).toLocaleUpperCase("vi-VN") + lowerPart.slice(1);
    })
    .join(" ");
}

export function uniqueCanonicalBrands(cars) {
  const brands = new Map();
  (cars || []).forEach((car) => {
    const display = canonicalizeBrand(car?.brand);
    if (!display) return;
    const key = normalizeBrandKey(display);
    if (!brands.has(key)) brands.set(key, display);
  });
  return [...brands.values()].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
}

export function normalizeImageUrl(url) {
  if (!url) return "";
  const trimmedUrl = String(url).trim();
  if (
    trimmedUrl.startsWith("/") ||
    trimmedUrl.startsWith("http://") ||
    trimmedUrl.startsWith("https://") ||
    trimmedUrl.startsWith("data:image/") ||
    trimmedUrl.startsWith("blob:")
  ) {
    return trimmedUrl;
  }
  return `/${trimmedUrl}`;
}

export function getCarImageUrl(car, fallbackCars) {
  const url = car?.image_url || "";
  if (url) return normalizeImageUrl(url);
  const name = String(car?.name || "").trim();
  const brandKey = normalizeBrandKey(car?.brand);
  const match = (fallbackCars || []).find((c) => c.name === name && normalizeBrandKey(c.brand) === brandKey);
  return normalizeImageUrl(match?.image_url || "");
}


