import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'assert';
import { CbosApiClient } from './cbos-api-client.js';
import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';

let client;
let warnCalls = [];
let errorCalls = [];
const mockOsApiClient = {
	addressesForPostcode: mock.fn()
};
const mockLogger = {
	warn: (...args) => warnCalls.push(args),
	error: (...args) => errorCalls.push(args)
};

const cbosConfig = {
	apiUrl: 'http://mock-api',
	apiHeader: 'mock-header',
	timeoutMs: 100
};

let originalFetch;

beforeEach(() => {
	CbosApiClient.appealTypesCache = null;
	CbosApiClient.fetchPromise = null;
	warnCalls = [];
	errorCalls = [];
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
		json: async () => ({ items: [{ appealId: '6000084' }, { appealId: '6000083' }] })
	});
	const ids = await client.fetchAppealIds();
	assert.deepStrictEqual(ids, ['6000084', '6000083']);
});

test('fetchAppealIds returns all appeal IDs', async () => {
	const responses = [
		{
			ok: true,
			json: async () => ({ items: [{ appealId: '6000084' }], itemCount: 2, pageCount: 2 })
		},
		{
			ok: true,
			json: async () => ({ items: [{ appealId: '6000084' }, { appealId: '6000083' }], itemCount: 2, pageCount: 1 })
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

test('getAppealType returns display key', async () => {
	CbosApiClient.appealTypesCache = [{ type: 'Enforcement notice appeal', key: 'C' }];
	const key = await client.getAppealType('Enforcement notice appeal');
	assert.strictEqual(key, 'C');
});

test('getAppealType returns Unknown Appeal Type if not found', async () => {
	CbosApiClient.appealTypesCache = [{ type: 'Enforcement notice appeal', key: 'C' }];
	const key = await client.getAppealType('Appeal type');
	assert.strictEqual(key, 'Unknown Appeal Type');
});

test('getCaseAgeInWeeks returns correct weeks', () => {
	const now = new Date();
	const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
	assert.strictEqual(client.getCaseAgeInWeeks(twoWeeksAgo), 2);
});

test('getLinkedCasesCount returns sum of linked and other appeals', () => {
	const c = { linkedAppeals: [1, 2] };
	assert.strictEqual(client.getLinkedCasesCount(c), 2);
});

test('appealToViewModel maps specified fields correctly', async () => {
	client.getAppealType = async () => 'Y';
	const c = {
		appealReference: '6000084',
		appealType: 'Y',
		procedureType: 'written',
		allocationDetails: { band: '3', level: 'A' },
		appealSite: { postCode: 'BN14 0TT' },
		localPlanningDepartment: 'Bristol City Council',
		appealStatus: 'issue_determination',
		validAt: new Date(Date.now() - 5 * 7 * 24 * 60 * 60 * 1000), // 5 weeks ago
		linkedAppeals: [],
		otherAppeals: [],
		appealTimetable: {}
	};
	const vm = await client.appealToViewModel(c);
	assert.strictEqual(vm.caseId, '6000084');
	assert.strictEqual(vm.caseType, 'Y');
	assert.strictEqual(vm.caseProcedure, 'written');
	assert.strictEqual(vm.allocationBand, '3');
	assert.strictEqual(vm.caseLevel, 'A');
	assert.strictEqual(vm.siteAddressPostcode, 'BN14 0TT');
	assert.strictEqual(vm.lpaName, 'Bristol City Council');
	assert.strictEqual(vm.caseStatus, 'issue_determination');
	assert.strictEqual(vm.caseAge, 5);
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
		isChildAppeal: false
	};

	const appealCoordinates = {
		results: [{ DPA: { LAT: 1.23, LNG: 4.56 } }]
	};

	mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => appealCoordinates);
	CbosApiClient.appealTypesCache = [{ type: 'Enforcement notice appeal', key: 'C' }];

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
		lpaCode: '',
		lpaName: 'planning department',
		lpaRegion: 'region',
		caseCreatedDate: createdAtDate,
		caseValidDate: validAtDate,
		finalCommentsDueDate: finalCommentsDueDate,
		linkedCaseStatus: 'Parent',
		leadCaseReference: undefined
	};

	const mappedCase = await client.appealToAppealCaseModel(c);
	assert.deepStrictEqual(mappedCase, expectedCase);
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
		lpaRegion: 'region',
		createdAt: createdAtDate,
		validAt: validAtDate,
		appealTimetable: {
			finalCommentsDueDate: finalCommentsDueDate
		},
		isParentAppeal: false,
		isChildAppeal: true
	};

	const appealCoordinates = {
		results: [{ DPA: { LAT: 1.23, LNG: 4.56 } }]
	};

	mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => appealCoordinates);
	CbosApiClient.appealTypesCache = [{ type: 'Enforcement notice appeal', key: 'C' }];

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
		lpaCode: '',
		lpaName: 'planning department',
		lpaRegion: 'region',
		caseCreatedDate: createdAtDate,
		caseValidDate: validAtDate,
		finalCommentsDueDate: finalCommentsDueDate,
		linkedCaseStatus: 'Child',
		leadCaseReference: ''
	};

	const mappedCase = await client.appealToAppealCaseModel(c);
	assert.deepStrictEqual(mappedCase, expectedCase);
});

