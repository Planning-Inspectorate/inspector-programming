import { formatInTimeZone } from 'date-fns-tz';
import { isValid } from 'date-fns';

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
