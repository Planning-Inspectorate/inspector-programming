/**
 * Fairly accurate distance calculation using the Haversine formula
 *
 * @param {import('../data/types').Coordinates} coordinatesA
 * @param {import('../data/types').Coordinates} coordinatesB
 * @returns {number | null} Distance in km
 */
export function distanceBetween(coordinatesA, coordinatesB) {
	//if any coordinates are null, cant calculate distance
	if (coordinatesA.lat == null || coordinatesA.lng == null || coordinatesB.lat == null || coordinatesB.lng == null)
		return null;

	// Normalize to numbers (Decimal has a .toNumber() method, number passes through fine)
	coordinatesA.lat = typeof coordinatesA.lat === 'number' ? coordinatesA.lat : coordinatesA.lat.toNumber();
	coordinatesA.lng = typeof coordinatesA.lng === 'number' ? coordinatesA.lng : coordinatesA.lng.toNumber();
	coordinatesB.lat = typeof coordinatesB.lat === 'number' ? coordinatesB.lat : coordinatesB.lat.toNumber();
	coordinatesB.lng = typeof coordinatesB.lng === 'number' ? coordinatesB.lng : coordinatesB.lng.toNumber();

	const earthRadius = 6371;
	const latDiff = ((coordinatesB.lat - coordinatesA.lat) * Math.PI) / 180;
	const longDiff = ((coordinatesB.lng - coordinatesA.lng) * Math.PI) / 180;
	const a =
		Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
		Math.cos((coordinatesA.lat * Math.PI) / 180) *
			Math.cos((coordinatesB.lat * Math.PI) / 180) *
			Math.sin(longDiff / 2) *
			Math.sin(longDiff / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return earthRadius * c;
}
