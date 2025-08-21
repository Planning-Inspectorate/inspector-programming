import { beforeEach, describe, mock, test } from 'node:test';
import assert from 'assert';
import { buildPostCases } from './controller';
import { mockLogger } from '@pins/inspector-programming-lib/testing/mock-logger.js';

describe('controller.js', () => {
	describe('buildPostCases', () => {
		beforeEach(() => {
			mockGetCbosApiClientForSession.mock.resetCalls();
			mockCbosApiClient.patchAppeal.mock.resetCalls();
		});
		const mockCbosApiClient = {
			patchAppeal: mock.fn()
		};
		const mockGetCbosApiClientForSession = mock.fn();
		mockGetCbosApiClientForSession.mock.mockImplementation(() => mockCbosApiClient);
		const mockService = () => {
			return {
				logger: mockLogger(),
				getCbosApiClientForSession: mockGetCbosApiClientForSession
			};
		};

		test('should update one case', async () => {
			const service = mockService();
			const req = { body: { inspectorId: 'inspectorId', selectedCases: '1' } };
			const res = { redirect: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.calls[0].arguments[0], '/?inspectorId=inspectorId');
		});

		test('should update list of cases', async () => {
			const service = mockService();
			const req = { body: { inspectorId: 'inspectorId', selectedCases: ['1', '2', '3'] } };
			const res = { redirect: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 3);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.calls[0].arguments[0], '/?inspectorId=inspectorId');
		});
	});
});
