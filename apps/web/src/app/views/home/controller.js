import { getInspectorList } from '../../inspector/inspector.js';
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
import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';
import { appealsViewModel, calendarViewModel } from './view-model.js';

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
				where: { entraId: selectedInspector.id },
				include: {
					Specialisms: true
				}
			}));

		//format validFrom date on inspector specialisms using formatDateForDisplay
		if (inspectorData && inspectorData.Specialisms) {
			inspectorData.Specialisms = inspectorData.Specialisms.map((s) => ({
				...s,
				validFrom: formatDateForDisplay(s.validFrom, { format: 'dd/MM/yyyy' })
			}));
			inspectorData.caseSpecialisms = inspectorData.Specialisms.map((specialism) => specialism.name).join(', ');
		}

		// Convert the raw query string into a nested object
		const query = qs.parse(parseUrl(req.url).query || '');

		const lastSort = readSessionData(req, 'lastRequest', 'sort', 'age', 'persistence');

		const page = req.query.page && (query.sort || 'age') === lastSort ? parseInt(req.query.page) : 1;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

		//parse filters query param as expected Filters type
		let filters = normalizeFilters(query.filters);
		//validate filters and return any errors to client
		const filterErrors = validateFilters(filters);
		const filterErrorList = Object.values(filterErrors).map((message) => ({ ...message, href: `#` }));
		//if filters are invalid then apply none
		if (filterErrorList.length) filters = {};

		const { cases, total } = await service.casesClient.getCases(filters, String(query.sort), page, limit);

		const formData = {
			filters,
			limit,
			page,
			sort: req.query.sort || 'age',
			inspectorId: req.query.inspectorId
		};
		const paginationDetails = handlePagination(req, total, formData);

		/** @type {import('./types.js').HomeViewModel} */
		const viewModel = {
			pageHeading: 'Unassigned case list',
			containerClasses: 'pins-container-wide',
			title: 'Unassigned case list',
			errorSummary: [],
			filters: {
				allocationLevels,
				caseTypes,
				specialisms,
				pagination: paginationDetails,
				query: {}
			},
			appeals: appealsViewModel(cases)
		};

		/**
		 * @type {import("../../calendar/types.js").Event[]}
		 */
		let calendarEvents = [];
		let calendarError;
		let inspectorError;

		if (selectedInspector) {
			try {
				calendarEvents = await getSimplifiedEvents(service.entraClient, selectedInspector, req.session, service.logger);
			} catch (error) {
				service.logger.error(error, 'Failed to fetch calendar events');
				calendarError = 'Contact Inspector to ensure this calendar is shared with you';
				if (req.query.currentTab == 'calendar') {
					viewModel.errorSummary.push({
						text: calendarError,
						href: '#calendarError'
					});
				}
			}
		} else if (['calendar', 'inspector'].includes(req.query.currentTab)) {
			calendarError = '';
      inspectorError = 'Select an inspector';
			viewModel.errorSummary.push({
				text: inspectorError,
				href: '#inspectors'
			});
		}

		viewModel.calendar = calendarViewModel(req.query.calendarStartDate, calendarEvents, calendarError);

		//after finishing with page filters and settings, persist lastRequest in session for future reference
		addSessionData(req, 'lastRequest', { sort: query.sort }, 'persistence');

		return res.render('views/home/view.njk', {
			...viewModel,
			inspectors,
			data: formData,
			apiKey: service.osMapsApiKey,
			inspectorPin: {
				...selectedInspector,
				...inspectorData
			},
      filterErrors,
      filterErrorList,
			paginationDetails,
			specialisms,
			specialismTypes: allocationLevels,
			caseTypes,
      inspectorError
		});
	};
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
 * @param {{page: number, limit: number}} formData
 * @returns {import('#util/types.js').Pagination}
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
