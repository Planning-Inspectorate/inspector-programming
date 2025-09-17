import { readSessionData } from '@pins/inspector-programming-lib/util/session.js';
import {
	generateCalendar,
	generateDatesList,
	generateTimeList,
	generateWeekTitle,
	getWeekStartDate
} from '../../calendar/calendar.js';
import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';

/**
 * @param {string} [calendarStartDate]
 * @param {import("../../calendar/types.js").Event[]} [events]
 * @param {string} [error]
 * @returns {import('./types.js').CalendarViewModel}
 */
export function calendarViewModel(calendarStartDate, events, error) {
	const currentStartDate = calendarStartDate ? new Date(calendarStartDate.toString()) : getWeekStartDate(new Date());

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
	return {
		cases: cases.map(toCaseViewModel),
		assignmentDate: readSessionData(req, 'caseListData', 'assignmentDate', null, 'persistence')
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

	const arrayProps = ['allocationLevel', 'caseProcedure', 'caseSpecialisms', 'caseType', 'lpaRegion'];

	for (const arrayProp of arrayProps) {
		const value = query[`filters[${arrayProp}]`];
		if (value && (Array.isArray(value) || typeof value === 'string')) {
			filters.case[arrayProp] = value;
		}
	}

	const stringProps = ['minimumAge', 'maximumAge'];

	for (const stringProp of stringProps) {
		const value = query[`filters[${stringProp}]`];
		if (value) {
			filters.case[stringProp] = String(value);
		}
	}

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
