// @ts-nocheck
import { describe, test } from 'node:test';
import assert from 'assert';
import { getUnassignableReason, toUnassignableCaseListViewModel, UNASSIGNABLE_REASON } from './view-model.ts';
import { APPEAL_CASE_PROCEDURE, APPEAL_CASE_STATUS, APPEAL_CASE_TYPE } from '@planning-inspectorate/data-model';
import { END_STATE_APPEAL_STATUSES } from '@pins/inspector-programming-lib/data/database/appeal-status.js';

describe('view-model', () => {
	describe('toUnassignableCaseListViewModel', () => {
		test('should use default pagination', () => {
			const viewModel = toUnassignableCaseListViewModel({}, [], []);
			assert.strictEqual(viewModel.pagination.page, 1);
			assert.strictEqual(viewModel.pagination.limit, 1000);
			assert.strictEqual(viewModel.pagination.total, 0);
		});
		test('should filter by case status', () => {
			const appeals = [
				{ caseReference: '1', caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE, lpaRegion: 'North', caseAge: 5 },
				{ caseReference: '2', caseStatus: APPEAL_CASE_STATUS.AWAITING_EVENT, lpaRegion: 'North', caseAge: 5 }
			];
			const viewModel = toUnassignableCaseListViewModel(
				{ 'filters[caseStatuses]': APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE },
				appeals,
				[]
			);
			assert.strictEqual(viewModel.pagination.total, 1);
			assert.strictEqual(viewModel.unassignableList[0].caseReference, '1');
		});
		test('should filter by multiple case statuses', () => {
			const appeals = [
				{ caseReference: '1', caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE, lpaRegion: 'North', caseAge: 5 },
				{ caseReference: '2', caseStatus: APPEAL_CASE_STATUS.AWAITING_EVENT, lpaRegion: 'North', caseAge: 5 },
				{ caseReference: '3', caseStatus: APPEAL_CASE_STATUS.VALIDATION, lpaRegion: 'North', caseAge: 5 }
			];
			const viewModel = toUnassignableCaseListViewModel(
				{ 'filters[caseStatuses]': [APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE, APPEAL_CASE_STATUS.VALIDATION] },
				appeals,
				[]
			);
			assert.deepStrictEqual(
				viewModel.unassignableList.map((c) => c.caseReference),
				['1', '3']
			);
		});
		test('should filter by lpa region', () => {
			const appeals = [
				{ caseReference: '1', caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE, lpaRegion: 'North', caseAge: 5 },
				{ caseReference: '2', caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE, lpaRegion: 'East', caseAge: 5 }
			];
			const viewModel = toUnassignableCaseListViewModel({ 'filters[lpaRegion]': 'East' }, appeals, []);
			assert.strictEqual(viewModel.pagination.total, 1);
			assert.strictEqual(viewModel.unassignableList[0].caseReference, '2');
		});
		test('should filter by case status and lpa region combined', () => {
			const appeals = [
				{ caseReference: '1', caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE, lpaRegion: 'North', caseAge: 5 },
				{ caseReference: '2', caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE, lpaRegion: 'East', caseAge: 5 },
				{ caseReference: '3', caseStatus: APPEAL_CASE_STATUS.AWAITING_EVENT, lpaRegion: 'North', caseAge: 5 }
			];
			const viewModel = toUnassignableCaseListViewModel(
				{
					'filters[caseStatuses]': APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE,
					'filters[lpaRegion]': 'North'
				},
				appeals,
				[]
			);
			assert.strictEqual(viewModel.pagination.total, 1);
			assert.strictEqual(viewModel.unassignableList[0].caseReference, '1');
		});
		test('should return no cases when no appeals match the selected filters', () => {
			const appeals = [
				{ caseReference: '1', caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE, lpaRegion: 'North', caseAge: 5 }
			];
			const viewModel = toUnassignableCaseListViewModel({ 'filters[lpaRegion]': 'West' }, appeals, []);
			assert.strictEqual(viewModel.pagination.total, 0);
			assert.deepStrictEqual(viewModel.unassignableList, []);
		});
		test('should return all appeals when no filters are selected', () => {
			const appeals = [
				{ caseReference: '1', caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE, lpaRegion: 'North', caseAge: 5 },
				{ caseReference: '2', caseStatus: APPEAL_CASE_STATUS.AWAITING_EVENT, lpaRegion: 'East', caseAge: 5 }
			];
			const viewModel = toUnassignableCaseListViewModel({}, appeals, []);
			assert.strictEqual(viewModel.pagination.total, 2);
		});
		test('should match lpa regions case insensitively, as the unassigned case list does', () => {
			const appeals = [
				{ caseReference: '1', caseStatus: APPEAL_CASE_STATUS.VALIDATION, lpaRegion: 'north', caseAge: 5 }
			];
			const viewModel = toUnassignableCaseListViewModel({ 'filters[lpaRegion]': 'North' }, appeals, []);
			assert.strictEqual(viewModel.pagination.total, 1);
		});
		test('should exclude appeals outside the default case age bounds, as the unassigned case list does', () => {
			const appeals = [
				{ caseReference: '1', caseStatus: APPEAL_CASE_STATUS.VALIDATION, lpaRegion: 'North', caseAge: 5 },
				{ caseReference: '2', caseStatus: APPEAL_CASE_STATUS.VALIDATION, lpaRegion: 'North', caseAge: -1 },
				{ caseReference: '3', caseStatus: APPEAL_CASE_STATUS.VALIDATION, lpaRegion: 'North', caseAge: 1000 }
			];
			const viewModel = toUnassignableCaseListViewModel({}, appeals, []);
			assert.deepStrictEqual(
				viewModel.unassignableList.map((c) => c.caseReference),
				['1']
			);
		});
		test('should expose the selected filters and filter links', () => {
			const viewModel = toUnassignableCaseListViewModel(
				{ 'filters[caseStatuses]': APPEAL_CASE_STATUS.VALIDATION, 'filters[lpaRegion]': ['North', 'East'] },
				[],
				[]
			);
			assert.deepStrictEqual(viewModel.filters.query.case.caseStatuses, [APPEAL_CASE_STATUS.VALIDATION]);
			assert.deepStrictEqual(viewModel.filters.query.case.lpaRegion, ['North', 'East']);
			assert.strictEqual(typeof viewModel.filters.buildUrlWithoutFilter, 'function');
			assert.strictEqual(
				viewModel.filters.buildUrlWithoutFilter('lpaRegion', 'East'),
				'?filters%5BcaseStatuses%5D=validation&filters%5BlpaRegion%5D=North&page=1'
			);
			assert.strictEqual(viewModel.filters.clearFiltersUrl, '?page=1');
		});
		test('should offer region filter options', () => {
			const viewModel = toUnassignableCaseListViewModel({}, [], []);
			assert.deepStrictEqual(viewModel.filters.lpaRegions, [
				{ value: 'North', text: 'North' },
				{ value: 'East', text: 'East' },
				{ value: 'West', text: 'West' }
			]);
		});
		test('should offer case status filter options, excluding end state statuses', () => {
			const viewModel = toUnassignableCaseListViewModel({}, [], []);
			const values = viewModel.filters.caseStatuses.map((option) => option.value);
			for (const status of END_STATE_APPEAL_STATUSES) {
				assert.ok(!values.includes(status), `${status} should not be a filter option`);
			}
			assert.ok(values.includes(APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE));
			assert.ok(values.includes(APPEAL_CASE_STATUS.AWAITING_EVENT));
		});
		test('should build per-page links preserving filters and resetting page', () => {
			const viewModel = toUnassignableCaseListViewModel(
				{ filters: { lpaRegion: ['North', 'East'] }, limit: '1000', page: '3' },
				[],
				[]
			);
			assert.deepStrictEqual(viewModel.perPageLinks, [
				{
					limit: 1000,
					href: '?filters%5BlpaRegion%5D=North&filters%5BlpaRegion%5D=East&limit=1000&page=1',
					current: true
				},
				{
					limit: 2000,
					href: '?filters%5BlpaRegion%5D=North&filters%5BlpaRegion%5D=East&limit=2000&page=1',
					current: false
				}
			]);
		});
		test('should format case status filter labels', () => {
			const viewModel = toUnassignableCaseListViewModel({}, [], []);
			const labelFor = (value) => viewModel.filters.caseStatuses.find((option) => option.value === value)?.text;
			assert.strictEqual(labelFor(APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE), 'LPA questionnaire');
			assert.strictEqual(labelFor(APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER), 'Assign case officer');
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
					caseStatus: APPEAL_CASE_STATUS.AWAITING_EVENT
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
