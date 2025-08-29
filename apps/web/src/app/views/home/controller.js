import { getInspectorDetails, getInspectorList } from '../../inspector/inspector.js';
import { allocationLevels, caseTypes, specialisms } from '../../specialism/specialism.js';
import {
	getNextWeekStartDate,
	getPreviousWeekStartDate,
	getSimplifiedEvents,
	getWeekStartDate
} from '../../calendar/calendar.js';
import { validateFilters } from '@pins/inspector-programming-lib/util/filtering.js';
import { validateSorts } from '@pins/inspector-programming-lib/util/sorting.js';
import { addSessionData, readSessionData } from '@pins/inspector-programming-lib/util/session.js';
import { appealsViewModel, calendarViewModel, filtersQueryViewModel, inspectorsViewModel } from './view-model.js';
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

		const lastSort = readSessionData(req, 'lastRequest', 'sort', 'age', 'persistence');
		const filterQuery = filtersQueryViewModel(req.query, lastSort);

		// validate filters and return any errors to client
		const filterErrors = validateFilters(filterQuery);
		const filterErrorList = Object.values(filterErrors);
		// if any filters are invalid then apply none
		if (filterErrorList.length > 0 || !filterQuery.case) {
			filterQuery.case = {};
		}

		if (selectedInspectorDetails) {
			filterQuery.case.inspectorCoordinates = {
				lat: selectedInspectorDetails.latitude,
				lng: selectedInspectorDetails.longitude
			};
		}

		// validate sort
		const sortingErrorList = validateSorts(filterQuery.sort, selectedInspector);
		//if sort is invalid then sort by age by default
		if (sortingErrorList.length) filterQuery.sort = 'age';

		const { cases, total } = await service.casesClient.getCases(
			filterQuery.case,
			filterQuery.sort,
			filterQuery.page,
			filterQuery.limit,
			selectedInspector
		);

		const paginationDetails = paginationValues(req, total, filterQuery);

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
				query: filterQuery,
				errors: filterErrors
			},
			appeals: appealsViewModel(cases),
			inspectors: inspectorsViewModel(
				inspectors,
				selectedInspectorDetails,
				isCalendarTab || isInspectorTab || sortingErrorList.length > 0
			),
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
		addSessionData(req, 'lastRequest', { sort: filterQuery.sort }, 'persistence');

		return res.render('views/home/view.njk', viewModel);
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
