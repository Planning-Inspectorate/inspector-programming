import { describe, test } from 'node:test';
import assert from 'assert';
import {
	appealsViewModel,
	calendarViewModel,
	filtersQueryViewModel,
	getCaseColor,
	inspectorsViewModel,
	toCaseViewModel,
	toInspectorViewModel
} from './view-model.js';

describe('view-model', () => {
	describe('calendarViewModel', () => {
		test('should generate a calendar view model with correct properties', (ctx) => {
			ctx.mock.timers.enable({
				apis: ['Date'],
				now: new Date('2023-10-04T12:00:00Z')
			});
			const events = [];
			const startDate = new Date('2023-10-02');
			const viewModel = calendarViewModel(startDate, events);
			assert.strictEqual(viewModel.currentStartDate.getTime(), startDate.getTime());
			assert.strictEqual(viewModel.dates.length, 7);
			assert.strictEqual(viewModel.times.length, 10);
			assert.strictEqual(viewModel.grid.length, 20);
			assert.strictEqual(
				viewModel.grid.every((column) => column.length === 7),
				true
			);
			assert.strictEqual(viewModel.weekTitle, '02 - 08 October, 2023');
			assert.strictEqual(viewModel.error, undefined);
		});
		test('should use the provided date directly without recalculation', (ctx) => {
			ctx.mock.timers.enable({
				apis: ['Date'],
				now: new Date('2023-12-06T12:00:00Z')
			});
			const events = [];
			const startDate = new Date('2023-12-04T00:00:00Z');
			const viewModel = calendarViewModel(startDate, events);
			assert.strictEqual(viewModel.currentStartDate.getTime(), startDate.getTime());
			assert.strictEqual(viewModel.dates.length, 7);
			assert.strictEqual(viewModel.times.length, 10);
			assert.strictEqual(viewModel.error, undefined);
		});
		test('should include error if provided', () => {
			const events = [];
			const startDate = new Date('2023-10-02');
			const viewModel = calendarViewModel(startDate, events, 'some error');
			assert.strictEqual(viewModel.error, 'some error');
		});
	});
	describe('appealsViewModel', () => {
		test('should return an object with a cases array', (ctx) => {
			ctx.mock.timers.enable({
				apis: ['Date'],
				now: new Date('2023-10-04T12:00:00Z')
			});
			const cases = [
				{ caseReference: 1, caseAge: 10, finalCommentsDate: new Date() },
				{ caseReference: 2, caseAge: 25, finalCommentsDate: new Date() }
			];
			const req = {
				session: {}
			};
			const viewModel = appealsViewModel(cases, req);
			assert.strictEqual(Array.isArray(viewModel.cases), true);
			assert.strictEqual(viewModel.cases.length, 2);
			const case1 = viewModel.cases[0];
			assert.strictEqual(case1.caseReference, 1);
			assert.strictEqual(case1.caseAge, 10);
			assert.strictEqual(case1.finalCommentsDate, '04/10/2023');
		});
	});
	describe('toCaseViewModel', () => {
		test('should return a view model with formatted finalCommentsDate and color', () => {
			const caseData = {
				id: 1,
				caseAge: 30,
				finalCommentsDate: new Date('2025-08-06T23:00:00Z') // 7th August 2025 in Europe/London timezone
			};
			const viewModel = toCaseViewModel(caseData);
			assert.strictEqual(
				viewModel.finalCommentsDate,
				'07/08/2025',
				'Final comments date should be formatted in Europe/London timezone'
			);
			assert.strictEqual(viewModel.caseAgeColor, 'f47738', 'Color should be orange for case age 30');
		});
	});

	describe('getCaseColor', () => {
		test('should return red for case age greater than 40', () => {
			const color = getCaseColor(41);
			assert.strictEqual(color, 'd4351c', 'Color should be red for case age > 40');
		});
		test('should return orange for case age between 21 and 40', () => {
			const color = getCaseColor(30);
			assert.strictEqual(color, 'f47738', 'Color should be orange for case age between 21 and 40');
		});
		test('should return green for case age 20 or less', () => {
			const color = getCaseColor(20);
			assert.strictEqual(color, '00703c', 'Color should be green for case age <= 20');
		});
		test('should return green for case age 0', () => {
			const color = getCaseColor(0);
			assert.strictEqual(color, '00703c', 'Color should be green for case age = 0');
		});
	});

	describe('inspectorsViewModel', () => {
		test('should return the view model', () => {
			const inspectors = [
				{ id: '1', firstName: 'John', lastName: 'Doe' },
				{ id: '2', firstName: 'Jane', lastName: 'Smith' }
			];
			const selectedInspector = inspectors[0];
			const viewModel = inspectorsViewModel(inspectors, selectedInspector, false);
			assert.strictEqual(Array.isArray(viewModel.list), true);
			assert.strictEqual(viewModel.list.length, 2);
			assert.ok(viewModel.selected);
			assert.strictEqual(viewModel.error, undefined);
		});
		test('should show error if no selected inspector', () => {
			const inspectors = [
				{ id: '1', firstName: 'John', lastName: 'Doe' },
				{ id: '2', firstName: 'Jane', lastName: 'Smith' }
			];
			const viewModel = inspectorsViewModel(inspectors, undefined, true);
			assert.strictEqual(viewModel.selected, undefined);
			assert.strictEqual(typeof viewModel.error, 'string');
		});
		test('should not show error if selected inspector', () => {
			const inspectors = [
				{ id: '1', firstName: 'John', lastName: 'Doe' },
				{ id: '2', firstName: 'Jane', lastName: 'Smith' }
			];
			const viewModel = inspectorsViewModel(inspectors, inspectors[0], true);
			assert.ok(viewModel.selected);
			assert.strictEqual(viewModel.error, undefined);
		});
		test('should not show error if showError is false', () => {
			const inspectors = [
				{ id: '1', firstName: 'John', lastName: 'Doe' },
				{ id: '2', firstName: 'Jane', lastName: 'Smith' }
			];
			const viewModel = inspectorsViewModel(inspectors, undefined, false);
			assert.strictEqual(viewModel.selected, undefined);
			assert.strictEqual(viewModel.error, undefined);
		});
	});

	describe('filtersQueryViewModel', () => {
		test('should parse query parameters into filter query', () => {
			const query = {
				page: '2',
				limit: '20',
				sort: 'age',
				inspectorId: '123',
				'filters[minimumAge]': '10',
				'filters[maximumAge]': '50'
			};
			const previousSort = 'age';
			const filterQuery = filtersQueryViewModel(query, previousSort);
			assert.strictEqual(filterQuery.page, 2);
			assert.strictEqual(filterQuery.limit, 20);
			assert.strictEqual(filterQuery.sort, 'age');
			assert.strictEqual(filterQuery.inspectorId, '123');
			assert.strictEqual(filterQuery.case.minimumAge, '10');
			assert.strictEqual(filterQuery.case.maximumAge, '50');
		});
		test('should add default page', () => {
			const query = {};
			const filterQuery = filtersQueryViewModel(query);
			assert.strictEqual(filterQuery.page, 1);
		});
		test('should add default limit', () => {
			const query = {};
			const filterQuery = filtersQueryViewModel(query);
			assert.strictEqual(filterQuery.limit, 10);
		});
		test('should add default sort', () => {
			const query = {};
			const filterQuery = filtersQueryViewModel(query);
			assert.strictEqual(filterQuery.sort, 'age');
		});
		test('should revert to page 1 on sort change', () => {
			const query = {
				page: '10',
				sort: 'age'
			};
			const filterQuery = filtersQueryViewModel(query, 'distance');
			assert.strictEqual(filterQuery.sort, 'age');
			assert.strictEqual(filterQuery.page, 1);
		});
	});

	describe('toInspectorViewModel', () => {
		test('should return undefined if no inspector provided', () => {
			const result = toInspectorViewModel(undefined);
			assert.strictEqual(result, undefined);
		});
		test('should return the inspector with empty specialisms array', () => {
			const inspector = { id: '1', firstName: 'John', lastName: 'Doe' };
			const result = toInspectorViewModel(inspector);
			assert.strictEqual(result.id, inspector.id);
			assert.strictEqual(result.firstName, inspector.firstName);
			assert.strictEqual(result.lastName, inspector.lastName);
			assert.strictEqual(Array.isArray(result.specialisms), true);
			assert.strictEqual(result.specialisms.length, 0);
			assert.strictEqual(typeof result.specialismsList, 'string');
		});
		test('should map specialism validFrom dates', () => {
			const inspector = {
				id: '1',
				firstName: 'John',
				lastName: 'Doe',
				Specialisms: [
					{ id: 's1', name: 'Specialism 1', validFrom: new Date('2023-10-01T00:00:00Z') },
					{ id: 's2', name: 'Specialism 2', validFrom: new Date('2024-01-15T00:00:00Z') }
				]
			};
			const result = toInspectorViewModel(inspector);
			assert.strictEqual(Array.isArray(result.specialisms), true);
			assert.strictEqual(result.specialisms.length, 2);
			assert.strictEqual(result.specialisms[0].validFrom, '01/10/2023');
			assert.strictEqual(result.specialisms[1].validFrom, '15/01/2024');
			assert.strictEqual(result.specialismsList, 'Specialism 1, Specialism 2');
		});
	});
});
