import { describe, mock, test } from 'node:test';
import { buildViewHome, caseViewModel, filterCases, getCaseColor, sortCases } from './controller.js';
import assert from 'assert';
import { mockLogger } from '@pins/inspector-programming-lib/testing/mock-logger.js';

describe('controller.js', () => {
	describe('buildViewHome', () => {
		const mockService = () => {
			return {
				logger: mockLogger(),
				entraClient: {
					listAllGroupMembers: mock.fn(() => [])
				},
				entraGroupIds: {
					inspectors: 'inspectors-group-id',
					teamLeads: 'team-leads-group-id',
					nationalTeam: 'national-team-group-id'
				},
				casesClient: {
					getAllCases: mock.fn(() => [])
				}
			};
		};
		test('should get all cases', async () => {
			const service = mockService();
			service.casesClient.getAllCases.mock.mockImplementationOnce(() =>
				Array.from({ length: 10 }, (_, i) => ({ id: i + 1, caseAge: i * 5 }))
			);
			const req = { url: '/', query: {} };
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(service.casesClient.getAllCases.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.cases.length, 10);
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
			assert.strictEqual(color, '_00703c', 'Color should be green for case age <= 20');
		});
		test('should return green for case age 0', () => {
			const color = getCaseColor(0);
			assert.strictEqual(color, '_00703c', 'Color should be green for case age = 0');
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
			assert.strictEqual(viewModel.color, 'f47738', 'Color should be orange for case age 30');
		});
	});
});
