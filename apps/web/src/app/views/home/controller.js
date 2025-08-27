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
import { validateSorts } from '@pins/inspector-programming-lib/util/sorting.js';
import { addSessionData, readSessionData } from '@pins/inspector-programming-lib/util/session.js';
import { appealsViewModel, calendarViewModel, inspectorsViewModel } from './view-model.js';
import { paginationValues } from './pagination.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildViewHome(service) {
	return async (req, res) => {
		const inspectors = await getInspectorList(service, req.session);
		/** @type {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel | undefined} */
		const selectedInspector = inspectors.find((i) => req.query.inspectorId === i.id);
		const selectedInspectorDetails = await getInspectorDetails(service.db, selectedInspector?.id);

		// Convert the raw query string into a nested object
		const query = qs.parse(parseUrl(req.url).query || '');

		const lastSort = readSessionData(req, 'lastRequest', 'sort', 'age', 'persistence');

		const page = req.query.page && (query.sort || 'age') === lastSort ? parseInt(req.query.page) : 1;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

		//parse filters query param as expected Filters type
		let filters = normalizeFilters(query.filters);

		//validate filters
		const filterErrors = validateFilters(filters);
		const filterErrorList = Object.values(filterErrors);
		//if filters are invalid then apply none
		if (filterErrorList.length) filters = {};

		//validate sort
		const sortingErrors = validateSorts(String(query.sort), selectedInspector);
		const sortingErrorList = Object.values(sortingErrors).map((message) => ({ ...message, href: `#` }));
		//if sort is invalid then sort by age by default
		if (sortingErrorList.length) query.sort = 'age';

		const { cases, total } = await service.casesClient.getCases(
			filters,
			String(query.sort),
			page,
			limit,
			selectedInspector
		);

		const formData = {
			filters,
			limit,
			page,
			sort: req.query.sort || 'age',
			inspectorId: req.query.inspectorId
		};
		const paginationDetails = paginationValues(req, total, formData);

		const isCalendarTab = req.query.currentTab === 'calendar';
		const isInspectorTab = req.query.currentTab === 'inspector';

		/** @type {import('./types.js').HomeViewModel} */
		const viewModel = {
			pageHeading: 'Unassigned case list',
			containerClasses: 'pins-container-wide',
			title: 'Unassigned case list',
			errorSummary: [...filterErrorList, ...sortingErrorList],
			filters: {
				allocationLevels,
				caseTypes,
				specialisms,
				pagination: paginationDetails,
				query: {},
				errors: filterErrors
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
			data: formData,
      sortingErrors
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
