import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CasesClient } from './cases-client.js';

describe('CasesClient', () => {
	describe('getAllCases', () => {
		it('returns mapped cases from the db', async () => {
			const fortyFiveWeeksAgo = new Date();
			fortyFiveWeeksAgo.setDate(fortyFiveWeeksAgo.getDate() - 45 * 7);

			const mockCases = [
				{
					caseReference: 'testref',
					caseStatus: 'lpa_questionnaire',
					caseType: 'W',
					caseProcedure: 'inquiry',
					originalDevelopmentDescription: null,
					allocationLevel: 'H',
					allocationBand: 1,
					siteAddressLine1: '123 Example Street',
					siteAddressLine2: null,
					siteAddressTown: 'Example Town',
					siteAddressCounty: 'Example County',
					siteAddressPostcode: 'SY10 7FA',
					siteAddressLatitude: 52.89835,
					siteAddressLongitude: -3.064346,
					lpaCode: 'Q9999',
					lpaName: 'Example Local Planning Authority',
					lpaRegion: null,
					caseValidDate: fortyFiveWeeksAgo,
					finalCommentsDueDate: new Date('2024-10-10T10:26:11.963Z'),
					linkedCaseStatus: null,
					leadCaseReference: null,
					appellantCostsAppliedFor: null,
					lpaCostsAppliedFor: null,
					inspectorId: null
				},
				{
					caseReference: 'ref2',
					caseStatus: 'lpa_questionnaire',
					caseType: 'W',
					caseProcedure: 'written',
					originalDevelopmentDescription: null,
					allocationLevel: 'A',
					allocationBand: 1,
					siteAddressLine1: '123 Example Road',
					siteAddressLine2: null,
					siteAddressTown: 'Example Village',
					siteAddressCounty: 'Example County',
					siteAddressPostcode: 'FY8 3TR',
					siteAddressLatitude: 53.752716,
					siteAddressLongitude: -3.001122,
					lpaCode: 'Q9999',
					lpaName: 'Other Local Planning Authority',
					lpaRegion: null,
					caseValidDate: fortyFiveWeeksAgo,
					finalCommentsDueDate: new Date('2024-10-10T10:26:11.963Z'),
					linkedCaseStatus: null,
					leadCaseReference: null,
					appellantCostsAppliedFor: null,
					lpaCostsAppliedFor: null,
					inspectorId: null
				}
			];

			const mockClient = {
				appealCase: {
					findMany: async () => mockCases
				}
			};

			const client = new CasesClient(mockClient);
			const cases = await client.getAllCases();
			assert.deepEqual(cases, [
				{
					allocationBand: 1,
					caseAge: 45,
					caseId: 'testref',
					caseLevel: 'H',
					caseProcedure: 'inquiry',
					caseReceivedDate: null,
					caseStatus: 'lpa_questionnaire',
					caseType: 'W',
					linkedCases: 0,
					lpaName: 'Example Local Planning Authority',
					lpaRegion: '',
					siteAddressPostcode: 'SY10 7FA',
					siteAddressLatitude: 52.89835,
					siteAddressLongitude: -3.064346,
					finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
					specialismList: 'None',
					specialisms: undefined
				},
				{
					allocationBand: 1,
					caseAge: 45,
					caseId: 'ref2',
					caseLevel: 'A',
					caseProcedure: 'written',
					caseReceivedDate: null,
					caseStatus: 'lpa_questionnaire',
					caseType: 'W',
					siteAddressPostcode: 'FY8 3TR',
					siteAddressLatitude: 53.752716,
					siteAddressLongitude: -3.001122,
					lpaName: 'Other Local Planning Authority',
					lpaRegion: '',
					linkedCases: 0,
					finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
					specialisms: undefined,
					specialismList: 'None'
				}
			]);
		});
	});
	describe('paginateCases', () => {
		const fiveMockCases = [
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
				caseAge: 49,
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
				caseAge: 49,
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
				caseAge: 49,
				linkedCases: 0,
				caseReceivedDate: null,
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
				lpaName: 'Example Local Planning Authority',
				lpaRegion: '',
				caseStatus: 'lpa_questionnaire',
				caseAge: 49,
				linkedCases: 0,
				caseReceivedDate: null,
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
				caseAge: 49,
				linkedCases: 0,
				caseReceivedDate: null,
				finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
				specialisms: undefined,
				specialismList: 'None'
			}
		];

		it('should handle an empty array of cases elegantly', async () => {
			const mockClient = {};
			const casesClient = new CasesClient(mockClient);

			const emptyPage = await casesClient.paginateCases([], 1, 3);
			assert.deepStrictEqual(emptyPage, { cases: [], total: 0 });
		});
		it('should return a number of cases determined by the pageSize', async () => {
			const mockClient = {};
			const casesClient = new CasesClient(mockClient);

			const [threePaginatedCases, fourPaginatedCases, fivePaginatedCases] = await Promise.all([
				casesClient.paginateCases(fiveMockCases, 1, 3),
				casesClient.paginateCases(fiveMockCases, 1, 4),
				casesClient.paginateCases(fiveMockCases, 1, 5)
			]);
			assert.deepStrictEqual(
				threePaginatedCases.cases.map((c) => c.caseId),
				['ref1', 'ref2', 'ref3']
			);
			assert.deepStrictEqual(
				fourPaginatedCases.cases.map((c) => c.caseId),
				['ref1', 'ref2', 'ref3', 'ref4']
			);
			assert.deepStrictEqual(
				fivePaginatedCases.cases.map((c) => c.caseId),
				['ref1', 'ref2', 'ref3', 'ref4', 'ref5']
			);
			assert.deepStrictEqual(threePaginatedCases.total, 5);
			assert.deepStrictEqual(fourPaginatedCases.total, 5);
			assert.deepStrictEqual(fivePaginatedCases.total, 5);
		});
		it('should offset the pages retrieved using page', async () => {
			const mockClient = {};
			const casesClient = new CasesClient(mockClient);

			const pageTwo = await casesClient.paginateCases(fiveMockCases, 2, 2);
			assert.deepStrictEqual(
				pageTwo.cases.map((c) => c.caseId),
				['ref3', 'ref4']
			);
			assert.deepStrictEqual(pageTwo.total, 5);
		});
		it('should handle fewer cases than page size elegantly', async () => {
			const mockClient = {};
			const casesClient = new CasesClient(mockClient);

			const overflowPageTwo = await casesClient.paginateCases(fiveMockCases, 2, 3);
			assert.deepStrictEqual(
				overflowPageTwo.cases.map((c) => c.caseId),
				['ref4', 'ref5']
			);
			assert.deepStrictEqual(overflowPageTwo.total, 5);
		});
	});
	describe('sortCasesByAge', () => {
		const mockDbClient = {};
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
				caseReceivedDate: new Date('2024-10-15T10:26:11.963Z'),
				finalCommentsDate: new Date('2024-10-14T10:26:11.963Z'),
				specialisms: undefined,
				specialismList: 'None'
			}
		];
		it('should fetch three cases sorted by age', async () => {
			const casesClient = new CasesClient(mockDbClient);
			const cases = await casesClient.sortCasesByAge(mockCases);
			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref4', 'ref3', 'ref2', 'ref1', 'ref5']
			);
		});
		it('cases having the same age should sort by caseReceivedDate instead', async () => {
			const testCases = mockCases.map((c) => {
				return { ...c, caseAge: 5 };
			});

			const casesClient = new CasesClient(mockDbClient);
			const cases = await casesClient.sortCasesByAge(testCases);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref2', 'ref3', 'ref1', 'ref4', 'ref5']
			);
		});
		it('cases having the same age and caseReceivedDate should sort by LPA name in alphabetical order', async () => {
			const testCases = mockCases.map((c) => {
				return { ...c, caseAge: 5, caseReceivedDate: new Date('2024-10-09T10:26:11.963Z') };
			});

			const casesClient = new CasesClient(mockDbClient);
			const cases = await casesClient.sortCasesByAge(testCases);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref3', 'ref4', 'ref2', 'ref1', 'ref5']
			);
		});
		it('cases with null ages should be placed at the bottom', async () => {
			const testCases = mockCases;
			const nullCase = testCases.find((c) => c.caseId === 'ref3');
			nullCase.caseAge = null;

			const casesClient = new CasesClient(mockDbClient);
			const cases = await casesClient.sortCasesByAge(testCases);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref4', 'ref2', 'ref1', 'ref5', 'ref3']
			);
		});
		it('multiple cases with null ages should use caseReceivedDate sort criteria', async () => {
			const testCases = mockCases.map((c) => (['ref3', 'ref4'].includes(c.caseId) ? { ...c, caseAge: null } : c));

			const casesClient = new CasesClient(mockDbClient);
			const cases = await casesClient.sortCasesByAge(testCases);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref2', 'ref1', 'ref5', 'ref3', 'ref4']
			);
		});
		it('when using caseReceivedDate sort criteria, null results should be placed at the bottom', async () => {
			const testCases = mockCases.map((c) => {
				return { ...c, caseAge: 5, caseReceivedDate: c.caseId === 'ref3' ? null : c.caseReceivedDate };
			});

			const casesClient = new CasesClient(mockDbClient);
			const cases = await casesClient.sortCasesByAge(testCases);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref2', 'ref1', 'ref4', 'ref5', 'ref3']
			);
		});
		it('when using lpaName sort criteria, null results should be placed at the bottom', async () => {
			const testCases = mockCases.map((c) => {
				return {
					...c,
					caseAge: 5,
					caseReceivedDate: new Date('2024-10-09T10:26:11.963Z'),
					lpaName: c.caseId === 'ref3' ? null : c.lpaName
				};
			});

			const casesClient = new CasesClient(mockDbClient);
			const cases = await casesClient.sortCasesByAge(testCases);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref4', 'ref2', 'ref1', 'ref5', 'ref3']
			);
		});
	});
});
