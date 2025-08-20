import { beforeEach, describe, it, mock } from 'node:test';
import { assignCasesToInspector } from './case.js';
import { strict as assert } from 'node:assert';

const mockSession = {};
const mockLogger = {
	warn: mock.fn(),
	error: mock.fn()
};
const mockCbosApiClient = {
	patchAppeal: mock.fn()
};
const mockGetCbosApiClientForSession = mock.fn();
mockGetCbosApiClientForSession.mock.mockImplementation(() => mockCbosApiClient);

const mockService = {
	logger: mockLogger,
	getCbosApiClientForSession: mockGetCbosApiClientForSession
};

beforeEach(() => {
	mockGetCbosApiClientForSession.mock.resetCalls();
	mockService.logger.error.mock.resetCalls();
	mockService.logger.warn.mock.resetCalls();
});

describe('case', () => {
	it('should return without calling cbos when inspector id is null', async () => {
		await assignCasesToInspector(mockSession, mockService, null, []);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 0);
		assert.strictEqual(mockService.logger.warn.mock.callCount(), 1);
	});

	it('should return without calling cbos when inspector id is blank', async () => {
		await assignCasesToInspector(mockSession, mockService, '', []);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 0);
		assert.strictEqual(mockService.logger.warn.mock.callCount(), 1);
	});

	it('should update cases when valid inspector id and case id list is given', async () => {
		await assignCasesToInspector(mockSession, mockService, 'inspector id', ['1', '2', '3']);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
		assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 3);
	});

	it('should log when a case fails to be updated', async () => {
		mockCbosApiClient.patchAppeal.mock.mockImplementationOnce(() => {
			throw new Error();
		});
		await assignCasesToInspector(mockSession, mockService, 'inspector id', ['1']);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
		assert.strictEqual(mockService.logger.error.mock.callCount(), 1);
	});
});
