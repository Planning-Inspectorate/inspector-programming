import { describe, it } from 'node:test';
import { chunk } from './chunk.js';
import assert from 'node:assert';

describe('chunk', () => {
	it('should return one array if they fit in one chunk', () => {
		const chunks = chunk([1, 2, 3], 5);
		assert.strictEqual(chunks.length, 1);
		assert.deepStrictEqual(chunks[0], [1, 2, 3]);
	});
	it('should return multiple arrays per chunk size', () => {
		const chunks = chunk(
			Array.from({ length: 102 }, (_, i) => i + 1),
			5
		);
		assert.strictEqual(chunks.length, 21);
		assert.deepStrictEqual(chunks[0], [1, 2, 3, 4, 5]);
		assert.deepStrictEqual(chunks[20], [101, 102]);
	});
	it('should return no empty arrays', () => {
		const chunks = chunk(
			Array.from({ length: 102 }, (_, i) => i + 1),
			5
		);
		assert.strictEqual(chunks.length, 21);
		for (const c of chunks) {
			assert.ok(c.length > 0);
		}
		const chunks2 = chunk(
			Array.from({ length: 100 }, (_, i) => i + 1),
			5
		);
		assert.strictEqual(chunks2.length, 20);
		for (const c of chunks2) {
			assert.ok(c.length > 0);
		}
	});
});
