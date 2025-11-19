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
	error: mock.fn(),
	info: mock.fn()
};
const mockCbosApiClient = {
	patchAppeal: mock.fn(() => Promise.resolve()),
	fetchAppealDetails: mock.fn()
};
const mockGetCbosApiClientForSession = mock.fn();
mockGetCbosApiClientForSession.mock.mockImplementation(() => mockCbosApiClient);

const mockGetLinkedCasesByParentCaseId = mock.fn();
const mockGetCaseById = mock.fn();

const mockService = {
	logger: mockLogger,
	getCbosApiClientForSession: mockGetCbosApiClientForSession,
	casesClient: {
		getLinkedCasesByParentCaseId: mockGetLinkedCasesByParentCaseId,
		getCaseById: mockGetCaseById
	}
};

beforeEach(() => {
	mockGetCbosApiClientForSession.mock.resetCalls();
	mockGetLinkedCasesByParentCaseId.mock.resetCalls();
	mockGetCaseById.mock.resetCalls();
	mockService.logger.error.mock.resetCalls();
	mockService.logger.warn.mock.resetCalls();
	mockService.logger.info.mock.resetCalls();
	mockCbosApiClient.fetchAppealDetails.mock.resetCalls();
	mockCbosApiClient.patchAppeal.mock.resetCalls();
	mockCbosApiClient.patchAppeal.mock.mockImplementation(() => Promise.resolve());
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
		assert.strictEqual(mockService.logger.error.mock.callCount(), 0);
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

	test('assignCasesToInspector assigns parent and child together on full success', async () => {
		const appealsDetailsList = [
			{ appealId: 100, appealReference: 'PARENT_X' },
			{ appealId: 101, appealReference: 'CHILD_X' }
		];
		mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
		const { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences } = await assignCasesToInspector(
			mockSession,
			mockService,
			'inspector id',
			[100, 101]
		);
		assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 2);
		assert.deepStrictEqual(failedCaseReferences, []);
		assert.deepStrictEqual(failedCaseIds, []);
		assert.deepStrictEqual(alreadyAssignedCaseReferences, []);
	});

	test('should return refences and ids when some cases fail (partial success scenario)', async () => {
		const appealsDetailsList = [
			{ appealId: 1, appealReference: 'PARENT' },
			{ appealId: 2, appealReference: 'CHILD' }
		];
		mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
		mockCbosApiClient.patchAppeal.mock.mockImplementation((id) => {
			if (id === 2) throw new Error('child failure');
			return Promise.resolve();
		});
		const { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences } = await assignCasesToInspector(
			mockSession,
			mockService,
			'inspector id',
			[1, 2]
		);
		assert.deepStrictEqual(alreadyAssignedCaseReferences, []);
		assert.deepStrictEqual(failedCaseReferences, ['CHILD']);
		assert.deepStrictEqual(failedCaseIds, [2]);
	});

	test('should return refences and ids when all cases fail (both failures scenario)', async () => {
		const appealsDetailsList = [
			{ appealId: 10, appealReference: 'PARENT_FAIL' },
			{ appealId: 11, appealReference: 'CHILD_FAIL' }
		];
		mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
		mockCbosApiClient.patchAppeal.mock.mockImplementation(() => {
			throw new Error('failure');
		});
		const { failedCaseReferences, failedCaseIds, alreadyAssignedCaseReferences } = await assignCasesToInspector(
			mockSession,
			mockService,
			'inspector id',
			[10, 11]
		);
		assert.deepStrictEqual(alreadyAssignedCaseReferences, []);
		assert.deepStrictEqual(failedCaseIds.sort(), [10, 11]);
		assert.deepStrictEqual(failedCaseReferences.sort(), ['CHILD_FAIL', 'PARENT_FAIL'].sort());
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
		mockGetCaseById.mock.mockImplementation((id) => {
			if (id === 1) return appeal;
			if ([2, 3, 4].includes(id)) return { caseReference: String(id), caseId: id, linkedCaseStatus: 'Child' };
			return undefined;
		});
		const { caseIds: casesIdsList } = await getCaseAndLinkedCasesIds(caseIds, mockService);
		assert.strictEqual(mockGetLinkedCasesByParentCaseId.mock.callCount(), 1);
		assert.strictEqual(mockGetCaseById.mock.callCount(), 4);
		assert.deepStrictEqual(casesIdsList.sort(), expectedCaseIds.sort());
	});

	test('should not add linked if linked case status is child', async () => {
		const caseIds = [1];
		const appeal = { caseReference: '1', caseId: 1, linkedCaseStatus: 'Child' };
		mockGetCaseById.mock.mockImplementationOnce(() => appeal);
		const { caseIds: casesIdsList } = await getCaseAndLinkedCasesIds(caseIds, mockService);
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
