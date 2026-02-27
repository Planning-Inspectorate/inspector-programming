import { describe, test } from 'node:test';
import assert from 'assert';
import {
	appealsViewModel,
	calendarViewModel,
	caseTypeOptions,
	filtersQueryViewModel,
	getCaseColor,
	inspectorsViewModel,
	toCaseViewModel,
	toInspectorViewModel
} from './view-model.js';
import { APPEAL_CASE_PROCEDURE, APPEAL_CASE_TYPE } from '@planning-inspectorate/data-model';

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
		test('should map case type and procedure', () => {
			const caseData = {
				id: 1,
				caseType: APPEAL_CASE_TYPE.D,
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN
			};
			const viewModel = toCaseViewModel(caseData);
			assert.strictEqual(viewModel.procedureShort, 'WR');
			assert.strictEqual(viewModel.caseTypeShort, 'HAS');
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

		test('should attach URL building functions to filter object', () => {
			const query = {
				'filters[minimumAge]': '10'
			};
			const filterQuery = filtersQueryViewModel(query);

			// Verify functions are attached and callable
			assert.strictEqual(typeof filterQuery.buildUrlWithoutFilter, 'function');
			assert.strictEqual(typeof filterQuery.clearFiltersUrl, 'string');

			// Verify functions work correctly
			const removeUrl = filterQuery.buildUrlWithoutFilter('minimumAge');
			assert.ok(typeof removeUrl === 'string', 'buildUrlWithoutFilter should return a string');
			assert.ok(removeUrl.startsWith('?'), 'URL should start with query parameter marker');
		});
		test('should wrap single string into array', () => {
			const query = {
				'filters[caseSpecialisms]': 'Housing orders'
			};
			const filterQuery = filtersQueryViewModel(query);

			assert.ok(Array.isArray(filterQuery.case.caseSpecialisms));
			assert.strictEqual(filterQuery.case.caseSpecialisms.length, 1);
			assert.strictEqual(filterQuery.case.caseSpecialisms[0], 'Housing orders');
			assert.strictEqual(filterQuery.case.caseSpecialisms.includes('Housing'), false);
		});

		test('should preserve provided arrays without modification', () => {
			const query = {
				'filters[caseSpecialisms]': ['Housing orders', 'Housing']
			};
			const filterQuery = filtersQueryViewModel(query);

			assert.ok(Array.isArray(filterQuery.case.caseSpecialisms));
			assert.deepStrictEqual(filterQuery.case.caseSpecialisms, ['Housing orders', 'Housing']);
		});
	});

	describe('filtersQueryViewModel - URL functions', () => {
		/**
		 * @param {Object} filters - Filter parameters to include
		 * @param {Object} otherParams - Other query parameters
		 * @returns {Object} Complete query object
		 */
		function createFilterQuery(filters = {}, otherParams = {}) {
			const query = { ...otherParams };
			Object.entries(filters).forEach(([key, value]) => {
				query[`filters[${key}]`] = value;
			});
			return query;
		}

		/**
		 * @param {string} url - URL to test
		 * @param {Object} assertions - Object with 'includes' and 'excludes' arrays
		 */
		function assertUrlContent(url, assertions = {}) {
			const { includes = [], excludes = [] } = assertions;
			includes.forEach((item) => {
				assert.ok(url.includes(item.value), item.message || `URL should include: ${item.value}`);
			});
			excludes.forEach((item) => {
				assert.ok(!url.includes(item.value), item.message || `URL should not include: ${item.value}`);
			});
		}

		test('should handle array filter parameters correctly for LPA regions', () => {
			const query = createFilterQuery({ lpaRegion: ['North', 'East', 'West'] });
			const filterQuery = filtersQueryViewModel(query);

			assert.deepStrictEqual(filterQuery.case.lpaRegion, ['North', 'East', 'West']);
		});

		test('should convert single LPA region string to array', () => {
			const query = createFilterQuery({ lpaRegion: 'North' });
			const filterQuery = filtersQueryViewModel(query);

			assert.deepStrictEqual(filterQuery.case.lpaRegion, ['North']);
		});

		test('should handle array filter parameters correctly for specialisms', () => {
			const query = createFilterQuery({ caseSpecialisms: ['Enforcement', 'Householder', 'Planning Obligation'] });
			const filterQuery = filtersQueryViewModel(query);
			assert.deepStrictEqual(filterQuery.case.caseSpecialisms, ['Enforcement', 'Householder', 'Planning Obligation']);
		});

		test('should pass buildUrlWithoutFilter function to template', () => {
			const query = createFilterQuery({
				minimumAge: '10',
				maximumAge: '50',
				lpaRegion: ['North', 'South']
			});
			const filterQuery = filtersQueryViewModel(query);

			assert.strictEqual(typeof filterQuery.buildUrlWithoutFilter, 'function');

			const removeMinAgeUrl = filterQuery.buildUrlWithoutFilter('minimumAge');
			assertUrlContent(removeMinAgeUrl, {
				includes: [
					{ value: 'page=1', message: 'Should reset page to 1' },
					{ value: 'filters%5BmaximumAge%5D=50', message: 'Should preserve max age' },
					{ value: 'filters%5BlpaRegion%5D=North', message: 'Should preserve LPA regions North' },
					{ value: 'filters%5BlpaRegion%5D=South', message: 'Should preserve LPA regions South' }
				],
				excludes: [{ value: 'minimumAge', message: 'Should remove min age' }]
			});
		});

		test('should handle array filter removal correctly', () => {
			const query = createFilterQuery({ lpaRegion: ['North', 'South', 'East'] }, { inspectorId: '123' });
			const filterQuery = filtersQueryViewModel(query);

			const removeNorthUrl = filterQuery.buildUrlWithoutFilter('lpaRegion', 'North');
			assertUrlContent(removeNorthUrl, {
				includes: [
					{ value: 'inspectorId=123', message: 'Should preserve inspectorId' },
					{ value: 'filters%5BlpaRegion%5D=South', message: 'Should preserve South' },
					{ value: 'filters%5BlpaRegion%5D=East', message: 'Should preserve East' }
				],
				excludes: [{ value: 'North', message: 'Should remove North' }]
			});
		});

		test('should handle single value removal from array', () => {
			const query = createFilterQuery({ lpaRegion: 'North' });
			const filterQuery = filtersQueryViewModel(query);

			const removeUrl = filterQuery.buildUrlWithoutFilter('lpaRegion', 'North');
			assertUrlContent(removeUrl, {
				includes: [{ value: 'page=1', message: 'Should reset page to 1' }],
				excludes: [{ value: 'lpaRegion', message: 'Should remove filter entirely when last value removed' }]
			});
		});

		test('should generate clear filters URL correctly', () => {
			const query = createFilterQuery(
				{
					minimumAge: '10',
					lpaRegion: ['North', 'South']
				},
				{
					inspectorId: '456',
					page: '3',
					limit: '25',
					sort: 'distance'
				}
			);
			const filterQuery = filtersQueryViewModel(query);

			assertUrlContent(filterQuery.clearFiltersUrl, {
				includes: [
					{ value: 'inspectorId=456', message: 'Should preserve inspectorId' },
					{ value: 'page=1', message: 'Should reset page to 1' },
					{ value: 'limit=25', message: 'Should preserve limit' },
					{ value: 'sort=distance', message: 'Should preserve sort' }
				],
				excludes: [{ value: 'filters', message: 'Should remove all filters' }]
			});
		});

		test('should handle special characters in URL encoding', () => {
			const query = createFilterQuery(
				{
					caseSpecialisms: ['Planning & Development', 'Listed Building']
				},
				{ inspectorId: '123' }
			);
			const filterQuery = filtersQueryViewModel(query);

			const removeUrl = filterQuery.buildUrlWithoutFilter('caseSpecialisms', 'Planning & Development');

			assertUrlContent(removeUrl, {
				includes: [
					{ value: 'filters%5BcaseSpecialisms%5D=Listed', message: 'Should preserve and encode other specialisms' },
					{ value: 'Building', message: 'Should preserve other values' }
				],
				excludes: [{ value: 'Planning', message: 'Should remove the specified value' }]
			});
		});

		test('should use URLSearchParams pattern for robust encoding', () => {
			const query = createFilterQuery({ lpaRegion: ['North/West', 'South & East'] }, { sort: 'distance' });
			const filterQuery = filtersQueryViewModel(query);

			const removeUrl = filterQuery.buildUrlWithoutFilter('lpaRegion', 'North/West');

			assertUrlContent(removeUrl, {
				includes: [
					{ value: 'South', message: 'Should preserve other regions' },
					{ value: 'East', message: 'Should preserve complex values' },
					{ value: 'sort=distance', message: 'Should preserve other parameters' }
				],
				excludes: [{ value: 'North', message: 'Should remove specified value' }]
			});
		});

		test('should handle default values in clear URL', () => {
			const query = createFilterQuery({ minimumAge: '10' });
			const filterQuery = filtersQueryViewModel(query);

			assertUrlContent(filterQuery.clearFiltersUrl, {
				includes: [{ value: 'page=1', message: 'Should reset to page 1' }],
				excludes: [
					{ value: 'limit=', message: 'Should not include default limit when not set' },
					{ value: 'sort=', message: 'Should not include default sort when not set' }
				]
			});
		});

		test('should ignore invalid filter parameters', () => {
			const query = createFilterQuery({
				invalidFilter: 'somevalue',
				minimumAge: '10'
			});
			const filterQuery = filtersQueryViewModel(query);
			assert.strictEqual(filterQuery.case.minimumAge, '10');
			assert.ok(!Object.hasOwn(filterQuery.case, 'invalidFilter'), 'Invalid filter key should not exist');
		});

		test('should handle empty filter arrays gracefully', () => {
			const query = createFilterQuery({ caseSpecialisms: [] });
			const filterQuery = filtersQueryViewModel(query);

			assert.deepStrictEqual(filterQuery.case.caseSpecialisms, []);
		});

		test('should preserve non-filter query parameters in URLs', () => {
			const query = createFilterQuery(
				{ minimumAge: '10' },
				{
					inspectorId: '123',
					sort: 'distance',
					limit: '20',
					customParam: 'preserved'
				}
			);
			const filterQuery = filtersQueryViewModel(query);

			const removeUrl = filterQuery.buildUrlWithoutFilter('minimumAge');
			assertUrlContent(removeUrl, {
				includes: [
					{ value: 'inspectorId=123', message: 'Should preserve inspectorId' },
					{ value: 'sort=distance', message: 'Should preserve sort' },
					{ value: 'limit=20', message: 'Should preserve limit' },
					{ value: 'customParam=preserved', message: 'Should preserve custom parameters' }
				]
			});
		});

		test('should handle malformed query parameters gracefully', () => {
			const query = {
				'filters[minimumAge]': null,
				'filters[maximumAge]': undefined,
				'filters[lpaRegion]': ''
			};
			const filterQuery = filtersQueryViewModel(query);

			assert.ok(!filterQuery.case.minimumAge);
			assert.ok(!filterQuery.case.maximumAge);
			assert.ok(!filterQuery.case.lpaRegion);
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

	describe('caseTypeOptions', () => {
		test('should include type shorthand in brackets', () => {
			assert.strictEqual(caseTypeOptions[0].text, 'Advertisement (Adv)');
			assert.strictEqual(caseTypeOptions[3].text, 'Commercial advertisement (CAS Ad)');
			// expect if the shorthand matches the name
			assert.strictEqual(caseTypeOptions[11].text, 'Planning');
		});
	});
});
