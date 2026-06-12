import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { isValid, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

const ukTimeZone = 'Europe/London';

/**
 * @param {Date|string} date
 * @param {Object} options
 * @param {string} [options.format]
 * @returns {string}
 */
export function formatDateForDisplay(date, { format = 'd MMM yyyy' } = { format: 'd MMM yyyy' }) {
	if (!date || !isValid(new Date(date))) return '';

	return formatInTimeZone(date, ukTimeZone, format);
}

/**
 * Get the date range for the previous week (Monday to Sunday) in Europe/London timezone
 * @param {Date} [referenceDate] - Reference date to calculate from (defaults to current date)
 * @returns {{weekStart: Date, weekEnd: Date}} - UTC dates representing Monday 00:00 and Sunday 23:59:59.999 in Europe/London
 */
export function getPreviousWeekRange(referenceDate = new Date()) {
	// Convert the UTC reference date to Europe/London wall-clock time
	const zonedReferenceDate = toZonedTime(referenceDate, ukTimeZone);

	// Get the Monday of the current week in Europe/London time
	const currentWeekStart = startOfWeek(zonedReferenceDate, { weekStartsOn: 1 }); // 1 = Monday

	// Get the previous Monday
	const previousWeekStart = subWeeks(currentWeekStart, 1);

	// Get the Sunday of the previous week
	const previousWeekEnd = endOfWeek(previousWeekStart, { weekStartsOn: 1 });

	// Convert both back to UTC instants
	return {
		weekStart: fromZonedTime(previousWeekStart, ukTimeZone),
		weekEnd: fromZonedTime(previousWeekEnd, ukTimeZone)
	};
}
