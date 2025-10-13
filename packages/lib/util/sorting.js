import { distanceBetween } from './distances.js';

/**
 * Any checks to apply before sorting will go here
 * @param {string} sort - The sort criteria, can be 'distance' or 'age'.
 * @param {import('../data/types').InspectorViewModel | undefined} selectedInspector
 * @returns {{ text: string, href: string }[]}
 */
export function validateSorts(sort, selectedInspector) {
	const errors = [];
	if (sort === 'distance') {
		if (!selectedInspector) errors.push({ text: 'Select an inspector', href: `#inspectors` });
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
 * @param {import('../data/types').Coordinates | undefined} inspectorCoordinates
 * @param {import('../data/types').CaseViewModel} caseA
 * @param {import('../data/types').CaseViewModel} caseB
 * @return {number}
 */
export function sortCasesByDistance(inspectorCoordinates, caseA, caseB) {
	//ensure inspector coords are in correct format, else default to null (will result in age sort)
	const validInspectorCoords =
		inspectorCoordinates?.lat && inspectorCoordinates?.lng ? inspectorCoordinates : { lat: null, lng: null };
	const [distA, distB] = [
		distanceBetween(validInspectorCoords, { lat: caseA.siteAddressLatitude, lng: caseA.siteAddressLongitude }),
		distanceBetween(validInspectorCoords, { lat: caseB.siteAddressLatitude, lng: caseB.siteAddressLongitude })
	];
	if (distA !== null && distB !== null) {
		//if distances are equal then fall back to age sort
		if (distA === distB) return sortCasesByAge(caseA, caseB);
		return distA - distB;
	}
	if (distA !== null) return -1;
	if (distB !== null) return 1;
	return sortCasesByAge(caseA, caseB);
}
