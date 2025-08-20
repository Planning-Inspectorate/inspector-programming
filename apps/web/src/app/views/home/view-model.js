import {
	generateCalendar,
	generateDatesList,
	generateTimeList,
	generateWeekTitle,
	getWeekStartDate
} from '../../calendar/calendar.js';

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
