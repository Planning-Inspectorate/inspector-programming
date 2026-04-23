import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';

/**
 * Statuses before a case is validated
 *
 * @type {string[]}
 */
export const PRE_VALIDATION_APPEAL_STATUSES = [
	APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER,
	APPEAL_CASE_STATUS.VALIDATION,
	APPEAL_CASE_STATUS.READY_TO_START
];

/**
 * Statuses that are allowed to be in the unassigned case list - assignable statuses
 *
 * @type {string[]}
 */
export const ASSIGNABLE_APPEAL_STATUSES = [
	APPEAL_CASE_STATUS.AWAITING_EVENT,
	APPEAL_CASE_STATUS.FINAL_COMMENTS,
	APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE,
	APPEAL_CASE_STATUS.STATEMENTS
];

/**
 * end state appeal statuses
 *
 * @type {string[]}
 */
const END_STATE_APPEAL_STATUSES = [
	APPEAL_CASE_STATUS.COMPLETE,
	APPEAL_CASE_STATUS.INVALID,
	APPEAL_CASE_STATUS.CLOSED,
	APPEAL_CASE_STATUS.WITHDRAWN
];

/**
 * Statuses to filter out from the unassignable case list
 * @type {string[]}
 */
export const EXCLUDED_APPEAL_STATUSES = [...ASSIGNABLE_APPEAL_STATUSES, ...END_STATE_APPEAL_STATUSES];

/**
 * Filter a list of unassigned cases, keeping only those which are assignable or ended
 *
 * @param {import('../types').CaseViewModel[]} cases
 * @returns {import('../types').CaseViewModel[]}
 */
export function filterAssignableOrEndedStatuses(cases) {
	return cases.filter((item) => EXCLUDED_APPEAL_STATUSES.includes(item.caseStatus));
}

/**
 * Filter a list of unassigned cases, keeping only those at an assignable status
 *
 * @param {import('../types').CaseViewModel[]} cases
 * @returns {import('../types').CaseViewModel[]}
 */
export function filterAssignableCases(cases) {
	return cases.filter((item) => ASSIGNABLE_APPEAL_STATUSES.includes(item.caseStatus));
}
