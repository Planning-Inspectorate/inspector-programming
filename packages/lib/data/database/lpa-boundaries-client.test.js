import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { LpaBoundariesDatabaseClient } from './lpa-boundaries-client.js';

describe('LpaBoundariesDatabaseClient', () => {
	it('returns valid stored geometries and excludes malformed data', async () => {
		const findMany = mock.fn(async () => [
			{ lpaName: 'Valid Council', geometry: '{"type":"Polygon","coordinates":[]}' },
			{ lpaName: 'Malformed Council', geometry: '{not-json}' },
			{ lpaName: 'Empty Council', geometry: null }
		]);
		const client = new LpaBoundariesDatabaseClient({ lpa: { findMany } });

		const result = await client.getLpaBoundaries();

		assert.deepEqual(result, [{ lpaName: 'Valid Council', geometry: { type: 'Polygon', coordinates: [] } }]);
		assert.equal(findMany.mock.calls.length, 1);
	});

	it('returns the cached result without querying the database again', async () => {
		const findMany = mock.fn(async () => [{ lpaName: 'Council', geometry: '{"type":"Polygon","coordinates":[]}' }]);
		const cache = {
			value: undefined,
			get() {
				return this.value;
			},
			set(_key, value) {
				this.value = value;
			}
		};
		const client = new LpaBoundariesDatabaseClient({ lpa: { findMany } }, cache);

		const first = await client.getLpaBoundaries();
		const second = await client.getLpaBoundaries();

		assert.strictEqual(first, second);
		assert.equal(findMany.mock.calls.length, 1);
	});
});
