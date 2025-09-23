import { beforeEach, describe, test, mock } from 'node:test';
import {
	assignCasesToInspector,
	getCaseAndLinkedCasesIds,
	getLinkedCaseIdsOfParentId,
	getCaseDetails
} from './case.js';
import assert from 'assert';

const mockSession = {};
const mockLogger = {
	warn: mock.fn(),
	error: mock.fn()
};
const mockCbosApiClient = {
	patchAppeal: mock.fn(),
	fetchAppealDetails: mock.fn()
};
const mockGetCbosApiClientForSession = mock.fn();
mockGetCbosApiClientForSession.mock.mockImplementation(() => mockCbosApiClient);

const mockGetLinkedCasesByParentCaseId = mock.fn();
const mockGetCaseById = mock.fn();
const mockDeleteCases = mock.fn();

const mockService = {
	logger: mockLogger,
	getCbosApiClientForSession: mockGetCbosApiClientForSession,
	casesClient: {
		getLinkedCasesByParentCaseId: mockGetLinkedCasesByParentCaseId,
		getCaseById: mockGetCaseById,
		deleteCases: mockDeleteCases
	}
};

beforeEach(() => {
	mockGetCbosApiClientForSession.mock.resetCalls();
	mockGetLinkedCasesByParentCaseId.mock.resetCalls();
	mockGetCaseById.mock.resetCalls();
	mockService.logger.error.mock.resetCalls();
	mockService.logger.warn.mock.resetCalls();
	mockCbosApiClient.fetchAppealDetails.mock.resetCalls();
	mockCbosApiClient.patchAppeal.mock.resetCalls();
});

describe('assignCasesToInspector', () => {
	test('should update cases when valid inspector id and case id list is given', async () => {
		const appealsDetailsList = [
			{ appealId: 1, appealReference: '1' },
			{ appealId: 2, appealReference: '2' },
			{ appealId: 3, appealReference: '3' }
		];
		mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
		const { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences } = await assignCasesToInspector(
			mockSession,
			mockService,
			'inspector id',
			[1, 2, 3]
		);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
		assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 3);
		assert.strictEqual(mockDeleteCases.mock.callCount(), 1);
		assert.deepStrictEqual(mockDeleteCases.mock.calls[0].arguments[0], ['1', '2', '3']);
		assert.deepStrictEqual(failedCaseReferences, []);
		assert.deepStrictEqual(failedCaseIds, []);
		assert.deepStrictEqual(alreadyAssignedCaseReferences, []);
	});

	test('should return case reference and id when case fails to be updated', async () => {
		const appealsDetailsList = [{ appealId: 1, appealReference: '1' }];
		mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
		mockCbosApiClient.patchAppeal.mock.mockImplementationOnce(() => {
			throw new Error();
		});
		const { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences } = await assignCasesToInspector(
			mockSession,
			mockService,
			'inspector id',
			[1]
		);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
		assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 1);
		assert.strictEqual(mockService.logger.error.mock.callCount(), 1);
		assert.deepStrictEqual(failedCaseReferences, ['1']);
		assert.deepStrictEqual(failedCaseIds, [1]);
		assert.deepStrictEqual(alreadyAssignedCaseReferences, []);
	});

	test('should return case reference when case is already assigned', async () => {
		const appealsDetailsList = [{ appealId: 1, appealReference: '1', inspector: 'inspectorId' }];
		mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
		const { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences } = await assignCasesToInspector(
			mockSession,
			mockService,
			'inspector id',
			[1]
		);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
		assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 0);
		assert.deepStrictEqual(failedCaseReferences, []);
		assert.deepStrictEqual(failedCaseIds, []);
		assert.deepStrictEqual(alreadyAssignedCaseReferences, ['1']);
	});

	test('should return only failed case ids if unable to get latest cbos data', async () => {
		mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => {
			throw new Error();
		});
		const { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences } = await assignCasesToInspector(
			mockSession,
			mockService,
			'inspector id',
			[1]
		);
		assert.deepStrictEqual(failedCaseReferences, []);
		assert.deepStrictEqual(failedCaseIds, [1]);
		assert.deepStrictEqual(alreadyAssignedCaseReferences, []);
	});

	test('should not update case if appealId in case details is undefined', async () => {
		const appealsDetailsList = [{ appealId: undefined, appealReference: '1' }];
		mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
		const { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences } = await assignCasesToInspector(
			mockSession,
			mockService,
			'inspector id',
			[1]
		);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
		assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 0);
		assert.deepStrictEqual(failedCaseReferences, ['1']);
		assert.deepStrictEqual(failedCaseIds, [undefined]);
		assert.deepStrictEqual(alreadyAssignedCaseReferences, []);
	});

	test('should not update case if appealReference in case details is undefined', async () => {
		const appealsDetailsList = [{ appealId: 1, appealReference: undefined }];
		mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
		const { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences } = await assignCasesToInspector(
			mockSession,
			mockService,
			'inspector id',
			[1]
		);
		assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
		assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 0);
		assert.deepStrictEqual(failedCaseReferences, [undefined]);
		assert.deepStrictEqual(failedCaseIds, [1]);
		assert.deepStrictEqual(alreadyAssignedCaseReferences, []);
	});
});

describe('getLinkedCaseIdsOfParentId', () => {
	test('should get all linked cases ids from parent case id', async () => {
		const linkedCases = [{ caseId: '1' }, { caseId: '2' }, { caseId: '3' }];
		const expectedLinkedCaseIds = ['1', '2', '3'];
		mockGetLinkedCasesByParentCaseId.mock.mockImplementationOnce(() => linkedCases);
		const linkedCasesIds = await getLinkedCaseIdsOfParentId('caseId', mockService);
		assert.strictEqual(mockGetLinkedCasesByParentCaseId.mock.callCount(), 1);
		assert.deepStrictEqual(linkedCasesIds, expectedLinkedCaseIds);
	});
});

describe('getCaseAndLinkedCasesIds', () => {
	test('should add linked cases ids to parent case ids list', async () => {
		const caseIds = [1];
		const appeal = { caseReference: '1', caseId: 1, linkedCaseStatus: 'Parent' };
		const linkedCases = [{ caseId: 2 }, { caseId: 3 }, { caseId: 4 }];
		const expectedCaseIds = [1, 2, 3, 4];
		mockGetLinkedCasesByParentCaseId.mock.mockImplementationOnce(() => linkedCases);
		mockGetCaseById.mock.mockImplementationOnce(() => appeal);
		const casesIdsList = await getCaseAndLinkedCasesIds(caseIds, mockService);
		assert.strictEqual(mockGetLinkedCasesByParentCaseId.mock.callCount(), 1);
		assert.strictEqual(mockGetCaseById.mock.callCount(), 1);
		assert.deepStrictEqual(casesIdsList, expectedCaseIds);
	});

	test('should not add linked if linked case status is child', async () => {
		const caseIds = [1];
		const appeal = { caseReference: '1', caseId: 1, linkedCaseStatus: 'Child' };
		mockGetCaseById.mock.mockImplementationOnce(() => appeal);
		const casesIdsList = await getCaseAndLinkedCasesIds(caseIds, mockService);
		assert.strictEqual(mockGetLinkedCasesByParentCaseId.mock.callCount(), 0);
		assert.strictEqual(mockGetCaseById.mock.callCount(), 1);
		assert.deepStrictEqual(casesIdsList, caseIds);
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
