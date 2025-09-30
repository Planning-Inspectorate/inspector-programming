import { parse, isValid as isValidDate, format, startOfDay } from 'date-fns';

// Accepted input patterns
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // yyyy-MM-dd
const UK_DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/; // dd/MM/yyyy

// Error messages
const ERROR_INVALID = 'Select a valid date';
const ERROR_PAST = 'Select a future date';

/**
 * @typedef {{ error: string | null; date: string | null }} ValidationResult
 */

/**
 * Validate an assignment date provided as a string (ISO yyyy-MM-dd or UK dd/MM/yyyy)
 * @param {string} raw
 * @returns {ValidationResult}
 */
export function validateAssignmentDate(raw) {
	const now = new Date();
	const today = startOfDay(now);

	const value = raw.trim();
	if (value.length !== 10) return invalid();

	// disallow non-numeric characters (apart from separators)
	if (!/^[0-9/-]+$/.test(value)) return invalid();

	let fmt;
	if (ISO_DATE_REGEX.test(value)) fmt = 'yyyy-MM-dd';
	else if (UK_DATE_REGEX.test(value)) fmt = 'dd/MM/yyyy';
	else return invalid();

	const parsed = parse(value, fmt, new Date());
	if (!isValidDate(parsed) || format(parsed, fmt) !== value) return invalid();
	const date = startOfDay(parsed);

	return date < today ? past() : ok(date);
}

// --- Result helpers ---
function invalid() {
	return { error: ERROR_INVALID, date: null };
}
function past() {
	return { error: ERROR_PAST, date: null };
}
/**
 * @param {Date} date
 * @returns {ValidationResult}
 */
function ok(date) {
	return { error: null, date: format(date, 'yyyy-MM-dd') };
}
