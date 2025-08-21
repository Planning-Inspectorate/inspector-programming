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
