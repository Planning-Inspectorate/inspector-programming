import { describe, it } from 'node:test';
import assert from 'node:assert';
import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';
import { filterExcludedStatuses } from './appeal-status.js';

describe('appeal-status', () => {
	describe('filterExcludedStatuses', () => {
		it('should return all cases when none are excluded', () => {
			const inputCases = [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.READY_TO_START },
				{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE }
			];

			const results = filterExcludedStatuses(inputCases);

			assert.deepStrictEqual(results, inputCases);
		});

		it('should filter out excluded statuses', () => {
			const inputCases = [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER },
				{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.VALIDATION },
				{ caseId: 3, caseStatus: APPEAL_CASE_STATUS.READY_TO_START }
			];

			const results = filterExcludedStatuses(inputCases);

			assert.deepStrictEqual(results, [{ caseId: 3, caseStatus: APPEAL_CASE_STATUS.READY_TO_START }]);
		});

		it('should return empty array when all cases are excluded', () => {
			const inputCases = [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER },
				{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.VALIDATION }
			];

			const results = filterExcludedStatuses(inputCases);

			assert.deepStrictEqual(results, []);
		});
	});
});
