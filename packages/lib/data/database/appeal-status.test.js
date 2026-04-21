import { describe, it } from 'node:test';
import assert from 'node:assert';
import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';
import { filterExcludedStatuses, filterAssignableCases } from './appeal-status.js';

describe('appeal-status', () => {
	describe('filterExcludedStatuses', () => {
		it('should return all cases when none are excluded', () => {
			const inputCases = [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.READY_TO_START },
				{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.ISSUE_DETERMINATION }
			];

			const results = filterExcludedStatuses(inputCases);

			assert.deepStrictEqual(results, inputCases);
		});

		it('should filter out excluded statuses', () => {
			const inputCases = [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER },
				{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.AWAITING_EVENT },
				{ caseId: 3, caseStatus: APPEAL_CASE_STATUS.READY_TO_START }
			];

			const results = filterExcludedStatuses(inputCases);

			assert.deepStrictEqual(results, [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER },
				{ caseId: 3, caseStatus: APPEAL_CASE_STATUS.READY_TO_START }
			]);
		});

		it('should return empty array when all cases are excluded', () => {
			const inputCases = [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE },
				{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.WITHDRAWN },
				{ caseId: 3, caseStatus: APPEAL_CASE_STATUS.CLOSED }
			];

			const results = filterExcludedStatuses(inputCases);

			assert.deepStrictEqual(results, []);
		});
	});

	describe('filterAssignableCases', () => {
		it('should return only cases with allowed statuses', () => {
			const inputCases = [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.AWAITING_EVENT },
				{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.CLOSED },
				{ caseId: 3, caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE }
			];

			const results = filterAssignableCases(inputCases);

			assert.deepStrictEqual(results, [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.AWAITING_EVENT },
				{ caseId: 3, caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE }
			]);
		});

		it('should return all cases when all have allowed statuses', () => {
			const inputCases = [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.FINAL_COMMENTS },
				{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.STATEMENTS }
			];

			const results = filterAssignableCases(inputCases);

			assert.deepStrictEqual(results, inputCases);
		});

		it('should return empty array when no cases have allowed statuses', () => {
			const inputCases = [
				{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.CLOSED },
				{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.WITHDRAWN }
			];

			const results = filterAssignableCases(inputCases);

			assert.deepStrictEqual(results, []);
		});

		it('should return empty array for empty input', () => {
			const results = filterAssignableCases([]);
			assert.deepStrictEqual(results, []);
		});
	});
});
