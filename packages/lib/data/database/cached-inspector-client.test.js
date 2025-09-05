import { describe, it, mock } from 'node:test';
import { buildInitInspectorClient, CachedInspectorClient } from './cached-inspector-client.js';
import assert from 'node:assert';

describe('cached-inspector-client', () => {
	describe('buildInitCasesClient', () => {
		const mockClient = {};
		const mockCache = {
			get: mock.fn(() => [1, 2, 3])
		};

		it('should return a CachedInspectorClient', () => {
			const initEntraClient = buildInitInspectorClient(mockClient, mockCache);
			assert.strictEqual(initEntraClient instanceof CachedInspectorClient, true);
		});
	});
	describe('CachedInspectorClient', () => {
		it('should return cached entry if present', async () => {
			const mockClient = {};
			const mockCache = {
				get: mock.fn(() => [1, 2, 3])
			};
			const cacheClient = new CachedInspectorClient(mockClient, mockCache);
			const inspectors = await cacheClient.getAllInspectors();
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(inspectors, [1, 2, 3]);
		});
		it('should fetch new value if no cache value', async () => {
			const mockClient = { getAllInspectors: mock.fn(() => [3, 4, 5]) };
			const mockCache = {
				get: mock.fn(),
				set: mock.fn()
			};
			const cacheClient = new CachedInspectorClient(mockClient, mockCache);
			const cases = await cacheClient.getAllInspectors();
			assert.deepStrictEqual(cases, [3, 4, 5]);
			assert.strictEqual(mockClient.getAllInspectors.mock.callCount(), 1);
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.strictEqual(mockCache.set.mock.callCount(), 1);
		});
	});
});
