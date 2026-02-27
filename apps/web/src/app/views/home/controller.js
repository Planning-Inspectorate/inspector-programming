import { getInspectorList, mapInspectorToCaseSpecialisms } from '../../inspector/inspector.js';
import { allocationLevels, specialisms } from '../../specialism/specialism.js';
import {
	getNextWeekStartDate,
	getPreviousWeekStartDate,
	getWeekStartDate,
	getSimplifiedEvents
} from '../../calendar/calendar.js';
import { validateFilters } from '@pins/inspector-programming-lib/util/filtering.js';
import { validateSorts } from '@pins/inspector-programming-lib/util/sorting.js';
import { addSessionData, clearSessionData, readSessionData } from '@pins/inspector-programming-lib/util/session.js';
import {
	appealsViewModel,
	calendarViewModel,
	caseTypeOptions,
	filtersQueryViewModel,
	inspectorsViewModel
} from './view-model.js';
import { paginationValues } from './pagination.js';

/**
 * @param {import('#service').WebService} service
 * @param {Function} [getEventsFunction] Optional. Used for testing to inject a custom getSimplifiedEvents function.
 * @returns {import('express').Handler}
 */
export function buildViewHome(service, getEventsFunction) {
	return async (req, res) => {
		const inspectors = await getInspectorList(service, req.session);
		const inspectorId = req.query.inspectorId
			? req.query.inspectorId
			: readSessionData(req, 'caseListData', 'inspectorId', null, 'persistence');
		/** @type {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel | undefined} */
		const selectedInspector = inspectors.find((i) => inspectorId === i.id);
		const selectedInspectorDetails = await service.inspectorClient.getInspectorDetails(selectedInspector?.id);
		const selectedInspectorSpecialisms =
			selectedInspectorDetails?.Specialisms?.map((specialism) => specialism.name) || [];

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

		// Get current query params from request object
		const queryParams = new URLSearchParams(req.query);

		//Track previous inspectorId from last request to detect change when action param missing
		const previousInspectorId = readSessionData(req, 'lastRequest', 'inspectorId', null, 'persistence');
		addSessionData(req, 'lastRequest', { inspectorId: inspectorId }, 'persistence');
		const inspectorSelectionChanged = inspectorId && previousInspectorId !== inspectorId;

		if (inspectorSelectionChanged) {
			try {
				const mappedSpecialisms = await mapInspectorToCaseSpecialisms(service, selectedInspectorSpecialisms);
				if (mappedSpecialisms.length) {
					filterQuery.case.caseSpecialisms = mappedSpecialisms;
				} else {
					delete filterQuery.case.caseSpecialisms;
				}
			} catch (error) {
				service.logger.error(
					error,
					`Failed to retrieve the case specialism mapping associated with inspector: ${inspectorId}`
				);

				return res.render('views/errors/500.njk', {
					bodyCopy: 'Try again later. Failed to retrieve the case specialism mapping associated with the inspector',
					queryParams: queryParams
				});
			}

			const newQueryParams = new URLSearchParams(req.query);

			newQueryParams.delete('filters[caseSpecialisms]');
			if (filterQuery.case.caseSpecialisms) {
				for (const specialism of filterQuery.case.caseSpecialisms) {
					newQueryParams.append('filters[caseSpecialisms]', specialism);
				}
			}

			const currentQueryString = queryParams.toString();
			const desiredQueryString = newQueryParams.toString();

			if (currentQueryString !== desiredQueryString) {
				return res.redirect(`/?${desiredQueryString}`);
			}
		}

		// validate sort
		const sortingErrorList = validateSorts(filterQuery.sort, selectedInspector);
		//if sort is invalid then sort by age by default
		if (sortingErrorList.length) filterQuery.sort = 'age';

		const { cases, total, page } = await service.casesClient.getCases(
			filterQuery.case,
			filterQuery.sort,
			filterQuery.page,
			filterQuery.limit
		);
		filterQuery.page = page; //update displayed page after validating against number of results

		const paginationDetails = paginationValues(req, total, filterQuery);

		const isCalendarTab = req.query.currentTab === 'calendar';
		const isInspectorTab = req.query.currentTab === 'inspector';

		const selectedCaseIds = readSessionData(req, 'caseListData', 'selectedCases', [], 'persistence');
		for (let caseId of selectedCaseIds) {
			let caseIndex = cases.findIndex((item) => item.caseId == parseInt(caseId));
			if (caseIndex != -1) {
				cases[caseIndex].selected = true;
			}
		}

		// get output from /cases
		const selectInspectorError = readSessionData(req, 'errors', 'selectInspectorError', false, 'persistence');
		const successSummary = readSessionData(req, 'success', 'successSummary', null, 'persistence');

		const appeals = appealsViewModel(cases, req);

		/** @type {import('./types.js').HomeViewModel} */
		const viewModel = {
			pageHeading: 'Unassigned case list',
			containerClasses: 'pins-container-wide',
			title: 'Unassigned case list',
			errorSummary: [...filterErrorList, ...sortingErrorList],
			filters: {
				allocationLevels,
				specialisms,
				caseTypes: caseTypeOptions,
				pagination: paginationDetails,
				query: filterQuery,
				errors: filterErrors,
				buildUrlWithoutFilter: filterQuery.buildUrlWithoutFilter,
				clearFiltersUrl: filterQuery.clearFiltersUrl
			},
			appeals,
			inspectors: inspectorsViewModel(
				inspectors,
				selectedInspectorDetails,
				isCalendarTab || isInspectorTab || selectInspectorError || sortingErrorList.length > 0
			),
			map: {
				apiKey: service.osMapsApiKey
			},
			successSummary
		};
		const currentWeekStart = req.query.calendarStartDate
			? new Date(req.query.calendarStartDate.toString())
			: getWeekStartDate(new Date());

		/**
		 * @type {import("../../calendar/types.js").Event[]}
		 */
		let calendarEvents = [];
		let calendarError;

		if (selectedInspector) {
			try {
				const weekStartDate = new Date(currentWeekStart);
				const weekEndDate = new Date(currentWeekStart);
				weekEndDate.setDate(weekEndDate.getDate() + 6);
				weekEndDate.setHours(23, 59, 59, 999);
				const eventsFn = getEventsFunction || getSimplifiedEvents;
				calendarEvents = await eventsFn(
					service.entraClient,
					selectedInspector,
					req.session,
					service.logger,
					weekStartDate,
					weekEndDate
				);
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
		} else if (isCalendarTab || isInspectorTab || selectInspectorError) {
			calendarError = '';
			viewModel.errorSummary.push({
				text: 'Select an inspector',
				href: '#inspectors'
			});
		}

		if (appeals.assignmentDateError) {
			viewModel.errorSummary?.push({
				text: appeals.assignmentDateError,
				href: '#assignment-date'
			});
		}

		if (appeals.caseListError) {
			viewModel.errorSummary?.push({
				text: appeals.caseListError,
				href: '#caseListError'
			});
		}

		const assignedCasesError = readSessionData(req, 'errors', 'assignedCasesError', null, 'persistence');
		if (assignedCasesError) {
			viewModel.errorSummary?.push({
				text: assignedCasesError,
				href: ''
			});
		}

		viewModel.calendar = calendarViewModel(currentWeekStart, calendarEvents, calendarError);

		//after finishing with page filters and settings, persist lastRequest in session for future reference
		addSessionData(req, 'lastRequest', { sort: filterQuery.sort, inspectorId: inspectorId || null }, 'persistence');
		addSessionData(req, 'lastRequest', { queryParams: queryParams.toString() }, 'persistence');

		//clear session data passed on from /cases
		clearSessionData(req, 'caseListData', ['selectedCases', 'inspectorId', 'assignmentDate'], 'persistence');
		clearSessionData(
			req,
			'errors',
			['caseListError', 'selectInspectorError', 'selectAssignmentDateError', 'assignedCasesError'],
			'persistence'
		);
		clearSessionData(req, 'success', ['successSummary'], 'persistence');

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
		} else if (req.body.newStartDate) {
			const date = new Date(req.body.newStartDate);
			newStartDate = getWeekStartDate(date);
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
