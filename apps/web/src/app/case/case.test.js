import { beforeEach, describe, test, mock } from 'node:test';
import { assignCasesToInspector, getCaseDetails } from './case.js';
import assert from 'assert';

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

describe('assignCasesToInspector', () => {
	test('should return without calling cbos when inspector id is null', async () => {
		await assignCasesToInspector(mockSession, mockService, null, []);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 0);
		assert.strictEqual(mockService.logger.warn.mock.callCount(), 1);
		assert.deepStrictEqual(failedCases, []);
	});

	test('should return without calling cbos when inspector id is blank', async () => {
		const failedCases = await assignCasesToInspector(mockSession, mockService, '', []);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 0);
		assert.strictEqual(mockService.logger.warn.mock.callCount(), 1);
		assert.deepStrictEqual(failedCases, []);
	});

	test('should update cases when valid inspector id and case id list is given', async () => {
		const failedCases = await assignCasesToInspector(mockSession, mockService, 'inspector id', ['1', '2', '3']);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
		assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 3);
		assert.deepStrictEqual(failedCases, []);
	});

	test('should log when a case fails to be updated', async () => {
		mockCbosApiClient.patchAppeal.mock.mockImplementationOnce(() => {
			throw new Error();
		});
		const failedCases = await assignCasesToInspector(mockSession, mockService, 'inspector id', ['1']);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
		assert.strictEqual(mockService.logger.error.mock.callCount(), 1);
		assert.deepStrictEqual(failedCases, ['1']);
	});
});

describe('getCaseDetails', () => {
	test('returns case details when caseId is valid', async () => {
		const db = {
			appealCase: {
				findUnique: mock.fn(async ({ where }) => ({
					caseReference: where.caseReference,
					Events: [
						{
							id: '6900107-1',
							caseReference: '6900107',
							eventType: 'site_visit_accompanied'
						}
					],
					Specialisms: [
						{
							id: 'c938e712-bebf-4010-b618-1218ce991145',
							caseReference: '6900107',
							specialism: 'Listed building and enforcement'
						}
					]
				}))
			}
		};
		const result = await getCaseDetails(db, '6900107');
		assert.strictEqual(result.caseReference, '6900107');
		assert.deepStrictEqual(result.Events, [
			{
				id: '6900107-1',
				caseReference: '6900107',
				eventType: 'site_visit_accompanied'
			}
		]);
		assert.deepStrictEqual(result.Specialisms, [
			{
				id: 'c938e712-bebf-4010-b618-1218ce991145',
				caseReference: '6900107',
				specialism: 'Listed building and enforcement'
			}
		]);
	});

	test('returns null when caseId is missing', async () => {
		const db = {
			appealCase: {
				findUnique: mock.fn()
			}
		};
		const result = await getCaseDetails(db, '');
		assert.strictEqual(result, null);
	});

	test('returns null when caseId is null', async () => {
		const db = {
			appealCase: {
				findUnique: mock.fn()
			}
		};
		const result = await getCaseDetails(db, null);
		assert.strictEqual(result, null);
	});
});
