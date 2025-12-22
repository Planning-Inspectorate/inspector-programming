import { describe, test } from 'node:test';
import assert from 'node:assert';
import Ajv from 'ajv';
import { getCachedAjv } from './cached-ajv.js';

describe('cached-ajv', () => {
	test('should return an Ajv instance', async () => {
		const ajv = await getCachedAjv();
		assert.ok(ajv instanceof Ajv, 'expected an Ajv instance');
	});

	test('should return the same cached instance on subsequent calls', async () => {
		const ajv1 = await getCachedAjv();
		const ajv2 = await getCachedAjv();
		assert.strictEqual(ajv1, ajv2);
	});
});
