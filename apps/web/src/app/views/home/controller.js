import qs from 'qs';
import { parse as parseUrl } from 'url';
import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';
import { CasesClient } from '@pins/inspector-programming-lib/data/database/cases-client.js';

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
 * @property {number | null} lat - The latitude of the case
 * @property {number | null} lng - The longitude of the case
 */

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildViewHome(service) {
	return async (req, res) => {
		//const inspectors = await getInspectorList(service, req.session);
		const inspectors = await service.inspectorClient.getAllInspectors();

		const selectedInspector = inspectors.find((i) => req.query.inspectorId === i.id);

		// Convert the raw query string into a nested object
		const query = qs.parse(parseUrl(req.url).query || '');
		const { filters } = query;

		const page = req.query.page ? parseInt(req.query.page) : 1;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

		//const cases = await service.casesClient.getAllCases();
		const { cases, total } = await service.casesClient.getPaginatedCases(page, limit);

		const errors = validateFilters(filters);
		const errorList = Object.values(errors).map((message) => ({ ...message, href: `#` }));

		const filteredCases = errorList.length ? cases : filterCases(cases, filters);

		const sortingErrors = validateSorts(String(query.sort), selectedInspector);
		const sortingErrorList = Object.values(sortingErrors).map((message) => ({ ...message, href: `#` }));

		//if sort is invalid sort by age by default
		const sortedCases = sortingErrorList.length
			? filteredCases.sort((a, b) => b.caseAge - a.caseAge)
			: await sortCases(filteredCases, service, String(query.sort), selectedInspector?.postcode ?? null);

		const formData = {
			filters,
			limit,
			page,
			sort: req.query.sort || 'age',
			inspectorId: req.query.inspectorId
		};
		const paginationDetails = handlePagination(req, total, formData);
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
			errorList,
			paginationDetails,
			sortingErrorList
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
export function validateFilters(filters) {
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
 * Any checks to apply before sorting will go here
 * @param {string} sort - The sort criteria, can be 'distance', 'hybrid', or 'age'.
 * @param {import('@pins/inspector-programming-database/src/client').Inspector | undefined} selectedInspector
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
 *
 * @param {Case[]} cases
 * @param {Filters} filters
 * @returns
 */
export function filterCases(cases, filters) {
	if (!filters) return cases;
	return cases.filter((c) => {
		//always apply case age filters, using defaults if no filter provided
		if (!(c.caseAge >= (+filters.minimumAge || 0) && c.caseAge <= (+filters.maximumAge || 999))) return false;
		return true;
	});
}

export function getCaseColor(caseAge) {
	if (caseAge > 40) return 'd4351c'; // red (41+ weeks)
	if (caseAge > 20) return 'f47738'; // orange (21-40 weeks)
	return '_00703c'; // green (0-20 weeks)
}

/**
 *
 * @param {import('@pins/inspector-programming-lib/data/types').CaseViewModel[]} cases
 * @param {import('#service').WebService} service
 * @param {string} sort - The sort criteria, can be 'distance', 'hybrid', or 'age'.
 * @param {string | null} inspectorPostcode
 * @returns {Promise<import('@pins/inspector-programming-lib/data/types').CaseViewModel[]>}
 */
export async function sortCases(cases, service, sort, inspectorPostcode) {
	try {
		if (['hybrid', 'distance'].includes(sort) && inspectorPostcode?.length) {
			return sortByDistance(cases, service, inspectorPostcode);
		}
		//sort by age
		return cases.sort((a, b) => b.caseAge - a.caseAge);
	} catch (err) {
		service.logger.error({ error: err }, '[sortCases] Error sorting cases');
		return cases;
	}
}

/**
 *	Sort cases by distance - decomposed from main sortCases due to complexity
 * @param {import('@pins/inspector-programming-lib/data/types').CaseViewModel[]} cases
 * @param {import('#service').WebService} service
 * @param {string} inspectorPostcode
 * @returns {Promise<import('@pins/inspector-programming-lib/data/types').CaseViewModel[]>}
 */
async function sortByDistance(cases, service, inspectorPostcode) {
	const inspectorCoordinates = await service.osApiClient.getCaseCoordinates(inspectorPostcode);
	if (inspectorCoordinates.lat === null || inspectorCoordinates.lng === null) return cases;

	//if inspector coords are valid, cast as number instead of number | null
	/** @type {import('@pins/inspector-programming-lib/data/types').LatLong} */
	const validatedInspectorCoords = { lat: inspectorCoordinates.lat, lng: inspectorCoordinates.lng };

	return cases.sort((a, b) => {
		const [aValid, bValid] = [!(a.lat === null || a.lng === null), !(b.lat === null || b.lng === null)];
		if (aValid && bValid) {
			//ensure case coords are valid and cast to number if so
			const validA = {
				lat: /** @type {number} */ (a.lat),
				lng: /** @type {number} */ (a.lng)
			};
			const validB = {
				lat: /** @type {number} */ (b.lat),
				lng: /** @type {number} */ (b.lng)
			};
			const [distA, distB] = [
				CasesClient.distanceBetween(validatedInspectorCoords, validA),
				CasesClient.distanceBetween(validatedInspectorCoords, validB)
			];
			return distA - distB;
		}
		if (aValid) return -1;
		if (bValid) return 1;
		return 0;
	});
}

export function caseViewModel(c) {
	return {
		...c,
		caseStatus: c.caseStatus?.replace('_', ' '),
		finalCommentsDate: formatDateForDisplay(c.finalCommentsDate, { format: 'dd/MM/yyyy' }),
		color: getCaseColor(c.caseAge),
		currentDate: formatDateForDisplay(new Date(), { format: 'dd/MM/yyyy' })
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

/**
 * @param {import('express').Request} req
 * @param {number} total
 * @param {Object} formData
 * @returns {Object}
 */

export function handlePagination(req, total, formData) {
	const page = formData.page;
	const limit = formData.limit;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	const params = { ...req.query, page: undefined };

	return {
		previous:
			page > 1
				? {
						href: buildQueryString(params, page - 1)
					}
				: null,
		next:
			page < totalPages
				? {
						href: buildQueryString(params, page + 1)
					}
				: null,
		items: Array.from({ length: totalPages }, (_, i) => ({
			number: i + 1,
			href: buildQueryString(params, i + 1),
			current: page === i + 1
		}))
	};
}

/**
 * @param {Object} params
 * @param {number} newPage
 * @returns {string}
 */
export function buildQueryString(params, newPage) {
	const updatedParams = { ...params, page: newPage };
	const searchParams = new URLSearchParams(
		Object.entries(updatedParams)
			.filter(([, v]) => v !== undefined && v !== null)
			.map(([k, v]) => [k, String(v)])
	);
	return '?' + searchParams.toString();
}
