/**
 * Fairly accurate distance calculation using the Haversine formula
 *
 * @param {import('../data/types').Coordinates} coordinatesA
 * @param {import('../data/types').Coordinates} coordinatesB
 * @returns {number | null} Distance in km
 */
export function distanceBetween(coordinatesA, coordinatesB) {
	if (
		typeof coordinatesA.lat !== 'number' ||
		typeof coordinatesA.lng !== 'number' ||
		typeof coordinatesB.lat !== 'number' ||
		typeof coordinatesB.lng !== 'number'
	)
		return null;

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
