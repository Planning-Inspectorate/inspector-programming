import { describe, mock, test } from 'node:test';
import {
	buildViewHome,
	caseViewModel,
	filterCases,
	getCaseColor,
	sortCases,
	handlePagination,
	buildQueryString,
	createPaginationItems
} from './controller.js';
import assert from 'assert';
import { mockLogger } from '@pins/inspector-programming-lib/testing/mock-logger.js';

describe('controller.js', () => {
	describe('buildViewHome', () => {
		const entraClient = {
			listAllGroupMembers: mock.fn(() => [])
		};
		const mockService = () => {
			return {
				logger: mockLogger(),
				entraClient() {
					return entraClient;
				},
				entraGroupIds: {
					inspectors: 'inspectors-group-id',
					teamLeads: 'team-leads-group-id',
					nationalTeam: 'national-team-group-id'
				},
				casesClient: {
					getAllCases: mock.fn(() => []),
					getCases: mock.fn(() => ({ cases: [], total: 0 }))
				},
				db: {
					inspector: {
						findFirst: mock.fn()
					}
				}
			};
		};
		test('should get all cases', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, caseAge: i * 5 })),
				total: 10
			}));
			const req = { url: '/', query: {} };
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(service.casesClient.getCases.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.cases.length, 10);
		});
		test('should fetch inspector data', async () => {
			const service = mockService();
			entraClient.listAllGroupMembers.mock.mockImplementationOnce(() => [
				{ id: 'inspector-id', name: 'Test Inspector' }
			]);
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, caseAge: i * 5 })),
				total: 10
			}));
			const inspectorData = {
				id: 'inspector-id',
				name: 'Test Inspector',
				entraId: 'entra-id',
				grade: 'B2',
				postcode: 'BS1 6PN',
				longitude: -2.5828931,
				latitude: 51.4508591,
				specialisms: []
			};
			service.db.inspector.findFirst.mock.mockImplementationOnce(() => inspectorData);
			const req = {
				url: '/',
				query: { inspectorId: 'inspector-id' },
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(service.casesClient.getCases.mock.callCount(), 1);
			assert.strictEqual(service.db.inspector.findFirst.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.cases.length, 10);
			assert.deepStrictEqual(args.inspectorPin, {
				...inspectorData,
				emailAddress: '',
				firstName: '',
				lastName: ''
			});
		});
	});
	describe('filterCases', () => {
		test('should return all cases if no filters are applied', () => {
			const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
			const filters = {};
			const filteredCases = filterCases(cases, filters);
			assert.strictEqual(filteredCases.length, 3, 'Should return all cases when no filters are applied');
		});
		test('should filter cases by minimum age', () => {
			const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
			const filters = { minimumAge: 15 };
			const filteredCases = filterCases(cases, filters);
			assert.strictEqual(filteredCases.length, 2, 'Should return cases with age >= 15');
			assert.deepStrictEqual(filteredCases, [{ caseAge: 30 }, { caseAge: 20 }]);
		});
		test('should filter cases by maximum age', () => {
			const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
			const filters = { maximumAge: 20 };
			const filteredCases = filterCases(cases, filters);
			assert.strictEqual(filteredCases.length, 2, 'Should return cases with age <= 20');
			assert.deepStrictEqual(filteredCases, [{ caseAge: 10 }, { caseAge: 20 }]);
		});
		test('should filter cases by both minimum and maximum age', () => {
			const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
			const filters = { minimumAge: 15, maximumAge: 25 };
			const filteredCases = filterCases(cases, filters);
			assert.strictEqual(filteredCases.length, 1, 'Should return cases with age between 15 and 25');
			assert.deepStrictEqual(filteredCases, [{ caseAge: 20 }]);
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
	describe('sortCases', () => {
		test('should sort cases by age in descending order', () => {
			const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
			const sortedCases = sortCases(cases, 'age');
			assert.strictEqual(sortedCases.length, 3, 'Should return the same number of cases');
			assert.deepStrictEqual(sortedCases, [{ caseAge: 30 }, { caseAge: 20 }, { caseAge: 10 }]);
		});
	});
	describe('caseViewModel', () => {
		test('should return a view model with formatted finalCommentsDate and color', () => {
			const caseData = {
				id: 1,
				caseAge: 30,
				finalCommentsDate: new Date('2025-08-06T23:00:00Z') // 7th August 2025 in Europe/London timezone
			};
			const viewModel = caseViewModel(caseData);
			assert.strictEqual(
				viewModel.finalCommentsDate,
				'07/08/2025',
				'Final comments date should be formatted in Europe/London timezone'
			);
			assert.strictEqual(viewModel.caseAgeColor, 'f47738', 'Color should be orange for case age 30');
		});
	});
	describe('handlePagination', () => {
		test('should return correct previous and next links and items', () => {
			const req = { query: { sort: 'age', page: 2 } };
			const total = 25;
			const formData = { page: 2, limit: 10 };
			const result = handlePagination(req, total, formData);

			assert.deepStrictEqual(result.previous, { href: '?sort=age&page=1' });
			assert.deepStrictEqual(result.next, { href: '?sort=age&page=3' });
			assert.strictEqual(result.items.length, 3);
			assert.strictEqual(result.items[1].current, true);
		});

		test('should handle first page correctly', () => {
			const req = { query: { sort: 'age', page: 1 } };
			const total = 15;
			const formData = { page: 1, limit: 10 };
			const result = handlePagination(req, total, formData);

			assert.strictEqual(result.previous, null);
			assert.deepStrictEqual(result.next, { href: '?sort=age&page=2' });
			assert.strictEqual(result.items.length, 2);
			assert.strictEqual(result.items[0].current, true);
		});

		test('should handle last page correctly', () => {
			const req = { query: { sort: 'age', page: 2 } };
			const total = 20;
			const formData = { page: 2, limit: 10 };
			const result = handlePagination(req, total, formData);

			assert.deepStrictEqual(result.previous, { href: '?sort=age&page=1' });
			assert.strictEqual(result.next, null);
			assert.strictEqual(result.items.length, 2);
			assert.strictEqual(result.items[1].current, true);
		});

		test('should always have at least one page', () => {
			const req = { query: {} };
			const total = 0;
			const formData = { page: 1, limit: 10 };
			const result = handlePagination(req, total, formData);

			assert.strictEqual(result.items.length, 1);
			assert.strictEqual(result.items[0].current, true);
		});
	});
	describe('buildQueryString', () => {
		test('should build query string with new page', () => {
			const params = { sort: 'age', page: 2 };
			const result = buildQueryString(params, 3);
			assert.strictEqual(result, '?sort=age&page=3');
		});

		test('should build query string from multiple query params with new page', () => {
			const params = { sort: 'age', maximumAge: 42, page: 2 };
			const result = buildQueryString(params, 3);
			assert.strictEqual(result, '?sort=age&maximumAge=42&page=3');
		});
		test('should omit undefined values', () => {
			const params = { sort: 'age', maximumAge: undefined };
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?sort=age&page=1');
		});
		test('should handle null values', () => {
			const params = { sort: 'age', maximumAge: null };
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?sort=age&page=1');
		});
		test('should handle empty string values', () => {
			const params = { sort: 'age', maximumAge: '' };
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?sort=age&maximumAge=&page=1');
		});

		test('should handle numeric values', () => {
			const params = { sort: 'age', maximumAge: 42 };
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?sort=age&maximumAge=42&page=1');
		});
		test('should handle empty params', () => {
			const params = {};
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?page=1');
		});
	});
	describe('createPaginationItems', () => {
		const params = { sort: 'age' };
		test('should return all pages when totalPages <= 7', () => {
			const items = createPaginationItems(3, 5, params);
			assert.strictEqual(items.length, 5);
			assert.strictEqual(items[2].current, true);
			assert.strictEqual(items[0].number, 1);
			assert.strictEqual(items[4].number, 5);
		});

		test('should add ellipsis for large page sets', () => {
			const items = createPaginationItems(10, 20, params);
			assert.strictEqual(items[0].number, 1);
			assert.ok(items.some((i) => i.ellipsis));
			assert.strictEqual(items[items.length - 1].number, 20);
			assert.ok(items.find((i) => i.current && i.number === 10));
		});

		test('should show correct pages near start', () => {
			const items = createPaginationItems(2, 10, params);
			assert.strictEqual(items[0].number, 1);
			assert.strictEqual(items[1].number, 2);
			assert.ok(!items[1].ellipsis);
			assert.ok(items.some((i) => i.ellipsis));
			assert.strictEqual(items[items.length - 1].number, 10);
		});

		test('should show correct pages near end', () => {
			const items = createPaginationItems(9, 10, params);
			assert.strictEqual(items[0].number, 1);
			assert.ok(items.some((i) => i.ellipsis));
			assert.strictEqual(items[items.length - 1].number, 10);
			assert.ok(items.find((i) => i.current && i.number === 9));
		});

		test('should always have at least one page', () => {
			const items = createPaginationItems(1, 1, params);
			assert.strictEqual(items.length, 1);
			assert.strictEqual(items[0].number, 1);
			assert.strictEqual(items[0].current, true);
		});
	});
});
