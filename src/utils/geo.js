// Calculate distance between two coordinates in meters
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate speed in m/s between two timestamped points
export function getSpeed(point1, point2) {
  const dist = getDistance(
    point1.latitude, point1.longitude,
    point2.latitude, point2.longitude
  );
  const timeDiff = (point2.timestamp - point1.timestamp) / 1000;
  if (timeDiff <= 0) return 0;
  return dist / timeDiff;
}

// Check if a point is inside a polygon
export function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude, yi = polygon[i].longitude;
    const xj = polygon[j].latitude, yj = polygon[j].longitude;
    const intersect =
      yi > point.longitude !== yj > point.longitude &&
      point.latitude < ((xj - xi) * (point.longitude - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Calculate approximate area of a polygon in square meters
export function calculatePolygonArea(polygon) {
  if (polygon.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const lat1 = (polygon[i].latitude * Math.PI) / 180;
    const lat2 = (polygon[j].latitude * Math.PI) / 180;
    const dLon = ((polygon[j].longitude - polygon[i].longitude) * Math.PI) / 180;
    area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = (Math.abs(area) * 6371000 * 6371000) / 2;
  return area;
}

// Convert area in square meters to square miles
export function sqMetersToSqMiles(sqMeters) {
  return sqMeters / 2589988.11;
}

// Generate a polygon buffer around a path
export function generatePathBuffer(path, bufferSize = 0.0003) {
  if (path.length < 2) return [];
  const left = [];
  const right = [];
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].latitude - path[i].latitude;
    const dy = path[i + 1].longitude - path[i].longitude;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;
    const nx = -dy / len * bufferSize;
    const ny = dx / len * bufferSize;
    left.push({
      latitude: path[i].latitude + nx,
      longitude: path[i].longitude + ny,
    });
    right.unshift({
      latitude: path[i].latitude - nx,
      longitude: path[i].longitude - ny,
    });
  }
  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  const dx = last.latitude - prev.latitude;
  const dy = last.longitude - prev.longitude;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 0) {
    const nx = -dy / len * bufferSize;
    const ny = dx / len * bufferSize;
    left.push({ latitude: last.latitude + nx, longitude: last.longitude + ny });
    right.unshift({ latitude: last.latitude - nx, longitude: last.longitude - ny });
  }
  return [...left, ...right];
}
