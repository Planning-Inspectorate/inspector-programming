import { describe, test, mock } from 'node:test';
import assert from 'assert';
import { buildAssertIsAuthenticated } from './guards.js';
import { mockLogger } from '@pins/inspector-programming-lib/testing/mock-logger.js';

describe('guards.js', () => {
	test('returns 401 if authorization header is missing or malformed', async () => {
		const logger = mockLogger();
		const authService = { authTokenUrl: 'https://auth', verifyApiToken: mock.fn() };
		const req = { get: mock.fn(() => undefined) };
		const res = {
			set: mock.fn(),
			status: mock.fn(() => res),
			send: mock.fn()
		};
		const next = mock.fn();
		const middleware = buildAssertIsAuthenticated(logger, authService);
		await middleware(req, res, next);
		assert.strictEqual(next.mock.callCount(), 0);
		assert.strictEqual(res.status.mock.callCount(), 1);
		assert.strictEqual(res.status.mock.calls[0].arguments[0], 401);
		assert.strictEqual(res.send.mock.callCount(), 1);
	});

	test('returns 403 if token verification fails', async () => {
		const logger = mockLogger();
		const authService = {
			authTokenUrl: 'https://auth',
			verifyApiToken: mock.fn(() => Promise.reject(new Error('fail')))
		};
		const req = { get: mock.fn(() => 'Bearer token') };
		const res = { sendStatus: mock.fn() };
		const next = mock.fn();
		const middleware = buildAssertIsAuthenticated(logger, authService);
		await middleware(req, res, next);
		assert.strictEqual(next.mock.callCount(), 0);
		assert.strictEqual(res.sendStatus.mock.callCount(), 1);
		assert.strictEqual(res.sendStatus.mock.calls[0].arguments[0], 403);
	});

	test('calls next if token is valid', async () => {
		const logger = mockLogger();
		const authService = { authTokenUrl: 'https://auth', verifyApiToken: mock.fn(() => Promise.resolve()) };
		const req = { get: mock.fn(() => 'Bearer token') };
		const res = {};
		const next = mock.fn();
		const middleware = buildAssertIsAuthenticated(logger, authService);
		await middleware(req, res, next);
		assert.strictEqual(authService.verifyApiToken.mock.callCount(), 1);
		assert.strictEqual(authService.verifyApiToken.mock.calls[0].arguments[0], 'token');
		assert.strictEqual(next.mock.callCount(), 1);
	});
});
