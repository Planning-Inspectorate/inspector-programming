import { test, beforeEach, afterEach, mock, describe } from 'node:test';
import assert from 'assert';
import { CbosApiClient } from './cbos-api-client.js';
import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';
import { mockLogger as newMockLogger } from '../../testing/mock-logger.js';

let client;
const mockOsApiClient = {
	addressesForPostcode: mock.fn()
};
let mockLogger;

const cbosConfig = {
	apiUrl: 'http://mock-api',
	apiHeader: 'mock-header',
	timeoutMs: 100
};

let originalFetch;

describe('cboas-api-client', () => {
	beforeEach(() => {
		mockLogger = newMockLogger();
		client = new CbosApiClient(cbosConfig, mockOsApiClient, mockLogger);
		originalFetch = global.fetch;
		mockOsApiClient.addressesForPostcode.mock.resetCalls();
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	test('fetchAppealIds returns appeal IDs', async () => {
		global.fetch = async () => ({
			ok: true,
			json: async () => ({
				items: [
					{ appealId: '6000089', appealStatus: APPEAL_CASE_STATUS.READY_TO_START },
					{ appealId: '6000088', appealStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE },
					{ appealId: '6000087', appealStatus: APPEAL_CASE_STATUS.STATEMENTS },
					{ appealId: '6000086', appealStatus: APPEAL_CASE_STATUS.FINAL_COMMENTS },
					{ appealId: '6000085', appealStatus: APPEAL_CASE_STATUS.EVENT },
					{ appealId: '6000084', appealStatus: APPEAL_CASE_STATUS.EVIDENCE },
					{ appealId: '6000083', appealStatus: APPEAL_CASE_STATUS.WITNESSES }
				]
			})
		});
		const ids = await client.fetchAppealIds();
		assert.deepStrictEqual(ids, ['6000089', '6000088', '6000087', '6000086', '6000085', '6000084', '6000083']);
	});

	test('fetchAppealIds returns all appeal IDs', async () => {
		const responses = [
			{
				ok: true,
				json: async () => ({
					items: [{ appealId: '6000084', appealStatus: APPEAL_CASE_STATUS.READY_TO_START }],
					itemCount: 2,
					pageCount: 2
				})
			},
			{
				ok: true,
				json: async () => ({
					items: [{ appealId: '6000083', appealStatus: APPEAL_CASE_STATUS.READY_TO_START }],
					itemCount: 2,
					pageCount: 2
				})
			}
		];
		let call = 0;
		global.fetch = async () => responses[call++];
		const ids = await client.fetchAppealIds({ fetchAll: true });
		assert.deepStrictEqual(ids, ['6000084', '6000083']);
	});

	test('fetchAppealIds throws on error', async () => {
		global.fetch = async () => ({ ok: false, status: 500 });
		await assert.rejects(() => client.fetchAppealIds(), /Failed to fetch appeal IDs/);
	});

	test('fetchAppealDetails returns details for each id', async () => {
		const responses = [
			{ ok: true, json: async () => ({ id: '6000084' }) },
			{ ok: true, json: async () => ({ id: '6000083' }) }
		];
		let call = 0;
		global.fetch = async () => responses[call++];
		const details = await client.fetchAppealDetails(['6000084', '6000083']);
		assert.deepStrictEqual(details, [{ id: '6000084' }, { id: '6000083' }]);
	});

	test('fetchAppealTypes throws an error', async () => {
		global.fetch = async () => ({ ok: false, status: 500 });
		await assert.rejects(() => client.fetchAppealTypes());
	});

	test('getAppealType returns display key', async () => {
		const testType1 = { id: 1, type: 'testType', key: 'key', processCode: 'K', enabled: true };
		const testType2 = { id: 2, type: 'testType2', key: 'anotherKey', processCode: 'D', enabled: true };
		mock.method(client, 'fetchAppealTypes', () => [testType1, testType2]);

		const key = await client.getAppealType('testType2');
		assert.strictEqual(key, 'anotherKey');
	});

	test('getAppealType returns Unknown Appeal Type if not found', async () => {
		const testType1 = { id: 1, type: 'testType', key: 'key', processCode: 'K', enabled: true };
		const testType2 = { id: 2, type: 'testType2', key: 'anotherKey', processCode: 'D', enabled: true };
		mock.method(client, 'fetchAppealTypes', () => [testType1, testType2]);

		const key = await client.getAppealType('Appeal type');
		assert.strictEqual(key, 'Unknown Appeal Type');
	});

	test('appealToAppealCaseModel should maps parent appeal values correctly', async () => {
		const createdAtDate = new Date(2023, 1, 1);
		const validAtDate = new Date(2023, 2, 2);
		const finalCommentsDueDate = new Date(2023, 3, 3);
		const c = {
			appealId: 1,
			appealReference: '60001',
			appealType: 'Enforcement notice appeal',
			appealStatus: 'issue_determination',
			procedureType: 'procedure',
			allocationDetails: {
				level: 'level',
				band: 5
			},
			appealSite: {
				addressLine1: 'address line 1',
				addressLine2: 'address line 2',
				county: 'county',
				postCode: 'postcode'
			},
			localPlanningDepartment: 'planning department',
			lpaRegion: 'region',
			createdAt: createdAtDate,
			validAt: validAtDate,
			appealTimetable: {
				finalCommentsDueDate: finalCommentsDueDate
			},
			isParentAppeal: true,
			isChildAppeal: false,
			linkedAppeals: [{ appealReference: 'linked reference 1' }]
		};

		const lpaData = [{ id: 'lpaId', name: 'planning department', lpaCode: 'lpaCode', email: 'lpa@email.com' }];

		const appealCoordinates = {
			results: [{ DPA: { LAT: 1.23, LNG: 4.56 } }]
		};

		mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => appealCoordinates);
		mock.method(client, 'fetchAppealTypes', () => [{ type: 'Enforcement notice appeal', key: 'C' }]);

		const expectedCase = {
			caseId: 1,
			caseReference: '60001',
			caseType: 'C',
			caseStatus: 'issue_determination',
			caseProcedure: 'procedure',
			originalDevelopmentDescription: '',
			allocationLevel: 'level',
			allocationBand: 5,
			siteAddressLine1: 'address line 1',
			siteAddressLine2: 'address line 2',
			siteAddressTown: '',
			siteAddressCounty: 'county',
			siteAddressPostcode: 'postcode',
			siteAddressLatitude: 1.23,
			siteAddressLongitude: 4.56,
			lpaCode: 'lpaCode',
			lpaName: 'planning department',
			caseCreatedDate: createdAtDate,
			caseValidDate: validAtDate,
			finalCommentsDueDate: finalCommentsDueDate,
			linkedCaseStatus: 'Parent',
			leadCaseReference: undefined,
			childCaseReferences: [{ caseReference: 'linked reference 1' }]
		};

		const mappedCase = await client.appealToAppealCaseModel(c, lpaData);
		assert.deepStrictEqual(mappedCase, expectedCase);
	});

	test('getAppealCoordinates should handle DPA values if returned by OS API', async () => {
		const c = {
			appealSite: {
				postCode: 'postcode'
			}
		};

		const appealCoordinates = {
			results: [{ DPA: { LAT: 1.23, LNG: 4.56 } }]
		};

		mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => appealCoordinates);

		const coordinates = await client.getAppealCoordinates(c);
		assert.deepStrictEqual(coordinates, { latitude: 1.23, longitude: 4.56 });
	});

	test('getAppealCoordinates should handle LPI values if returned by OS API', async () => {
		const c = {
			appealSite: {
				postCode: 'postcode'
			}
		};

		const appealCoordinates = {
			results: [{ LPI: { LAT: 1.23, LNG: 4.56 } }]
		};

		mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => appealCoordinates);

		const coordinates = await client.getAppealCoordinates(c);
		assert.deepStrictEqual(coordinates, { latitude: 1.23, longitude: 4.56 });
	});

	test('getAppealCoordinates should return nothing if error occurs', async () => {
		const c = {
			appealSite: {
				postCode: 'postcode'
			}
		};

		mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => {
			return Error();
		});

		const coordinates = await client.getAppealCoordinates(c);
		assert.strictEqual(coordinates, undefined);
	});

	test('appealToAppealCaseModel should map child appeal values correctly', async () => {
		const createdAtDate = new Date(2023, 1, 1);
		const validAtDate = new Date(2023, 2, 2);
		const finalCommentsDueDate = new Date(2023, 3, 3);
		const c = {
			appealId: 1,
			appealReference: '60001',
			appealType: 'Enforcement notice appeal',
			appealStatus: 'issue_determination',
			procedureType: 'procedure',
			allocationDetails: {
				level: 'level',
				band: 5
			},
			appealSite: {
				addressLine1: 'address line 1',
				addressLine2: 'address line 2',
				county: 'county',
				postCode: 'postcode'
			},
			localPlanningDepartment: 'planning department',
			createdAt: createdAtDate,
			validAt: validAtDate,
			appealTimetable: {
				finalCommentsDueDate: finalCommentsDueDate
			},
			isParentAppeal: false,
			isChildAppeal: true,
			linkedAppeals: [{ appealReference: 'linked reference 1' }]
		};

		const lpaData = [{ id: 'lpaId', name: 'planning department', lpaCode: 'lpaCode', email: 'lpa@email.com' }];

		const appealCoordinates = {
			results: [{ DPA: { LAT: 1.23, LNG: 4.56 } }]
		};

		mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => appealCoordinates);
		mock.method(client, 'fetchAppealTypes', () => [{ type: 'Enforcement notice appeal', key: 'C' }]);

		const expectedCase = {
			caseId: 1,
			caseReference: '60001',
			caseType: 'C',
			caseStatus: 'issue_determination',
			caseProcedure: 'procedure',
			originalDevelopmentDescription: '',
			allocationLevel: 'level',
			allocationBand: 5,
			siteAddressLine1: 'address line 1',
			siteAddressLine2: 'address line 2',
			siteAddressTown: '',
			siteAddressCounty: 'county',
			siteAddressPostcode: 'postcode',
			siteAddressLatitude: 1.23,
			siteAddressLongitude: 4.56,
			lpaCode: 'lpaCode',
			lpaName: 'planning department',
			caseCreatedDate: createdAtDate,
			caseValidDate: validAtDate,
			finalCommentsDueDate: finalCommentsDueDate,
			linkedCaseStatus: 'Child',
			leadCaseReference: 'linked reference 1',
			childCaseReferences: []
		};

		const mappedCase = await client.appealToAppealCaseModel(c, lpaData);
		assert.deepStrictEqual(mappedCase, expectedCase);
	});

	test('appealToAppealCaseModel should handle OS API error', async () => {
		const createdAtDate = new Date(2023, 1, 1);
		const validAtDate = new Date(2023, 2, 2);
		const finalCommentsDueDate = new Date(2023, 3, 3);
		const c = {
			appealId: 1,
			appealReference: '60001',
			appealType: 'Enforcement notice appeal',
			appealStatus: 'issue_determination',
			procedureType: 'procedure',
			allocationDetails: {
				level: 'level',
				band: 5
			},
			appealSite: {
				addressLine1: 'address line 1',
				addressLine2: 'address line 2',
				county: 'county',
				postCode: 'postcode'
			},
			localPlanningDepartment: 'planning department',
			lpaRegion: 'region',
			createdAt: createdAtDate,
			validAt: validAtDate,
			appealTimetable: {
				finalCommentsDueDate: finalCommentsDueDate
			},
			isParentAppeal: false,
			isChildAppeal: true,
			linkedAppeals: [{ appealReference: 'linked reference 1' }]
		};

		const lpaData = [{ id: 'lpaId', name: 'planning department', lpaCode: 'lpaCode', email: 'lpa@email.com' }];

		mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => {
			return Error();
		});
		mock.method(client, 'fetchAppealTypes', () => [{ type: 'Enforcement notice appeal', key: 'C' }]);

		const expectedCase = {
			caseId: 1,
			caseReference: '60001',
			caseType: 'C',
			caseStatus: 'issue_determination',
			caseProcedure: 'procedure',
			originalDevelopmentDescription: '',
			allocationLevel: 'level',
			allocationBand: 5,
			siteAddressLine1: 'address line 1',
			siteAddressLine2: 'address line 2',
			siteAddressTown: '',
			siteAddressCounty: 'county',
			siteAddressPostcode: 'postcode',
			siteAddressLatitude: undefined,
			siteAddressLongitude: undefined,
			lpaCode: 'lpaCode',
			lpaName: 'planning department',
			caseCreatedDate: createdAtDate,
			caseValidDate: validAtDate,
			finalCommentsDueDate: finalCommentsDueDate,
			linkedCaseStatus: 'Child',
			leadCaseReference: 'linked reference 1',
			childCaseReferences: []
		};

		const mappedCase = await client.appealToAppealCaseModel(c, lpaData);
		assert.deepStrictEqual(mappedCase, expectedCase);
	});

	test('getUnassignedCases should return cases with valid appeal statuses', async () => {
		const responses = [
			{
				ok: true,
				json: async () => ({
					items: [
						{ appealId: '1', appealStatus: APPEAL_CASE_STATUS.READY_TO_START },
						{ appealId: '2', appealStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE },
						{ appealId: '3', appealStatus: APPEAL_CASE_STATUS.STATEMENTS },
						{ appealId: '4', appealStatus: APPEAL_CASE_STATUS.FINAL_COMMENTS },
						{ appealId: '5', appealStatus: APPEAL_CASE_STATUS.EVENT },
						{ appealId: '6', appealStatus: APPEAL_CASE_STATUS.EVIDENCE },
						{ appealId: '7', appealStatus: APPEAL_CASE_STATUS.WITNESSES }
					],
					itemCount: 7,
					pageCount: 1
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '1',
					appealReference: '60001',
					appealStatus: APPEAL_CASE_STATUS.READY_TO_START,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '2',
					appealReference: '60002',
					appealStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '3',
					appealReference: '60003',
					appealStatus: APPEAL_CASE_STATUS.STATEMENTS,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '4',
					appealReference: '60004',
					appealStatus: APPEAL_CASE_STATUS.FINAL_COMMENTS,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '5',
					appealReference: '60005',
					appealStatus: APPEAL_CASE_STATUS.EVENT,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '6',
					appealReference: '60006',
					appealStatus: APPEAL_CASE_STATUS.EVIDENCE,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '7',
					appealReference: '60007',
					appealStatus: APPEAL_CASE_STATUS.WITNESSES,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => [{ id: 'lpaId', lpaName: 'lpaName', lpaCode: 'lpaCode', email: 'lpa@email.com' }]
			}
		];
		let call = 0;
		global.fetch = async () => responses[call++];
		mock.method(client, 'fetchAppealTypes', () => [{ type: 'appealType', key: 'A' }]);

		const expectedCaseReferences = ['60001', '60002', '60003', '60004', '60005', '60006', '60007'];
		const appealsData = await client.getUnassignedCases();
		assert.strictEqual(appealsData.caseReferences.length, 7);
		assert.deepStrictEqual(appealsData.caseReferences, expectedCaseReferences);
		assert.strictEqual(appealsData.cases.length, 7);
	});

	test('getUnassignedCases should not return cases with invalid appeal statuses', async () => {
		const responses = [
			{
				ok: true,
				json: async () => ({
					items: [
						{ appealId: '1', appealStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER },
						{ appealId: '2', appealStatus: APPEAL_CASE_STATUS.AWAITING_TRANSFER },
						{ appealId: '3', appealStatus: APPEAL_CASE_STATUS.CLOSED },
						{ appealId: '4', appealStatus: APPEAL_CASE_STATUS.COMPLETE },
						{ appealId: '5', appealStatus: APPEAL_CASE_STATUS.INVALID },
						{ appealId: '6', appealStatus: APPEAL_CASE_STATUS.TRANSFERRED },
						{ appealId: '7', appealStatus: APPEAL_CASE_STATUS.VALIDATION },
						{ appealId: '8', appealStatus: APPEAL_CASE_STATUS.WITHDRAWN }
					],
					itemCount: 8,
					pageCount: 1
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '1',
					appealReference: '60001',
					appealStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '2',
					appealReference: '60002',
					appealStatus: APPEAL_CASE_STATUS.AWAITING_TRANSFER,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '3',
					appealReference: '60003',
					appealStatus: APPEAL_CASE_STATUS.CLOSED,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '4',
					appealReference: '60004',
					appealStatus: APPEAL_CASE_STATUS.COMPLETE,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '5',
					appealReference: '60005',
					appealStatus: APPEAL_CASE_STATUS.INVALID,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '6',
					appealReference: '60006',
					appealStatus: APPEAL_CASE_STATUS.TRANSFERRED,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '7',
					appealReference: '60007',
					appealStatus: APPEAL_CASE_STATUS.VALIDATION,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '8',
					appealReference: '60008',
					appealStatus: APPEAL_CASE_STATUS.WITHDRAWN,
					appealType: 'appealType'
				})
			},
			{
				ok: true,
				json: async () => [{ id: 'lpaId', lpaName: 'lpaName', lpaCode: 'lpaCode', email: 'lpa@email.com' }]
			}
		];
		let call = 0;
		global.fetch = async () => responses[call++];
		CbosApiClient.appealTypesCache = [{ type: 'appealType', key: 'A' }];

		const appealsData = await client.getUnassignedCases();
		assert.strictEqual(appealsData.caseReferences.length, 0);
		assert.strictEqual(appealsData.cases.length, 0);
	});

	test('getUnassignedCases should allow child cases with invalid statuses', async () => {
		const responses = [
			{
				ok: true,
				json: async () => ({
					items: [
						{ appealId: '1', appealStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER },
						{ appealId: '2', appealStatus: APPEAL_CASE_STATUS.AWAITING_TRANSFER },
						{ appealId: '3', appealStatus: APPEAL_CASE_STATUS.CLOSED },
						{ appealId: '4', appealStatus: APPEAL_CASE_STATUS.COMPLETE },
						{ appealId: '5', appealStatus: APPEAL_CASE_STATUS.INVALID },
						{ appealId: '6', appealStatus: APPEAL_CASE_STATUS.TRANSFERRED },
						{ appealId: '7', appealStatus: APPEAL_CASE_STATUS.VALIDATION },
						{ appealId: '8', appealStatus: APPEAL_CASE_STATUS.WITHDRAWN }
					],
					itemCount: 8,
					pageCount: 1
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '1',
					appealReference: '60001',
					appealStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER,
					appealType: 'appealType',
					isChildAppeal: true
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '2',
					appealReference: '60002',
					appealStatus: APPEAL_CASE_STATUS.AWAITING_TRANSFER,
					appealType: 'appealType',
					isChildAppeal: true
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '3',
					appealReference: '60003',
					appealStatus: APPEAL_CASE_STATUS.CLOSED,
					appealType: 'appealType',
					isChildAppeal: true
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '4',
					appealReference: '60004',
					appealStatus: APPEAL_CASE_STATUS.COMPLETE,
					appealType: 'appealType',
					isChildAppeal: true
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '5',
					appealReference: '60005',
					appealStatus: APPEAL_CASE_STATUS.INVALID,
					appealType: 'appealType',
					isChildAppeal: true
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '6',
					appealReference: '60006',
					appealStatus: APPEAL_CASE_STATUS.TRANSFERRED,
					appealType: 'appealType',
					isChildAppeal: true
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '7',
					appealReference: '60007',
					appealStatus: APPEAL_CASE_STATUS.VALIDATION,
					appealType: 'appealType',
					isChildAppeal: true
				})
			},
			{
				ok: true,
				json: async () => ({
					appealId: '8',
					appealReference: '60008',
					appealStatus: APPEAL_CASE_STATUS.WITHDRAWN,
					appealType: 'appealType',
					isChildAppeal: true
				})
			},
			{
				ok: true,
				json: async () => [{ id: 'lpaId', lpaName: 'lpaName', lpaCode: 'lpaCode', email: 'lpa@email.com' }]
			}
		];
		let call = 0;
		global.fetch = async () => responses[call++];
		mock.method(client, 'fetchAppealTypes', () => [{ type: 'appealType', key: 'A' }]);

		const expectedCaseReferences = ['60001', '60002', '60003', '60004', '60005', '60006', '60007', '60008'];
		const appealsData = await client.getUnassignedCases();
		assert.strictEqual(appealsData.caseReferences.length, 8);
		assert.deepStrictEqual(appealsData.caseReferences, expectedCaseReferences);
		assert.strictEqual(appealsData.cases.length, 8);
	});

	test('patchAppeal updates appeal on ok', async () => {
		global.fetch = async () => ({
			ok: true
		});
		const appealId = '1';
		await assert.doesNotReject(() => client.patchAppeal(appealId, {}));
		assert.strictEqual(mockLogger.info.mock.callCount(), 1);
		assert.strictEqual(mockLogger.info.mock.calls[0].arguments[0], `Successfully updated appealID ${appealId}`);
	});

	test('patchAppeal handles non 200 return', async () => {
		global.fetch = async () => ({
			ok: false,
			status: 500
		});
		const appealId = '1';
		const url = `${cbosConfig.apiUrl}/appeals/${appealId}`;
		await assert.rejects(() => client.patchAppeal(appealId, {}));
		assert.strictEqual(mockLogger.error.mock.callCount(), 2);
		assert.strictEqual(
			mockLogger.error.mock.calls[0].arguments[0],
			`Failed to update appealID ${appealId} at ${url}. Status: 500`
		);
	});

	test('patchAppeal handles error when sending request', async () => {
		global.fetch = async () => {
			throw new Error('Mock Error');
		};

		const appealId = '1';
		const url = `${cbosConfig.apiUrl}/appeals/${appealId}`;
		await assert.rejects(() => client.patchAppeal(appealId, {}));
		assert.strictEqual(mockLogger.error.mock.callCount(), 1);
		assert.strictEqual(mockLogger.error.mock.calls[0].arguments[0], `Failed to update appealID ${appealId} at ${url}:`);
		assert.strictEqual(mockLogger.error.mock.calls[0].arguments[1], `Mock Error`);
	});

	test('fetchLpaData should return lpa data from cbos', async () => {
		global.fetch = async () => ({
			ok: true,
			json: async () => [{ id: 'lpaId', name: 'lpaName', lpaCode: 'lpaCode', email: 'lpa@email.com' }]
		});
		const lpaData = await client.fetchLpaData();
		assert.deepStrictEqual(lpaData, [{ id: 'lpaId', name: 'lpaName', lpaCode: 'lpaCode', email: 'lpa@email.com' }]);
	});

	test('fetchLpaData handles non 200 return', async () => {
		global.fetch = async () => ({
			ok: false,
			status: 500
		});
		const url = `${cbosConfig.apiUrl}/appeals/local-planning-authorities`;
		await assert.rejects(() => client.fetchLpaData());
		assert.strictEqual(mockLogger.error.mock.callCount(), 1);
		assert.strictEqual(
			mockLogger.error.mock.calls[0].arguments[0],
			`Error fetching local planning authorities from http://mock-api/appeals/local-planning-authorities: Failed to fetch local planning authorities from ${url}. Status: 500`
		);
	});

	test('fetchLpaData handles error when sending request', async () => {
		global.fetch = async () => {
			throw new Error('Mock Error');
		};

		const url = `${cbosConfig.apiUrl}/appeals/local-planning-authorities`;
		await assert.rejects(() => client.fetchLpaData());
		assert.strictEqual(mockLogger.error.mock.callCount(), 1);
		assert.strictEqual(
			mockLogger.error.mock.calls[0].arguments[0],
			`Error fetching local planning authorities from ${url}: Mock Error`
		);
	});

	describe('fetchAppealDetailsByReference', () => {
		test('fetches details for a single appeal reference', async () => {
			const mockAppeal = {
				appealId: '1',
				caseReference: '12345',
				appealType: 'Test Appeal',
				appealStatus: 'ready_to_start'
			};

			global.fetch = async (url) => {
				assert.strictEqual(url, 'http://mock-api/appeals/case-reference/12345');
				return {
					ok: true,
					json: async () => mockAppeal
				};
			};

			const result = await client.fetchAppealDetailsByReference(['12345']);
			assert.deepStrictEqual(result, [mockAppeal]);
		});

		test('chunks requests for more than 10 appeal references', async () => {
			const references = Array.from({ length: 15 }, (_, i) => String(i + 1));
			const mockAppealsArray = references.map((ref, i) => ({
				appealId: String(i + 1),
				caseReference: ref
			}));
			const mockAppealsMap = new Map();
			references.forEach((ref, i) => {
				mockAppealsMap.set(ref, mockAppealsArray[i]);
			});

			const fetchedUrls = new Set();
			global.fetch = async (url) => {
				fetchedUrls.add(url);
				const ref = url.split('/').pop();
				const appeal = mockAppealsMap.get(ref);
				return {
					ok: true,
					json: async () => appeal
				};
			};

			const result = await client.fetchAppealDetailsByReference(references);

			assert.strictEqual(fetchedUrls.size, 15, 'Should make 15 fetch calls');
			assert.strictEqual(result.length, 15);
			assert.deepStrictEqual(result, mockAppealsArray);
		});

		test('chunks requests with 25 references (three chunks)', async () => {
			const references = Array.from({ length: 25 }, (_, i) => String(i + 1));
			const mockAppeals = references.map((ref, i) => ({
				appealId: String(i + 1),
				caseReference: ref
			}));

			let callCount = 0;
			global.fetch = async (url) => {
				callCount++;
				const ref = url.split('/').pop();
				const index = references.indexOf(ref);
				const data = mockAppeals[index];
				return {
					ok: true,
					json: async () => data
				};
			};

			const result = await client.fetchAppealDetailsByReference(references);

			assert.strictEqual(callCount, 25);
			assert.strictEqual(result.length, 25);
			assert.deepStrictEqual(result, mockAppeals);
		});

		test('throws error when API returns non-ok response', async () => {
			global.fetch = async () => ({
				ok: false,
				status: 500
			});

			await assert.rejects(
				() => client.fetchAppealDetailsByReference(['12345']),
				/Failed to fetch details for appealReference 12345. Status: 500/
			);
		});

		test('throws error when one reference fails among multiple', async () => {
			global.fetch = async (url) => {
				if (url.includes('101')) {
					return { ok: true, json: async () => ({ appealId: '1', caseReference: '101' }) };
				} else if (url.includes('102')) {
					return { ok: false, status: 404 };
				} else if (url.includes('103')) {
					return { ok: true, json: async () => ({ appealId: '3', caseReference: '103' }) };
				}
			};

			await assert.rejects(
				() => client.fetchAppealDetailsByReference(['101', '102', '103']),
				/Failed to fetch details for appealReference 102. Status: 404/
			);
		});

		test('returns empty array when passed empty array', async () => {
			global.fetch = async () => {
				throw new Error('Should not be called');
			};

			const result = await client.fetchAppealDetailsByReference([]);
			assert.deepStrictEqual(result, []);
		});

		test('chunks process sequentially (second chunk waits for first)', async () => {
			const references = Array.from({ length: 15 }, (_, i) => String(i + 1));
			const fetchTiming = [];
			let currentTime = 0;

			global.fetch = async (url) => {
				const ref = url.split('/').pop();
				const startTime = currentTime++;
				// Simulate async work
				await new Promise((resolve) => setTimeout(resolve, 1));
				const endTime = currentTime++;
				fetchTiming.push({ ref, startTime, endTime });
				return {
					ok: true,
					json: async () => ({ caseReference: ref })
				};
			};

			await client.fetchAppealDetailsByReference(references);

			// Check that all first 10 references completed before any of the last 5 started
			const firstChunkRefs = references.slice(0, 10);
			const secondChunkRefs = references.slice(10);

			const firstChunkTimings = fetchTiming.filter((t) => firstChunkRefs.includes(t.ref));
			const secondChunkTimings = fetchTiming.filter((t) => secondChunkRefs.includes(t.ref));

			// Get the latest end time from first chunk
			const lastFirstChunkEnd = Math.max(...firstChunkTimings.map((t) => t.endTime));
			// Get the earliest start time from second chunk
			const firstSecondChunkStart = Math.min(...secondChunkTimings.map((t) => t.startTime));

			// Second chunk should not start until first chunk completes
			assert.ok(
				lastFirstChunkEnd <= firstSecondChunkStart,
				`First chunk should complete (${lastFirstChunkEnd}) before second chunk starts (${firstSecondChunkStart})`
			);
		});
	});
});
