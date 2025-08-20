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
 * @returns {import('./types.js').AppealsViewModel}
 */
export function appealsViewModel(cases) {
	return {
		cases: cases.map(toCaseViewModel)
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

export function getCaseColor(caseAge) {
	if (caseAge > 40) return 'd4351c'; // red (41+ weeks)
	if (caseAge > 20) return 'f47738'; // orange (21-40 weeks)
	return '00703c'; // green (0-20 weeks)
}
