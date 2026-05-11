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

export function selfDriveDetailPath(car) {
  return `/thue-xe-tu-lai/${carSlug(car)}`;
}

export function normalizeImageUrl(url) {
  if (!url) return "";
  const trimmedUrl = String(url).trim();
  if (trimmedUrl.startsWith("/") || trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }
  return `/${trimmedUrl}`;
}

export function getCarImageUrl(car, fallbackCars) {
  const url = car?.image_url || "";
  if (url) return normalizeImageUrl(url);
  const name = String(car?.name || "").trim();
  const brand = String(car?.brand || "").trim();
  const match = (fallbackCars || []).find((c) => c.name === name && c.brand === brand);
  return normalizeImageUrl(match?.image_url || "");
}

