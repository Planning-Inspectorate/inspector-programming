import { describe, it, mock } from 'node:test';
import { buildInitCasesClient, CachedCasesClient } from './cached-cases-client.js';
import assert from 'node:assert';

describe('cached-entra-client', () => {
	describe('buildInitEntraClient', () => {
		const mockClient = {};
		const mockCache = {
			get: mock.fn(() => [1, 2, 3])
		};

		it('should return a CachedCasesClient', () => {
			const initEntraClient = buildInitCasesClient(mockClient, mockCache);
			assert.strictEqual(initEntraClient instanceof CachedCasesClient, true);
		});
	});
	describe('CachedCasesClient', () => {
		it('should return cached entry if present', async () => {
			const mockClient = {};
			const mockCache = {
				get: mock.fn(() => [1, 2, 3])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const cases = await cacheClient.getAllCases();
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(cases, [1, 2, 3]);
		});
		it('should fetch new value if no cache value', async () => {
			const mockClient = { getAllCases: mock.fn(() => [3, 4, 5]) };
			const mockCache = {
				get: mock.fn(),
				set: mock.fn()
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const cases = await cacheClient.getAllCases();
			assert.deepStrictEqual(cases, [3, 4, 5]);
			assert.strictEqual(mockClient.getAllCases.mock.callCount(), 1);
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.strictEqual(mockCache.set.mock.callCount(), 1);
		});
		describe('getCases', () => {
			const mockCases = [
				{
					caseId: 'ref1',
					caseType: 'W',
					caseProcedure: 'inquiry',
					allocationBand: 1,
					caseLevel: 'H',
					siteAddressPostcode: 'SY10 7FA',
					siteAddressLatitude: 52.89835,
					siteAddressLongitude: -3.064346,
					lpaName: 'Definitely a Local Planning Authority',
					lpaRegion: '',
					caseStatus: 'lpa_questionnaire',
					caseAge: 5,
					linkedCases: 0,
					caseReceivedDate: new Date('2024-10-10T10:26:11.963Z'),
					finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
					specialisms: undefined,
					specialismList: 'None'
				},
				{
					caseId: 'ref2',
					caseType: 'W',
					caseProcedure: 'inquiry',
					allocationBand: 1,
					caseLevel: 'H',
					siteAddressPostcode: 'SY10 7FA',
					siteAddressLatitude: 52.89835,
					siteAddressLongitude: -3.064346,
					lpaName: 'Certainly a Local Planning Authority',
					lpaRegion: '',
					caseStatus: 'lpa_questionnaire',
					caseAge: 10,
					linkedCases: 0,
					caseReceivedDate: new Date('2024-10-08T10:26:11.963Z'),
					finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
					specialisms: undefined,
					specialismList: 'None'
				},
				{
					caseId: 'ref3',
					caseType: 'W',
					caseProcedure: 'inquiry',
					allocationBand: 1,
					caseLevel: 'H',
					siteAddressPostcode: 'SY10 7FA',
					siteAddressLatitude: 52.89835,
					siteAddressLongitude: -3.064346,
					lpaName: 'A Local Planning Authority',
					lpaRegion: '',
					caseStatus: 'lpa_questionnaire',
					caseAge: 15,
					linkedCases: 0,
					caseReceivedDate: new Date('2024-10-09T10:26:11.963Z'),
					finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
					specialisms: undefined,
					specialismList: 'None'
				},
				{
					caseId: 'ref4',
					caseType: 'W',
					caseProcedure: 'inquiry',
					allocationBand: 1,
					caseLevel: 'H',
					siteAddressPostcode: 'SY10 7FA',
					siteAddressLatitude: 52.89835,
					siteAddressLongitude: -3.064346,
					lpaName: 'Brilliant Local Planning Authority',
					lpaRegion: '',
					caseStatus: 'lpa_questionnaire',
					caseAge: 20,
					linkedCases: 0,
					caseReceivedDate: new Date('2024-10-11T10:26:11.963Z'),
					finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
					specialisms: undefined,
					specialismList: 'None'
				},
				{
					caseId: 'ref5',
					caseType: 'W',
					caseProcedure: 'inquiry',
					allocationBand: 1,
					caseLevel: 'H',
					siteAddressPostcode: 'SY10 7FA',
					siteAddressLatitude: 52.89835,
					siteAddressLongitude: -3.064346,
					lpaName: 'Example Local Planning Authority',
					lpaRegion: '',
					caseStatus: 'lpa_questionnaire',
					caseAge: 3,
					linkedCases: 0,
					caseReceivedDate: null,
					finalCommentsDate: new Date('2024-10-14T10:26:11.963Z'),
					specialisms: undefined,
					specialismList: 'None'
				}
			];
			describe('sorting', async () => {
				it('should fetch three cases sorted by age', async () => {
					const mockClient = {
						getAllCases: mock.fn(() => mockCases),
						paginateCases: mock.fn(() => {
							return { cases: mockCases.slice(0, 3), total: mockCases.length };
						})
					};
					const mockCache = {
						get: mock.fn(),
						set: mock.fn()
					};

					const casesClient = new CachedCasesClient(mockClient, mockCache);
					const cases = await casesClient.getCases('age', 1, 3);
					assert.deepStrictEqual(
						cases.cases.map((c) => c.caseId),
						['ref4', 'ref3', 'ref2']
					);
					assert.deepStrictEqual(cases.total, 5);
				});
				it('invalid sort argument should default to sort by age', async () => {
					const mockClient = {
						getAllCases: mock.fn(() => mockCases),
						paginateCases: mock.fn(() => {
							return { cases: mockCases.slice(0, 3), total: mockCases.length };
						})
					};
					const mockCache = {
						get: mock.fn(),
						set: mock.fn()
					};

					const casesClient = new CachedCasesClient(mockClient, mockCache);
					const cases = await casesClient.getCases('invalid', 1, 3);
					assert.deepStrictEqual(
						cases.cases.map((c) => c.caseId),
						['ref4', 'ref3', 'ref2']
					);
					assert.deepStrictEqual(cases.total, 5);
				});
				it('cases having the same age should sort by caseReceivedDate instead', async () => {
					const mockClient = {
						getAllCases: mock.fn(() => mockCases),
						paginateCases: mock.fn(() => {
							return { cases: mockCases.slice(0, 4), total: mockCases.length };
						})
					};
					const mockCache = {
						get: mock.fn(),
						set: mock.fn()
					};

					mockCases.forEach((c) => {
						c.caseAge = 5;
					});

					const casesClient = new CachedCasesClient(mockClient, mockCache);
					const cases = await casesClient.getCases('age', 1, 4);
					assert.deepStrictEqual(
						cases.cases.map((c) => c.caseId),
						['ref2', 'ref3', 'ref1', 'ref4']
					);
					assert.deepStrictEqual(cases.total, 5);
				});
				it('cases having the same age and caseReceivedDate should sort by LPA name in alphabetical order', async () => {
					const mockClient = {
						getAllCases: mock.fn(() => mockCases),
						paginateCases: mock.fn(() => {
							return { cases: mockCases.slice(0, 4), total: mockCases.length };
						})
					};
					const mockCache = {
						get: mock.fn(),
						set: mock.fn()
					};

					mockCases.forEach((c) => {
						c.caseAge = 5;
						c.caseReceivedDate = new Date('2024-10-09T10:26:11.963Z');
					});

					const casesClient = new CachedCasesClient(mockClient, mockCache);
					const cases = await casesClient.getCases('age', 1, 4);
					assert.deepStrictEqual(
						cases.cases.map((c) => c.caseId),
						['ref3', 'ref4', 'ref2', 'ref1']
					);
					assert.deepStrictEqual(cases.total, 5);
				});
			});
		});
	});
});
