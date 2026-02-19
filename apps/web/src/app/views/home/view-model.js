import { readSessionData } from '@pins/inspector-programming-lib/util/session.js';
import { generateCalendar, generateDatesList, generateTimeList, generateWeekTitle } from '../../calendar/calendar.js';
import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';

/**
 * @param {Date} currentStartDate
 * @param {import("../../calendar/types.js").Event[]} [events]
 * @param {string} [error]
 * @returns {import('./types.js').CalendarViewModel}
 */
export function calendarViewModel(currentStartDate, events, error) {
	return {
		currentStartDate,
		dates: generateDatesList(currentStartDate),
		grid: generateCalendar(currentStartDate, events),
		times: generateTimeList(8, 18),
		weekTitle: generateWeekTitle(currentStartDate),
		error
	};
}

/**
 * @param {import('@pins/inspector-programming-lib/data/types.js').CaseViewModel[]} cases
 * @param {import('express').Request} req
 * @returns {import('./types.js').AppealsViewModel}
 */
export function appealsViewModel(cases, req) {
	// get errors output from /cases
	const caseListError = readSessionData(req, 'errors', 'caseListError', null, 'persistence');
	const selectAssignmentDateError = readSessionData(req, 'errors', 'selectAssignmentDateError', false, 'persistence');

	// calculate min date (today) for input element
	const today = new Date();
	const assignmentDateMin = today.toISOString().split('T')[0];

	return {
		cases: cases.map(toCaseViewModel),
		assignmentDate: readSessionData(req, 'caseListData', 'assignmentDate', null, 'persistence'),
		caseListError,
		assignmentDateError: selectAssignmentDateError ? selectAssignmentDateError : undefined,
		assignmentDateMin
	};
}

/**
 * Populate some view model fields
 * @param {import('@pins/inspector-programming-lib/data/types.js').CaseViewModel} c
 * @returns {import('@pins/inspector-programming-lib/data/types.js').CaseViewModel}
 */
export function toCaseViewModel(c) {
	return {
		...c,
		caseStatus: c.caseStatus?.replace('_', ' '),
		finalCommentsDate: formatDateForDisplay(c.finalCommentsDate, { format: 'dd/MM/yyyy' }),
		caseAgeColor: getCaseColor(c.caseAge)
	};
}

/**
 * Determines the color code based on the age of the case.
 * @param {number} caseAge
 * @returns
 */
export function getCaseColor(caseAge) {
	if (caseAge > 40) return 'd4351c'; // red (41+ weeks)
	if (caseAge > 20) return 'f47738'; // orange (21-40 weeks)
	return '00703c'; // green (0-20 weeks)
}

/**
 * Appends parameter to URLSearchParams
 * @param {URLSearchParams} searchParams
 * @param {string} key
 * @param {string | number | Array<string | number>} value
 */
function appendParam(searchParams, key, value) {
	if (Array.isArray(value)) {
		value.forEach((v) => searchParams.append(key, v));
	} else if (value !== undefined && value !== null) {
		searchParams.append(key, value);
	}
}

/**
 * Builds URLSearchParams from query object
 * @param {import('qs').ParsedQs} query - Query parameters object
 * @returns {URLSearchParams}
 */
function buildSearchParams(query) {
	const searchParams = new URLSearchParams();
	Object.entries(query).forEach(([key, value]) => {
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			Object.entries(value).forEach(([nestedKey, nestedValue]) => {
				appendParam(searchParams, `${key}[${nestedKey}]`, nestedValue);
			});
		} else {
			appendParam(searchParams, key, value);
		}
	});
	return searchParams;
}

/**
 * Builds a URL with a specific filter removed
 * @param {import('qs').ParsedQs} currentQuery - Current query parameters
 * @param {string} keyType - Type of filter to remove (e.g., 'lpaRegion', 'caseSpecialisms', 'minimumAge')
 * @param {string} [valueToRemove]
 * @returns {string}
 */
function buildUrlWithoutFilter(currentQuery, keyType, valueToRemove) {
	const searchParams = buildSearchParams(currentQuery);
	const filterKey = `filters[${keyType}]`;
	searchParams.delete(filterKey, valueToRemove);

	// Reset to page 1 when filters change to avoid empty results
	searchParams.set('page', '1');

	return '?' + searchParams.toString();
}

/**
 * Builds the clear filters URL (removes all filter parameters)
 * @param {import('qs').ParsedQs} currentQuery - Current query parameters
 * @returns {string} URL with all filters cleared
 */
function buildClearFiltersUrl(currentQuery) {
	const baseQuery = {};

	// Preserve non-filter parameters
	if (currentQuery.inspectorId) baseQuery.inspectorId = currentQuery.inspectorId;
	if (currentQuery.limit) baseQuery.limit = currentQuery.limit;
	if (currentQuery.sort) baseQuery.sort = currentQuery.sort;
	// Reset to page 1 when filters change to avoid empty results
	baseQuery.page = '1';

	return '?' + buildSearchParams(baseQuery).toString();
}

/**
 * @param {import('qs').ParsedQs} query
 * @param {string} [previousSort]
 * @returns {import('@pins/inspector-programming-lib/data/types.js').FilterQuery}
 */
export function filtersQueryViewModel(query, previousSort) {
	/** @type {import('@pins/inspector-programming-lib/data/types.js').FilterQuery} */
	const filters = {
		page: query.page ? Number(query.page) : 1,
		limit: query.limit ? Number(query.limit) : 10,
		sort: query.sort ? String(query.sort) : 'age',
		case: {}
	};

	if (query.inspectorId) {
		filters.inspectorId = String(query.inspectorId);
	}

	if (previousSort !== filters.sort) {
		// reset to first page if sort has changed
		filters.page = 1;
	}

	const arrayProps = ['caseSpecialisms', 'lpaRegion', 'caseTypes', 'allocationLevels'];

	for (const arrayProp of arrayProps) {
		const value = query[`filters[${arrayProp}]`];
		const isArray = Array.isArray(value);
		if (value && (isArray || typeof value === 'string')) {
			// Ensure we use exact matching
			filters.case[arrayProp] = isArray ? value : [value];
		}
	}

	const stringProps = ['minimumAge', 'maximumAge'];

	for (const stringProp of stringProps) {
		const value = query[`filters[${stringProp}]`];
		if (value) {
			filters.case[stringProp] = String(value);
		}
	}

	filters.buildUrlWithoutFilter = (keyType, valueToRemove) => buildUrlWithoutFilter(query, keyType, valueToRemove);
	filters.clearFiltersUrl = buildClearFiltersUrl(query);

	return filters;
}

/**
 * @param {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel[]} inspectors
 * @param {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel} [selectedInspector]
 * @param {boolean} [showError]
 * @returns {import('./types.js').InspectorsViewModel}
 */
export function inspectorsViewModel(inspectors, selectedInspector, showError) {
	let error;
	if (!selectedInspector && showError) {
		error = 'Select an inspector';
	}

	return {
		list: inspectors,
		selected: toInspectorViewModel(selectedInspector),
		error
	};
}

/**
 * @param {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel} [inspector]
 * @returns {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel|undefined}
 */
export function toInspectorViewModel(inspector) {
	if (!inspector) {
		return inspector;
	}
	const specialisms = inspector.Specialisms || [];
	return {
		...inspector,
		specialisms: specialisms.map((s) => ({
			...s,
			validFrom: formatDateForDisplay(s.validFrom, { format: 'dd/MM/yyyy' })
		})),
		specialismsList: specialisms.map((specialism) => specialism.name).join(', ')
	};
}
