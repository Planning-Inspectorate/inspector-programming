import { describe, test } from 'node:test';
import { TestServer } from '@planning-inspectorate/core/testing';
import { OsApiClient } from './os-api-client.js';
import assert from 'node:assert';
import express from 'express';

describe('os-api-client', () => {
	test('returns the json response', async (ctx) => {
		const app = express();
		app.use((req, res) => {
			res.status(200).json({ header: { title: 'Test', version: '1.0' }, results: [{ address: 1 }] });
		});
		const server = await TestServer.withContext(ctx, app);

		const client = new OsApiClient('test', { timeout: 500, baseUrl: `http://localhost:${server.port}` });
		const res = await client.addressesForPostcode('AB12 3CD');
		assert.strictEqual(typeof res, 'object');
		assert.strictEqual(res.header.title, 'Test');
		assert.strictEqual(res.header.version, '1.0');
		assert.strictEqual(res.results.length, 1);
	});
	test('abort requests after the configured timeout', async (ctx) => {
		// this test server ignores all requests!
		const app = express();
		app.use(() => {});
		const server = await TestServer.withContext(ctx, app);

		const client = new OsApiClient('test', { timeout: 500, baseUrl: `http://localhost:${server.port}` });
		await assert.rejects(() => client.addressesForPostcode('AB12 3CD'), {
			name: 'Error',
			message: 'Request to /search/places/v1/postcode timed out after 500ms'
		});
	});
});
