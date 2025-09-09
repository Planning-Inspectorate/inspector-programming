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
			const mockClient = {};
			const mockCache = {
				get: mock.fn(() => [1, 2, 3])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const cases = await cacheClient.getAllCases();
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(cases, [1, 2, 3]);
		});
		it('should fetch new value if no cache value', async () => {
			const mockClient = { getAllCases: mock.fn(() => [3, 4, 5]) };
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

		it('should return case by case reference', async () => {
			const mockClient = {};
			const mockCache = {
				get: mock.fn(() => [{ caseReference: '1' }, { caseReference: '2' }, { caseReference: '3' }])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const appeal = await cacheClient.getCaseByReference('2');
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(appeal, { caseReference: '2' });
		});

		it('should return linked cases by lead case reference', async () => {
			const mockClient = {};
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
