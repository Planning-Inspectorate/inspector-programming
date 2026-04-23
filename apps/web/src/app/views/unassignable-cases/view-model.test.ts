// @ts-nocheck
import { describe, test } from 'node:test';
import assert from 'assert';
import { getUnassignableReason, toUnassignableCaseListViewModel, UNASSIGNABLE_REASON } from './view-model.ts';
import { APPEAL_CASE_PROCEDURE, APPEAL_CASE_STATUS, APPEAL_CASE_TYPE } from '@planning-inspectorate/data-model';

describe('view-model', () => {
	describe('toUnassignableCaseListViewModel', () => {
		test('should use default pagination', () => {
			const viewModel = toUnassignableCaseListViewModel({}, [], []);
			assert.strictEqual(viewModel.pagination.page, 1);
			assert.strictEqual(viewModel.pagination.limit, 25);
			assert.strictEqual(viewModel.pagination.total, 0);
		});
	});
	describe('getUnassignableReason', () => {
		test('should support not validated', () => {
			const reason = getUnassignableReason(
				{
					caseStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER
				},
				[]
			);
			assert.strictEqual(reason, UNASSIGNABLE_REASON.NOT_VALIDATED);
		});
		test('should support not assignable status', () => {
			const reason = getUnassignableReason(
				{
					caseStatus: APPEAL_CASE_STATUS.EVENT
				},
				[]
			);
			assert.strictEqual(reason, UNASSIGNABLE_REASON.NOT_ASSIGNABLE_STATUS);
		});
		test('should support missing allocation', () => {
			const reason = getUnassignableReason(
				{
					caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE
				},
				[]
			);
			assert.strictEqual(reason, UNASSIGNABLE_REASON.MISSING_ALLOCATION);
		});
		test('should support no timing rule for case type', () => {
			const reason = getUnassignableReason(
				{
					caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE,
					caseLevel: 'H',
					caseType: APPEAL_CASE_TYPE.D
				},
				[
					{
						caseType: APPEAL_CASE_TYPE.ZA
					}
				]
			);
			assert.strictEqual(reason, UNASSIGNABLE_REASON.NOT_SUPPORTED_CASE_TYPE);
		});
		test('should support no timing rule for procedure', () => {
			const reason = getUnassignableReason(
				{
					caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE,
					caseLevel: 'H',
					caseType: APPEAL_CASE_TYPE.D,
					caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN
				},
				[
					{
						caseType: APPEAL_CASE_TYPE.D
					}
				]
			);
			assert.strictEqual(reason, UNASSIGNABLE_REASON.NOT_SUPPORTED_PROCEDURE);
		});
		test('should support no timing rule for allocation', () => {
			const reason = getUnassignableReason(
				{
					caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE,
					caseLevel: 'H',
					caseType: APPEAL_CASE_TYPE.D,
					caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN
				},
				[
					{
						caseType: APPEAL_CASE_TYPE.D,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN
					}
				]
			);
			assert.strictEqual(reason, UNASSIGNABLE_REASON.NOT_SUPPORTED_ALLOCATION_LEVEL);
		});
	});
});
