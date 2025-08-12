/**
 * Fairly accurate distance calculation using the Haversine formula
 *
 * @param {import('../data/types').LatLong} latLongA
 * @param {import('../data/types').LatLong} latLongB
 * @returns {number} Distance in km
 */
export function distanceBetween(latLongA, latLongB) {
	const earthRadius = 6371;
	const latDiff = ((latLongB.lat - latLongA.lat) * Math.PI) / 180;
	const longDiff = ((latLongB.lng - latLongA.lng) * Math.PI) / 180;
	const a =
		Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
		Math.cos((latLongA.lat * Math.PI) / 180) *
			Math.cos((latLongB.lat * Math.PI) / 180) *
			Math.sin(longDiff / 2) *
			Math.sin(longDiff / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return earthRadius * c;
}
