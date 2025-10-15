import { describe, it, mock } from 'node:test';
import { buildInitCasesClient, CachedCasesClient } from './cached-cases-client.js';
import assert from 'node:assert';

describe('cached-cases-client', () => {
	describe('buildInitCasesClient', () => {
		const mockClient = {};
		const mockCache = {
			get: mock.fn(() => [1, 2, 3])
		};

		it('should return a CachedCasesClient', () => {
			const initEntraClient = buildInitCasesClient(mockClient, mockCache);
			assert.strictEqual(initEntraClient instanceof CachedCasesClient, true);
		});
	});
	describe('CachedCasesClient', () => {
		it('should return cached entry if present', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [1, 2, 3])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const cases = await cacheClient.getAllCases();
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(cases, [1, 2, 3]);
		});
		it('should fetch new value if no cache value', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn(),
				getAllCases: mock.fn(() => [3, 4, 5])
			};
			const mockCache = {
				get: mock.fn(),
				set: mock.fn()
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const cases = await cacheClient.getAllCases();
			assert.deepStrictEqual(cases, [3, 4, 5]);
			assert.strictEqual(mockClient.getAllCases.mock.callCount(), 1);
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.strictEqual(mockCache.set.mock.callCount(), 1);
		});

		it('should return case by case id', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [{ caseId: 1 }, { caseId: 2 }, { caseId: 3 }])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const appeal = await cacheClient.getCaseById(2);
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(appeal, { caseId: 2 });
		});

		it('should return cases by case ids', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [{ caseId: 1 }, { caseId: 2 }, { caseId: 3 }])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const appeals = await cacheClient.getCasesByIds([2]);
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(appeals, [{ caseId: 2 }]);
		});

		it('should return linked cases by lead case reference', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [
					{ id: '1', leadCaseReference: 'A' },
					{ id: '2', leadCaseReference: 'B' },
					{ id: '3', leadCaseReference: 'A' }
				])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const linkedCases = await cacheClient.getLinkedCasesByParentCaseId('A');
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(linkedCases, [
				{ id: '1', leadCaseReference: 'A' },
				{ id: '3', leadCaseReference: 'A' }
			]);
		});

		it('should get all cases that are parent or stand alone cases', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [
					{ id: '1', linkedCaseStatus: 'Child' },
					{ id: '2', linkedCaseStatus: 'Parent' },
					{ id: '3', linkedCaseStatus: '' }
				])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const linkedCases = await cacheClient.getAllParentCases();
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(linkedCases, [
				{ id: '2', linkedCaseStatus: 'Parent' },
				{ id: '3', linkedCaseStatus: '' }
			]);
		});

		it('should remove cases from cache', async () => {
			const mockClient = { deleteCases: mock.fn() };
			const mockCache = {
				get: mock.fn(() => [{ caseId: 1 }, { caseId: 2 }, { caseId: 3 }]),
				set: mock.fn()
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			await cacheClient.deleteCases([1, 3]);
			assert.deepStrictEqual(mockCache.set.mock.calls[0].arguments[1], [{ caseId: 2 }]);
		});

		describe('use of cache', () => {
			const cacheTtl = 5 * 60 * 1000; // 5 minutes
			const newMockCache = () => {
				return {
					get: mock.fn(() => [1, 2, 3]),
					set: mock.fn(),
					get cacheTtlMs() {
						return cacheTtl;
					}
				};
			};
			describe('shouldTryCache', () => {
				it('should return true if no recent updates', async (ctx) => {
					const now = new Date('2025-01-30T00:00:00.000Z');
					ctx.mock.timers.enable({ apis: ['Date'], now });
					const mockClient = {
						lastCasesUpdate: mock.fn(() => new Date('2025-01-29T00:00:00.000Z'))
					};
					const mockCache = newMockCache();
					const cacheClient = new CachedCasesClient(mockClient, mockCache);
					const shouldTryCache = await cacheClient.shouldTryCache();
					assert.deepStrictEqual(shouldTryCache, true);
				});

				it('should fetch false if recent updates', async (ctx) => {
					const now = new Date('2025-01-30T00:05:00.000Z');
					ctx.mock.timers.enable({ apis: ['Date'], now });
					const mockClient = {
						lastCasesUpdate: mock.fn(() => new Date('2025-01-30T00:00:00.000Z'))
					};
					const mockCache = newMockCache();
					const cacheClient = new CachedCasesClient(mockClient, mockCache);
					const shouldTryCache = await cacheClient.shouldTryCache();
					assert.deepStrictEqual(shouldTryCache, false);
				});
			});
			it('should return cached entry if no recent updates', async (ctx) => {
				const now = new Date('2025-01-30T00:00:00.000Z');
				ctx.mock.timers.enable({ apis: ['Date'], now });
				const mockClient = {
					lastCasesUpdate: mock.fn(() => new Date('2025-01-29T00:00:00.000Z'))
				};
				const mockCache = newMockCache();
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const cases = await cacheClient.getAllCases();
				assert.strictEqual(mockCache.get.mock.callCount(), 1);
				assert.deepStrictEqual(cases, [1, 2, 3]);
			});

			it('should fetch new values if recent updates', async (ctx) => {
				const now = new Date('2025-01-30T00:05:00.000Z');
				ctx.mock.timers.enable({ apis: ['Date'], now });
				const mockClient = {
					lastCasesUpdate: mock.fn(() => new Date('2025-01-30T00:00:00.000Z')),
					getAllCases: mock.fn(() => [5, 6, 7])
				};
				const mockCache = newMockCache();
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const cases = await cacheClient.getAllCases();
				assert.strictEqual(mockCache.get.mock.callCount(), 0);
				assert.strictEqual(mockCache.set.mock.callCount(), 1);
				assert.strictEqual(mockClient.getAllCases.mock.callCount(), 1);
				assert.deepStrictEqual(cases, [5, 6, 7]);
			});
		});

		describe('determinePage', () => {
			it('should return requested page if valid', () => {
				const mockClient = { getAllCases: mock.fn(() => [3, 4, 5]) };
				const mockCache = {
					get: mock.fn(),
					set: mock.fn()
				};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const requestedPage = 3;
				const totalPages = 5;
				const page = cacheClient.determinePage(requestedPage, totalPages);
				assert.strictEqual(page, requestedPage);
			});
			it('should return the maximum page if requested page exceeds maximum', () => {
				const mockClient = { getAllCases: mock.fn(() => [3, 4, 5]) };
				const mockCache = {
					get: mock.fn(),
					set: mock.fn()
				};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const requestedPage = 7;
				const totalPages = 5;
				const page = cacheClient.determinePage(requestedPage, totalPages);
				assert.strictEqual(page, totalPages);
			});
			it('should return page 1 if the requested page is not a valid number', () => {
				const mockClient = { getAllCases: mock.fn(() => [3, 4, 5]) };
				const mockCache = {
					get: mock.fn(),
					set: mock.fn()
				};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const requestedPage = 'seven';
				const totalPages = 5;
				const page = cacheClient.determinePage(requestedPage, totalPages);
				assert.strictEqual(page, 1);
			});
		});
	});
});