test('appealToAppealCaseModel should handle LPI values if returned by OS API', async () => {
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
		isChildAppeal: true
	};

	const appealCoordinates = {
		results: [{ LPI: { LAT: 1.23, LNG: 4.56 } }]
	};

	mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => appealCoordinates);
	CbosApiClient.appealTypesCache = [{ type: 'Enforcement notice appeal', key: 'C' }];

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
		lpaCode: '',
		lpaName: 'planning department',
		lpaRegion: 'region',
		caseCreatedDate: createdAtDate,
		caseValidDate: validAtDate,
		finalCommentsDueDate: finalCommentsDueDate,
		linkedCaseStatus: 'Child',
		leadCaseReference: ''
	};

	const mappedCase = await client.appealToAppealCaseModel(c);
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
		isChildAppeal: true
	};

	mockOsApiClient.addressesForPostcode.mock.mockImplementationOnce(() => {
		return Error();
	});
	CbosApiClient.appealTypesCache = [{ type: 'Enforcement notice appeal', key: 'C' }];

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
		lpaCode: '',
		lpaName: 'planning department',
		lpaRegion: 'region',
		caseCreatedDate: createdAtDate,
		caseValidDate: validAtDate,
		finalCommentsDueDate: finalCommentsDueDate,
		linkedCaseStatus: 'Child',
		leadCaseReference: ''
	};

	const mappedCase = await client.appealToAppealCaseModel(c);
	assert.deepStrictEqual(mappedCase, expectedCase);
});

test('getUnassignedCases should return cases with valid appeal statuses', async () => {
	const responses = [
		{
			ok: true,
			json: async () => ({ items: [{ appealId: '1' }], itemCount: 7, pageCount: 7 })
		},
		{
			ok: true,
			json: async () => ({
				items: [
					{ appealId: '1' },
					{ appealId: '2' },
					{ appealId: '3' },
					{ appealId: '4' },
					{ appealId: '5' },
					{ appealId: '6' },
					{ appealId: '7' }
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
		}
	];
	let call = 0;
	global.fetch = async () => responses[call++];
	CbosApiClient.appealTypesCache = [{ type: 'appealType', key: 'A' }];

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
			json: async () => ({ items: [{ appealId: '1' }], itemCount: 7, pageCount: 7 })
		},
		{
			ok: true,
			json: async () => ({
				items: [
					{ appealId: '1' },
					{ appealId: '2' },
					{ appealId: '3' },
					{ appealId: '4' },
					{ appealId: '5' },
					{ appealId: '6' },
					{ appealId: '7' },
					{ appealId: '8' }
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
		}
	];
	let call = 0;
	global.fetch = async () => responses[call++];
	CbosApiClient.appealTypesCache = [{ type: 'appealType', key: 'A' }];

	const appealsData = await client.getUnassignedCases();
	assert.strictEqual(appealsData.caseReferences.length, 0);
	assert.strictEqual(appealsData.cases.length, 0);
});
