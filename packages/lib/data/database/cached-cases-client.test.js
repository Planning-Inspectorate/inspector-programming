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
					lpaName: 'Example Local Planning Authority',
					lpaRegion: '',
					caseStatus: 'lpa_questionnaire',
					caseAge: 5,
					linkedCases: 0,
					caseReceivedDate: null,
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
					lpaName: 'Example Local Planning Authority',
					lpaRegion: '',
					caseStatus: 'lpa_questionnaire',
					caseAge: 10,
					linkedCases: 0,
					caseReceivedDate: null,
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
					lpaName: 'Example Local Planning Authority',
					lpaRegion: '',
					caseStatus: 'lpa_questionnaire',
					caseAge: 15,
					linkedCases: 0,
					caseReceivedDate: null,
					finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
					specialisms: undefined,
					specialismList: 'None'
				}
			];
			describe('sorting', async () => {
				it('should fetch cases sorted by age', async () => {
					const mockClient = {
						getAllCases: mock.fn(() => mockCases),
						paginateCases: mock.fn(() => {
							return { cases: mockCases.slice(0, 2), total: mockCases.length };
						})
					};
					const mockCache = {
						get: mock.fn(),
						set: mock.fn()
					};

					const casesClient = new CachedCasesClient(mockClient, mockCache);
					const cases = await casesClient.getCases('age', 1, 2);
					assert.deepStrictEqual(
						cases.cases.map((c) => c.caseId),
						['ref3', 'ref2']
					);
					assert.deepStrictEqual(cases.total, 3);
				});
				it('invalid sort argument should default to sort by age', async () => {
					const mockClient = {
						getAllCases: mock.fn(() => mockCases),
						paginateCases: mock.fn(() => {
							return { cases: mockCases.slice(0, 2), total: mockCases.length };
						})
					};
					const mockCache = {
						get: mock.fn(),
						set: mock.fn()
					};

					const casesClient = new CachedCasesClient(mockClient, mockCache);
					const cases = await casesClient.getCases('invalid', 1, 2);
					assert.deepStrictEqual(
						cases.cases.map((c) => c.caseId),
						['ref3', 'ref2']
					);
					assert.deepStrictEqual(cases.total, 3);
				});
			});
		});
	});
});
