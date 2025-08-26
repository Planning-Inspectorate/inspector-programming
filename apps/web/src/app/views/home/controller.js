import { getInspectorDetails, getInspectorList } from '../../inspector/inspector.js';
import qs from 'qs';
import { allocationLevels, caseTypes, specialisms } from '../../specialism/specialism.js';
import {
	getNextWeekStartDate,
	getPreviousWeekStartDate,
	getSimplifiedEvents,
	getWeekStartDate
} from '../../calendar/calendar.js';
import { parse as parseUrl } from 'url';
import { normalizeFilters, validateFilters } from '@pins/inspector-programming-lib/util/filtering.js';
import { addSessionData, readSessionData } from '@pins/inspector-programming-lib/util/session.js';
import { appealsViewModel, calendarViewModel, inspectorsViewModel } from './view-model.js';

/**
 * @typedef {Object} PageData
 * @property {import('@pins/inspector-programming-lib/data/types.js').Filters} filters
 * @property {number} limit
 * @property {number} page
 * @property {string} sort
 * @property {string} inspectorId
 */

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildViewHome(service) {
	return async (req, res) => {
		const inspectors = await getInspectorList(service, req.session);
		const selectedInspector = inspectors.find((i) => req.query.inspectorId === i.id);
		const selectedInspectorDetails = await getInspectorDetails(service.db, selectedInspector?.id);

		// Convert the raw query string into a nested object
		const query = qs.parse(parseUrl(req.url).query || '');

		const lastSort = readSessionData(req, 'lastRequest', 'sort', 'age', 'persistence');

		//fetch total cases count early to help determine page number - cached cases will be used for the subsequent getCases call
		const total = await service.casesClient.getCasesCount();
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
		/** @type {string} */
		const sort = query.sort ? String(query.sort) : 'age';

		const page = determinePage(Number(query.page), sort, lastSort, getTotalPages(total, limit));

		//parse filters query param as expected Filters type
		let filters = normalizeFilters(query.filters);
		//validate filters and return any errors to client
		const filterErrors = validateFilters(filters);
		const filterErrorList = Object.values(filterErrors);
		//if filters are invalid then apply none
		if (filterErrorList.length) filters = {};

		const { cases } = await service.casesClient.getCases(filters, sort, page, limit);

		/** @type { PageData } */
		const pageData = {
			filters,
			limit,
			page,
			sort: sort,
			inspectorId: req.query.inspectorId
		};
		const paginationDetails = handlePagination(req, total, pageData);

		const isCalendarTab = req.query.currentTab === 'calendar';
		const isInspectorTab = req.query.currentTab === 'inspector';

		/** @type {import('./types.js').HomeViewModel} */
		const viewModel = {
			pageHeading: 'Unassigned case list',
			containerClasses: 'pins-container-wide',
			title: 'Unassigned case list',
			errorSummary: [...filterErrorList],
			filters: {
				allocationLevels,
				caseTypes,
				specialisms,
				pagination: paginationDetails,
				query: {}
			},
			appeals: appealsViewModel(cases),
			inspectors: inspectorsViewModel(inspectors, selectedInspectorDetails, isCalendarTab || isInspectorTab),
			map: {
				apiKey: service.osMapsApiKey
			}
		};

		/**
		 * @type {import("../../calendar/types.js").Event[]}
		 */
		let calendarEvents = [];
		let calendarError;

		if (selectedInspector) {
			try {
				calendarEvents = await getSimplifiedEvents(service.entraClient, selectedInspector, req.session, service.logger);
			} catch (error) {
				service.logger.error(error, 'Failed to fetch calendar events');
				calendarError = 'Contact Inspector to ensure this calendar is shared with you';
				if (isCalendarTab) {
					viewModel.errorSummary.push({
						text: calendarError,
						href: '#calendarError'
					});
				}
			}
		} else if (isCalendarTab || isInspectorTab) {
			calendarError = '';
			viewModel.errorSummary.push({
				text: 'Select an inspector',
				href: '#inspectors'
			});
		}

		viewModel.calendar = calendarViewModel(req.query.calendarStartDate, calendarEvents, calendarError);

		//after finishing with page filters and settings, persist lastRequest in session for future reference
		addSessionData(req, 'lastRequest', { sort: query.sort }, 'persistence');

		return res.render('views/home/view.njk', {
			...viewModel,
			data: pageData,
			filterErrors,
			paginationDetails,
			specialisms,
			specialismTypes: allocationLevels,
			caseTypes
		});
	};
}

/**
 * Determines the current page number by validating the requested page against the total pages and the request parameters.
 * @param {number} requestedPage
 * @param {string} requestedSort
 * @param {string} lastSort
 * @param {number} totalPages
 * @returns {number}
 */
function determinePage(requestedPage, requestedSort, lastSort, totalPages) {
	if (!requestedPage) return 1;
	//if user has changed sort criteria, reset to page 1
	if ((requestedSort || 'age') !== lastSort) return 1;
	//if desired page exceeds total pages, fallback to highest available page
	if (requestedPage > totalPages) return totalPages;
	return +requestedPage;
}

export function buildPostHome(service) {
	return async (req, res) => {
		service.logger.info('post home');

		const currentDate = req.body.currentStartDate ? new Date(req.body.currentStartDate) : new Date();
		currentDate.setHours(0, 0, 0, 0);

		let newStartDate;

		if (req.body.calendarAction == 'prevWeek') {
			newStartDate = getPreviousWeekStartDate(currentDate);
		} else if (req.body.calendarAction == 'nextWeek') {
			newStartDate = getNextWeekStartDate(currentDate);
		} else {
			const today = new Date();
			newStartDate = getWeekStartDate(today);
		}

		const redirectUrl =
			req.body.action === 'view'
				? `/inspector/${req.body.inspectorId}`
				: `/?inspectorId=${req.body.inspectorId}&calendarStartDate=${newStartDate}`;

		return res.redirect(redirectUrl);
	};
}

/**
 * @param {import('express').Request} req
 * @param {number} total
 * @param {PageData} pageData
 * @returns {import('#util/types.js').Pagination}
 */
export function handlePagination(req, total, pageData) {
	const page = pageData.page;
	const limit = pageData.limit;
	const totalPages = getTotalPages(total, limit);

	const params = { ...req.query, page: undefined };

	return {
		previous: page > 1 ? { href: buildQueryString(params, page - 1) } : null,
		next: page < totalPages ? { href: buildQueryString(params, page + 1) } : null,
		items: createPaginationItems(page, totalPages, params)
	};
}

/**
 * Gets total number of pages based on total items and limit per page
 * @param {number} total
 * @param {number} limit
 * @return {number}
 */
function getTotalPages(total, limit) {
	return Math.max(1, Math.ceil(total / limit));
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
