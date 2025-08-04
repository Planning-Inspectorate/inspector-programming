import { test, beforeEach, afterEach } from 'node:test';
import assert from 'assert';
import { CbosApiClient } from './cbos-api-client.js';

let client;
let warnCalls = [];
let errorCalls = [];
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
	client = new CbosApiClient(cbosConfig, mockLogger);
	originalFetch = global.fetch;
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
