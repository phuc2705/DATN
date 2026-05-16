// Tiện ích geocoding dùng Nominatim (OpenStreetMap) - miễn phí, không cần API key
// Chuyển đổi địa chỉ text → tọa độ lat/lng

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Geocode một địa chỉ thành tọa độ lat/lng
 * @param {string} address - Địa chỉ cần chuyển đổi
 * @returns {{ lat: number, lng: number } | null}
 */
const geocodeAddress = async (address) => {
  try {
    const query = encodeURIComponent(`${address}, Việt Nam`);
    const url = `${NOMINATIM_URL}?q=${query}&format=json&limit=1&countrycodes=vn`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'CleanConnect-DATN/1.0 (thesis project)' },
      signal: AbortSignal.timeout(5000), // Timeout 5 giây
    });

    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    // Không throw lỗi - geocoding thất bại không ảnh hưởng luồng chính
    return null;
  }
};

/**
 * Tính khoảng cách giữa 2 điểm theo công thức Haversine
 * @returns {number} khoảng cách tính bằng km
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

module.exports = { geocodeAddress, haversineDistance };
