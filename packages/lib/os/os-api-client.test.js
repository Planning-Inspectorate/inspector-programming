import { describe, test } from 'node:test';
import { TestServer } from '../testing/test-server.js';
import { OsApiClient } from './os-api-client.js';
import assert from 'node:assert';
import express from 'express';

describe('os-api-client', () => {
	test('returns the json response', async (ctx) => {
		const app = express();
		app.use((req, res) => {
			res.status(200).json({ header: { title: 'Test', version: '1.0' }, results: [{ address: 1 }] });
		});
		const server = await newTestServer(ctx, app);

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
		const server = await newTestServer(ctx, app);

		const client = new OsApiClient('test', { timeout: 500, baseUrl: `http://localhost:${server.port}` });
		await assert.rejects(() => client.addressesForPostcode('AB12 3CD'), {
			name: 'AbortError',
			message: 'This operation was aborted'
		});
	});
});

/**
 * @param {import('node:test').TestContext} ctx
 * @param {import('express').Express} app
 * @returns {Promise<TestServer>}
 */
async function newTestServer(ctx, app) {
	const server = new TestServer(app);
	await server.start();
	ctx.after(async () => await server.stop());
	return server;
}
