// Haversine distance in km between two lat/lng points.
// This is the SQLite-friendly stand-in for PostGIS ST_DWithin/ST_Distance.
// When migrating to Postgres, replace findNearestWorkers' JS loop below with:
//   SELECT * FROM workers
//   WHERE ST_DWithin(location, ST_MakePoint($lng,$lat)::geography, $radius_m)
//   ORDER BY location <-> ST_MakePoint($lng,$lat)::geography
// which pushes the distance computation into the DB and uses a spatial index.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Given a pool of workers (each with lat/lng) and a customer location,
// return workers within radiusKm sorted nearest-first, each annotated
// with distance_km. Emergency bookings should call this with a larger
// radius and looser rating cutoff than scheduled bookings.
function findNearestWorkers(workers, customerLat, customerLng, radiusKm) {
  return workers
    .map((w) => ({
      ...w,
      distance_km: haversineKm(customerLat, customerLng, w.lat, w.lng),
    }))
    .filter((w) => w.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

module.exports = { haversineKm, findNearestWorkers };
