import { getInspectorList } from '../../inspector/inspector.js';
import qs from 'qs';
import { parse as parseUrl } from 'url';

/**
 * @typedef {Object} Case
 * @property {string} caseId - The unique identifier for the case.
 * @property {string} caseType - The type of the case (e.g., 'W').
 * @property {string} caseProcedure - The procedure for the case (e.g., 'Written').
 * @property {string} allocationBand - The allocation band for the case.
 * @property {string} caseLevel - The level of the case.
 * @property {string} siteAddressPostcode - The postcode of the site address.
 * @property {string} lpaName - The name of the Local Planning Authority (LPA).
 * @property {string} lpaRegion - The region of the Local Planning Authority (LPA).
 * @property {string} caseStatus - The status of the case
 * @property {number} caseAge - The age of the case in weeks.
 * @property {number} linkedCases - The number of linked cases.
 * @property {Date} finalCommentsDate - The date of the final comments.
 */
/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildViewHome(service) {
	return async (req, res) => {
		const inspectors = await getInspectorList(service, req.session);
		const selectedInspector = inspectors.find((i) => req.query.inspectorId === i.id);

		// Convert the raw query string into a nested object
		const query = qs.parse(parseUrl(req.url).query || '');
		const { filters } = query;

		const page = req.query.page ? parseInt(req.query.page) : 1;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
		const cases = await service.getCbosApiClientForSession(req.session).getCases({
			pageNumber: page,
			pageSize: limit
		});

		const errors = validateFilters(filters);
		const errorList = Object.values(errors).map((message) => ({ ...message, href: `#` }));

		const filteredCases = errorList.length ? cases : filterCases(cases, filters);

		const sortedCases = sortCases(filteredCases, query.sort);

		const formData = {
			filters,
			limit,
			page,
			sort: req.query.sort || 'age',
			inspectorId: req.query.inspectorId
		};
		const calendarData = {};

		calendarData.error =
			"Can't view this calendar. Please contact the inspector to ensure their calendar is shared with you.";

		return res.render('views/home/view.njk', {
			pageHeading: 'Inspector Programming',
			containerClasses: 'pins-container-wide',
			title: 'Unassigned case list',
			cases: sortedCases.map(caseViewModel),
			inspectors,
			data: formData,
			apiKey: service.osMapsApiKey,
			inspectorPin: {
				...selectedInspector
			},
			calendarData,
			errors,
			errorList
		});
	};
}

/**
 * @typedef {Object} Filters
 * //any string value can be used as an age filter, we just validate it later
 * @property {string} [minimumAge]
 * @property {string} [maximumAge]
 */

/**
 * @typedef {Partial<Object<keyof Filters, { text: string }>>} ValidationErrors
 */

/**
 *
 * @param {Filters} filters
 * @returns {ValidationErrors}
 */
function validateFilters(filters) {
	/** @type {ValidationErrors} */
	const errors = {};
	if (!filters) return errors;

	/** @type {(keyof Filters)[]} */
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

/**
 *
 * @param {Case[]} cases
 * @param {Filters} filters
 * @returns
 */
function filterCases(cases, filters) {
	if (!filters) return cases;
	return cases.filter((c) => {
		//always apply case age filters, using defaults if no filter provided
		if (!(c.caseAge >= (+filters.minimumAge || 0) && c.caseAge <= (+filters.maximumAge || 999))) return false;
		return true;
	});
}

function getCaseColor(caseAge) {
	if (caseAge > 40) return 'd4351c'; // red (41+ weeks)
	if (caseAge > 20) return 'f47738'; // orange (21-40 weeks)
	return '_00703c'; // green (0-20 weeks)
}

/**
 *
 * @param {Case[]} cases
 * @param {string} sort - The sort criteria, can be 'distance', 'hybrid', or 'age'.
 * @returns
 */
function sortCases(cases, sort) {
	switch (sort) {
		case 'distance':
			//WIP
			return cases;
		case 'hybrid':
			//WIP
			return cases;
		default:
			return cases.sort((a, b) => b.caseAge - a.caseAge);
	}
}

export function caseViewModel(c) {
	return {
		...c,
		finalCommentsDate: c.finalCommentsDate.toLocaleDateString(),
		color: getCaseColor(c.caseAge),
		currentDate: new Date().toLocaleDateString()
	};
}
export function buildPostHome(service) {
	return async (req, res) => {
		service.logger.info('post home');

		const redirectUrl =
			req.body.action === 'view' ? `/inspector/${req.body.inspectorId}` : `/?inspectorId=${req.body.inspectorId}`;

		return res.redirect(redirectUrl);
	};
}
