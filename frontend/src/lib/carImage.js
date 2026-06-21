export function readCarImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type?.startsWith("image/")) {
      reject(new Error("Vui lòng chọn đúng file ảnh xe."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc ảnh xe."));
    reader.onload = () => {
      const originalDataUrl = String(reader.result || "");
      const image = new Image();
      image.onerror = () => {
        if (originalDataUrl.startsWith("data:image/") && originalDataUrl.length < 1000000) {
          resolve(originalDataUrl);
          return;
        }
        reject(new Error("Ảnh xe không hợp lệ hoặc quá lớn."));
      };
      image.onload = () => {
        try {
          const maxSize = 1200;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.86));
        } catch {
          if (originalDataUrl.length < 1000000) {
            resolve(originalDataUrl);
          } else {
            reject(new Error("Không thể xử lý ảnh, dung lượng quá lớn."));
          }
        }
      };
      image.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
