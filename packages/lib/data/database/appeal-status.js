import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';

/**
 * Statuses to filter out from the case list
 * @type {string[]}
 */
export const EXCLUDED_APPEAL_STATUSES = [APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER, APPEAL_CASE_STATUS.VALIDATION];

/**
 * Filter a list of cases, removing those not at an assignable status
 *
 * @param {import('../types').CaseViewModel[]} cases
 * @returns {import('../types').CaseViewModel[]}
 */
export function filterExcludedStatuses(cases) {
	return cases.filter((item) => !EXCLUDED_APPEAL_STATUSES.includes(item.caseStatus));
}
