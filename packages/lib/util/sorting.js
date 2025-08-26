import { distanceBetween } from './distances.js';

/**
 * Any checks to apply before sorting will go here
 * @param {string} sort - The sort criteria, can be 'distance', 'hybrid', or 'age'.
 * @param {import('../data/types').Inspector | undefined} selectedInspector
 * @returns {{ text: string }[]}
 */
export function validateSorts(sort, selectedInspector) {
	const errors = [];
	if (sort === 'distance') {
		if (!selectedInspector) errors.push({ text: 'An inspector must be selected before sorting by distance.' });
	}
	return errors;
}

/**
 * Sort function that sorts two cases using the default age algorithm
 * First sorts oldest caseAge first, then if those match sorts oldest caseReceivedDate first, then if those match sorts using lpaName alphabetically
 *
 * @param {import('../data/types').CaseViewModel} caseA
 * @param {import('../data/types').CaseViewModel} caseB
 * @return {number}
 */
export function sortCasesByAge(caseA, caseB) {
	const ageComparison = caseB.caseAge - caseA.caseAge;
	if (ageComparison !== 0) return ageComparison;

	const dateReceivedComparison = () => {
		const aDate = caseA.caseReceivedDate ? new Date(caseA.caseReceivedDate).getTime() : null;
		const bDate = caseB.caseReceivedDate ? new Date(caseB.caseReceivedDate).getTime() : null;

		//handle null dates
		if (aDate === null && bDate === null) return 0;
		if (aDate === null) return 1;
		if (bDate === null) return -1;

		// otherwise compare normally
		return aDate - bDate;
	};
	if (dateReceivedComparison() !== 0) return dateReceivedComparison();

	//handle null lpaNames
	if ((caseA.lpaName || null) === null && (caseB.lpaName || null) === null) return 0;
	if ((caseA.lpaName || null) === null) return 1;
	if ((caseB.lpaName || null) === null) return -1;

	//otherwise compare normally
	return (caseA.lpaName || '').localeCompare(caseB.lpaName || '', undefined, { sensitivity: 'base' });
}

/**
 *	Sort function that sorts two cases using distance from an inspector's postcode
 *	If the distance is equal then falls back to the default age sort
 * @param {import('../data/types').Coordinates} inspectorCoordinates
 * @param {import('../data/types').CaseViewModel} caseA
 * @param {import('../data/types').CaseViewModel} caseB
 * @return {number}
 */
export function sortCasesByDistance(inspectorCoordinates, caseA, caseB) {
	const [distA, distB] = [
		distanceBetween(inspectorCoordinates, { lat: caseA.siteAddressLatitude, lng: caseA.siteAddressLongitude }),
		distanceBetween(inspectorCoordinates, { lat: caseB.siteAddressLatitude, lng: caseB.siteAddressLongitude })
	];
	if (distA !== null && distB !== null) return distA === distB ? sortCasesByAge(caseA, caseB) : distA - distB;
	if (distA !== null) return -1;
	if (distB !== null) return 1;
	return 0;
}
