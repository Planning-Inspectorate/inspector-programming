import { beforeEach, describe, mock, test } from 'node:test';
import assert from 'assert';
import { buildPostCases } from './controller.js';
import { mockLogger } from '@pins/inspector-programming-lib/testing/mock-logger.js';

describe('controller.js', () => {
	describe('buildPostCases', () => {
		beforeEach(() => {
			mockGetCbosApiClientForSession.mock.resetCalls();
			mockCbosApiClient.patchAppeal.mock.resetCalls();
			mockCasesClient.getCaseByReference.mock.resetCalls();
			mockCasesClient.getLinkedCasesByParentCaseId.mock.resetCalls();
		});
		const mockCasesClient = {
			getCaseByReference: mock.fn(),
			getLinkedCasesByParentCaseId: mock.fn()
		};
		const appeal = { caseId: 'caseId', linkedCaseStatus: 'child' };
		mockCasesClient.getCaseByReference.mock.mockImplementation(() => appeal);
		const mockCbosApiClient = {
			patchAppeal: mock.fn()
		};
		const mockGetCbosApiClientForSession = mock.fn();
		mockGetCbosApiClientForSession.mock.mockImplementation(() => mockCbosApiClient);
		const mockService = () => {
			return {
				logger: mockLogger(),
				getCbosApiClientForSession: mockGetCbosApiClientForSession,
				casesClient: mockCasesClient
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

		test('should render 500 template when update to cbos fails on all cases', async () => {
			mockCbosApiClient.patchAppeal.mock.mockImplementationOnce(() => {
				throw new Error();
			});
			const service = mockService();
			const req = { body: { inspectorId: 'inspectorId', selectedCases: ['1'] }, session: {} };
			const res = { render: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.calls[0].arguments[0], 'views/errors/500.njk');
			assert.deepStrictEqual(res.render.mock.calls[0].arguments[1], {});
		});

		test('should render 500 template when update to cbos fails on some cases', async () => {
			mockCbosApiClient.patchAppeal.mock.mockImplementationOnce(() => {
				throw new Error();
			});
			const service = mockService();
			const req = { body: { inspectorId: 'inspectorId', selectedCases: ['1', '2'] }, session: {} };
			const res = { render: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 2);
			assert.strictEqual(res.render.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.calls[0].arguments[0], 'views/errors/500.njk');
			assert.deepStrictEqual(res.render.mock.calls[0].arguments[1], {
				bodyCopy: 'Try again later. The following cases were not assigned.',
				failedCases: ['1']
			});
		});
	});
});
