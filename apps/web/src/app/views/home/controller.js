import { getInspectorList } from '../../inspector/inspector.js';
import qs from 'qs';
import { caseTypes, specialisms, specialismTypes } from '../../specialism/specialism.js';
import { parse as parseUrl } from 'url';
import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';

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
		const inspectorData =
			selectedInspector &&
			(await service.db.inspector.findFirst({
				where: { entraId: selectedInspector.id }
			}));

		// Convert the raw query string into a nested object
		const query = qs.parse(parseUrl(req.url).query || '');
		const { filters } = query;

		const page = req.query.page ? parseInt(req.query.page) : 1;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

		const { cases, total } = await service.casesClient.paginateCases(page, limit);

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
		const paginationDetails = handlePagination(req, total, formData);
		const calendarData = {};

		calendarData.error =
			"Can't view this calendar. Please contact the inspector to ensure their calendar is shared with you.";

		return res.render('views/home/view.njk', {
			pageHeading: 'Unassigned case list',
			containerClasses: 'pins-container-wide',
			title: 'Unassigned case list',
			cases: sortedCases.map(caseViewModel),
			inspectors,
			data: formData,
			apiKey: service.osMapsApiKey,
			inspectorPin: {
				...selectedInspector,
				...inspectorData
			},
			calendarData,
			errors,
			errorList,
			paginationDetails,
			specialisms,
			specialismTypes,
			caseTypes
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
	return '00703c'; // green (0-20 weeks)
}

/**
 *
 * @param {Case[]} cases
 * @param {string} sort - The sort criteria, can be 'distance', 'hybrid', or 'age'.
 * @returns
 */
export function sortCases(cases, sort) {
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
		caseStatus: c.caseStatus?.replace('_', ' '),
		finalCommentsDate: formatDateForDisplay(c.finalCommentsDate, { format: 'dd/MM/yyyy' }),
		caseAgeColor: getCaseColor(c.caseAge),
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
		previous: page > 1 ? { href: buildQueryString(params, page - 1) } : null,
		next: page < totalPages ? { href: buildQueryString(params, page + 1) } : null,
		items: createPaginationItems(page, totalPages, params)
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

/**
 * @param {number} page .
 * @param {number} totalPages
 * @param {Object} params
 * @returns {Array<Object>}
 */
export function createPaginationItems(page, totalPages, params) {
	const items = [];
	const addPage = (n) =>
		items.push({
			number: n,
			href: buildQueryString(params, n),
			current: page === n
		});
	const addEllipsis = () => items.push({ ellipsis: true, visuallyHiddenText: 'Ellipsis' });

	if (totalPages <= 7) {
		for (let i = 1; i <= totalPages; i++) addPage(i);
	} else {
		addPage(1);
		if (page > 4) addEllipsis();

		const start = Math.max(2, page - 2);
		const end = Math.min(totalPages - 1, page + 2);

		for (let i = start; i <= end; i++) addPage(i);

		if (page < totalPages - 3) addEllipsis();
		addPage(totalPages);
	}

	return items;
}
