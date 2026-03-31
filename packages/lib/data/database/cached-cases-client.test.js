import { describe, it, mock } from 'node:test';
import { buildInitCasesClient, CachedCasesClient } from './cached-cases-client.js';
import assert from 'node:assert';
import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';

describe('cached-cases-client', () => {
	describe('buildInitCasesClient', () => {
		it('should return a CachedCasesClient', () => {
			const initEntraClient = buildInitCasesClient({});
			assert.strictEqual(initEntraClient instanceof CachedCasesClient, true);
		});
	});
	describe('CachedCasesClient', () => {
		const newClientWithCachedValue = async (cases) => {
			const mockClient = {
				lastCasesUpdate: mock.fn(),
				getAllCases: mock.fn(() => cases),
				deleteCases: mock.fn()
			};
			const cacheClient = new CachedCasesClient(mockClient);
			await cacheClient.getAllCases();
			mockClient.getAllCases.mock.resetCalls();
			return { cacheClient, mockClient };
		};
		it('should return cached entry if present', async () => {
			const { cacheClient, mockClient } = await newClientWithCachedValue([1, 2, 3]);
			const cases = await cacheClient.getAllCases();
			assert.strictEqual(mockClient.getAllCases.mock.callCount(), 0);
			assert.deepStrictEqual(cases, [1, 2, 3]);
		});
		it('should fetch new value if no cache value', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn(),
				getAllCases: mock.fn(() => [3, 4, 5])
			};
			const cacheClient = new CachedCasesClient(mockClient);
			const cases = await cacheClient.getAllCases();
			assert.deepStrictEqual(cases, [3, 4, 5]);
			assert.strictEqual(mockClient.getAllCases.mock.callCount(), 1);
		});

		it('should return case by case id', async () => {
			const { cacheClient } = await newClientWithCachedValue([{ caseId: 1 }, { caseId: 2 }, { caseId: 3 }]);
			const appeal = await cacheClient.getCaseById(2);
			assert.deepStrictEqual(appeal, { caseId: 2 });
		});

		it('should return cases by case ids', async () => {
			const { cacheClient } = await newClientWithCachedValue([{ caseId: 1 }, { caseId: 2 }, { caseId: 3 }]);
			const appeals = await cacheClient.getCasesByIds([2]);
			assert.deepStrictEqual(appeals, [{ caseId: 2 }]);
		});

		it('should get all cases that are parent or stand alone cases', async () => {
			const { cacheClient } = await newClientWithCachedValue([
				{ id: '1', linkedCaseStatus: 'Child' },
				{ id: '2', linkedCaseStatus: 'Parent' },
				{ id: '3', linkedCaseStatus: '' }
			]);
			const linkedCases = await cacheClient.getAllParentCases();
			assert.deepStrictEqual(linkedCases, [
				{ id: '2', linkedCaseStatus: 'Parent' },
				{ id: '3', linkedCaseStatus: '' }
			]);
		});

		it('should remove cases from cache', async () => {
			const { cacheClient, mockClient } = await newClientWithCachedValue([
				{ caseId: 1 },
				{ caseId: 2 },
				{ caseId: 3 },
				{ caseId: 4 },
				{ caseId: 5 }
			]);
			await cacheClient.deleteCases([1, 3]);
			assert.strictEqual(mockClient.deleteCases.mock.callCount(), 1);
			const cases = await cacheClient.getAllCases();
			assert.deepStrictEqual(cases, [{ caseId: 2 }, { caseId: 4 }, { caseId: 5 }]);
		});

		describe('getCases', () => {
			const makeCase = ({
				caseId,
				caseAge = 0,
				caseReceivedDate = null,
				lpaName = null,
				lat = null,
				lng = null,
				caseStatus = APPEAL_CASE_STATUS.READY_TO_START
			}) => ({
				caseId,
				caseAge,
				caseReceivedDate,
				lpaName,
				siteAddressLatitude: lat,
				siteAddressLongitude: lng,
				caseStatus
			});

			const newMockClient = () => {
				return {
					lastCasesUpdate: mock.fn()
				};
			};

			it('should get only parent cases from getAllParentCases', async () => {
				const mockClient = newMockClient();
				const cacheClient = new CachedCasesClient(mockClient);

				const allCases = [
					{ caseId: 1, linkedCaseStatus: 'Child' },
					{ caseId: 2, linkedCaseStatus: 'Parent' },
					{ caseId: 3, linkedCaseStatus: '' }
				];

				cacheClient.getAllCases = mock.fn(() => Promise.resolve(allCases));

				const parents = await cacheClient.getAllParentCases();
				assert.deepStrictEqual(parents, [
					{ caseId: 2, linkedCaseStatus: 'Parent' },
					{ caseId: 3, linkedCaseStatus: '' }
				]);
			});

			it('should excludes cases with invalid statuses', async () => {
				const mockClient = newMockClient();
				const cacheClient = new CachedCasesClient(mockClient);

				const allCases = [
					makeCase({ caseId: 1, caseStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER }),
					makeCase({ caseId: 2, caseStatus: APPEAL_CASE_STATUS.VALIDATION }),
					makeCase({ caseId: 3, caseStatus: APPEAL_CASE_STATUS.READY_TO_START })
				];

				cacheClient.getAllParentCases = mock.fn(() => Promise.resolve(allCases));

				const result = await cacheClient.getCases({}, undefined, 1, 10);

				assert.strictEqual(result.total, 1);
				assert.strictEqual(result.page, 1);
				assert.deepStrictEqual(
					result.cases.map((c) => c.caseId),
					[3]
				);
			});

			it('should sorts by age (default) and paginates results', async () => {
				const mockClient = newMockClient();
				const cacheClient = new CachedCasesClient(mockClient);

				const allCases = [
					makeCase({ caseId: 1, caseAge: 5 }),
					makeCase({ caseId: 2, caseAge: 1 }),
					makeCase({ caseId: 3, caseAge: 3 })
				];

				cacheClient.getAllParentCases = mock.fn(() => Promise.resolve(allCases));

				const pageSize = 2;
				const result = await cacheClient.getCases({}, undefined, 1, pageSize);

				assert.deepStrictEqual(
					result.cases.map((c) => c.caseId),
					[1, 3]
				);
				assert.strictEqual(result.total, 3);
				assert.strictEqual(result.page, 1);
			});

			it('should sorts by distance when requested', async () => {
				const mockClient = newMockClient();
				const cacheClient = new CachedCasesClient(mockClient);

				const inspectorCoords = { lat: 0.01, lng: 0.01 };
				const allCases = [makeCase({ caseId: 1, lat: 0.01, lng: 0.21 }), makeCase({ caseId: 2, lat: 0.01, lng: 0.11 })];

				cacheClient.getAllParentCases = mock.fn(() => Promise.resolve(allCases));

				const result = await cacheClient.getCases({ inspectorCoordinates: inspectorCoords }, 'distance', 1, 10);

				assert.deepStrictEqual(
					result.cases.map((c) => c.caseId),
					[2, 1]
				);
				assert.strictEqual(result.total, 2);
				assert.strictEqual(result.page, 1);
			});

			it('should filters out cases within 5km of inspector and handles page bounds', async () => {
				const mockClient = newMockClient();
				const cacheClient = new CachedCasesClient(mockClient);

				const inspectorCoords = { lat: 0.01, lng: 0.01 };
				const nearCase = makeCase({ caseId: 1, lat: 0.01, lng: 0.015 });
				const farCase = makeCase({ caseId: 2, lat: 0.01, lng: 0.11 });
				const allCases = [nearCase, farCase];

				cacheClient.getAllParentCases = mock.fn(() => Promise.resolve(allCases));

				const result = await cacheClient.getCases({ inspectorCoordinates: inspectorCoords }, 'distance', 5, 1);

				assert.strictEqual(result.page, 1);
				assert.strictEqual(result.total, 1);
				assert.deepStrictEqual(
					result.cases.map((c) => c.caseId),
					[2]
				);
			});
		});

		describe('use of cache', () => {
			describe('shouldTryCache', () => {
				it('should return false if no cached value', async (ctx) => {
					const now = new Date('2025-01-30T00:00:00.000Z');
					ctx.mock.timers.enable({ apis: ['Date'], now });
					const mockClient = {
						lastCasesUpdate: mock.fn(() => new Date('2025-01-29T00:00:00.000Z'))
					};
					const cacheClient = new CachedCasesClient(mockClient);
					const shouldTryCache = await cacheClient.shouldTryCache();
					assert.deepStrictEqual(shouldTryCache, false);
				});
				it('should return true if no recent updates', async (ctx) => {
					// make a request to fill the cache
					const now = new Date('2025-01-30T00:00:00.000Z');
					ctx.mock.timers.enable({ apis: ['Date'], now });
					const mockClient = {
						getAllCases: mock.fn(() => []),
						lastCasesUpdate: mock.fn(() => new Date('2025-01-29T00:00:00.000Z'))
					};
					const cacheClient = new CachedCasesClient(mockClient);
					await cacheClient.getAllCases();

					// advance time
					const then = new Date('2025-01-30T00:05:00.000Z');
					ctx.mock.timers.setTime(then.getTime());
					const shouldTryCache = await cacheClient.shouldTryCache();
					assert.deepStrictEqual(shouldTryCache, true);
				});

				it('should fetch false if recent updates', async (ctx) => {
					// make a request to fill the cache
					const now = new Date('2025-01-30T00:00:00.000Z');
					ctx.mock.timers.enable({ apis: ['Date'], now });
					const mockClient = {
						getAllCases: mock.fn(() => []),
						lastCasesUpdate: mock.fn(() => new Date('2025-01-30T00:02:00.000Z'))
					};
					const cacheClient = new CachedCasesClient(mockClient);
					await cacheClient.getAllCases();

					// advance time
					const then = new Date('2025-01-30T00:05:00.000Z');
					ctx.mock.timers.setTime(then.getTime());
					const shouldTryCache = await cacheClient.shouldTryCache();
					assert.deepStrictEqual(shouldTryCache, false);
				});
			});
			it('should return cached entry if no recent updates', async (ctx) => {
				// make a request to fill the cache
				const now = new Date('2025-01-30T00:00:00.000Z');
				ctx.mock.timers.enable({ apis: ['Date'], now });
				const mockClient = {
					getAllCases: mock.fn(() => [1, 2, 3]),
					lastCasesUpdate: mock.fn(() => new Date('2025-01-29T00:00:00.000Z'))
				};
				const cacheClient = new CachedCasesClient(mockClient);
				await cacheClient.getAllCases();

				// advance time
				const then = new Date('2025-01-30T00:05:00.000Z');
				ctx.mock.timers.setTime(then.getTime());
				const cases = await cacheClient.getAllCases();
				assert.deepStrictEqual(cases, [1, 2, 3]);
			});

			it('should fetch new values if recent updates', async (ctx) => {
				// make a request to fill the cache
				const now = new Date('2025-01-30T00:00:00.000Z');
				ctx.mock.timers.enable({ apis: ['Date'], now });
				const mockClient = {
					getAllCases: mock.fn(() => [1, 2, 3]),
					lastCasesUpdate: mock.fn(() => new Date('2025-01-30T00:02:00.000Z'))
				};
				const cacheClient = new CachedCasesClient(mockClient);
				await cacheClient.getAllCases();
				assert.strictEqual(mockClient.getAllCases.mock.callCount(), 1);

				// advance time
				const then = new Date('2025-01-30T00:05:00.000Z');
				ctx.mock.timers.setTime(then.getTime());
				mockClient.getAllCases.mock.mockImplementationOnce(() => [5, 6, 7]);
				const cases = await cacheClient.getAllCases();
				assert.strictEqual(mockClient.getAllCases.mock.callCount(), 2);
				assert.deepStrictEqual(cases, [5, 6, 7]);
			});
		});
	});
});
