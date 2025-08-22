/**
 * Normalize query params into Filters object for type safety
 * @param {string | import('qs').ParsedQs | (string | import('qs').ParsedQs)[] | undefined} filters
 * @returns {import('../data/types.js').Filters}
 */
export function normalizeFilters(filters) {
	if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
		return {};
	}

	return {
		minimumAge: typeof filters?.minimumAge === 'string' ? filters?.minimumAge : undefined,
		maximumAge: typeof filters?.maximumAge === 'string' ? filters?.maximumAge : undefined
	};
}

/**
 * Apply filter object to cases array
 *
 * @param {import('../data/types.js').CaseViewModel[]} cases
 * @param {import('@pins/inspector-programming-lib/data/types.js').Filters} filters
 * @returns
 */
export function filterCases(cases, filters) {
	//sanitise filters object
	const cleanFilters = !(typeof filters === 'object' && filters !== null && !Array.isArray(filters)) ? {} : filters;

	return cases.filter((c) => {
		//always apply case age filters, using defaults if no filter provided
		if (!(c.caseAge >= +(cleanFilters.minimumAge || 0) && c.caseAge <= +(cleanFilters.maximumAge || 999))) return false;
		return true;
	});
}

/**
 * @typedef {Partial<Object<keyof import('@pins/inspector-programming-lib/data/types.js').Filters, { text: string }>>} ValidationErrors
 */

/**
 *	Validates filter object and returns any errors back to display to client under their respective filter field
 *
 * @param {import('@pins/inspector-programming-lib/data/types.js').Filters} filters
 * @returns {ValidationErrors}
 */
export function validateFilters(filters) {
	/** @type {ValidationErrors} */
	const errors = {};
	if (!filters) return errors;

	/** @type {(keyof import('@pins/inspector-programming-lib/data/types.js').Filters)[]} */
	const keysToValidate = ['minimumAge', 'maximumAge'];
	for (const key of keysToValidate) {
		const value = filters[key];
		if (value && (isNaN(+value) || +value < 0 || +value > 500)) {
			errors[key] = { text: 'Please enter a number between 0 and 500' };
			filters[key] = '';
		}
	}
	if (filters.maximumAge && filters.minimumAge && !isNaN(+filters.minimumAge) && !isNaN(+filters.maximumAge)) {
		if (+filters.minimumAge > +filters.maximumAge) {
			errors.minimumAge = { text: 'The minimum value must be less than or equal to the maximum value.' };
			filters.minimumAge = '';
			filters.maximumAge = '';
		}
	}
	return errors;
}
