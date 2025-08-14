import { describe, it, mock } from 'node:test';
import { buildInitCasesClient, CachedCasesClient } from './cached-cases-client.js';
import assert from 'node:assert';

describe('cached-entra-client', () => {
	describe('buildInitEntraClient', () => {
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
	});
});
