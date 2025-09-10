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
					caseId: 1,
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
					inspectorId: null,
					ChildCases: []
				},
				{
					caseReference: 'ref2',
					caseId: 2,
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
					inspectorId: null,
					ChildCases: []
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
					caseReference: 'testref',
					caseId: 1,
					caseLevel: 'H',
					caseProcedure: 'inquiry',
					caseReceivedDate: null,
					caseStatus: 'lpa_questionnaire',
					caseType: 'W',
					linkedCaseReferences: [],
					linkedCaseStatus: null,
					lpaName: 'Example Local Planning Authority',
					lpaRegion: '',
					siteAddressPostcode: 'SY10 7FA',
					siteAddressLatitude: 52.89835,
					siteAddressLongitude: -3.064346,
					finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
					specialismList: 'None',
					specialisms: undefined,
					leadCaseReference: null
				},
				{
					allocationBand: 1,
					caseAge: 45,
					caseReference: 'ref2',
					caseId: 2,
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
					linkedCaseReferences: [],
					linkedCaseStatus: null,
					finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
					specialisms: undefined,
					specialismList: 'None',
					leadCaseReference: null
				}
			]);
		});
	});
	describe('paginateCases', () => {
		const fiveMockCases = [
			{
				caseReference: 'ref1',
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
				linkedCaseReferences: [],
				caseReceivedDate: null,
				finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
				specialisms: undefined,
				specialismList: 'None',
				leadCaseReference: null
			},
			{
				caseReference: 'ref2',
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
				linkedCaseReferences: [],
				caseReceivedDate: null,
				finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
				specialisms: undefined,
				specialismList: 'None',
				leadCaseReference: null
			},
			{
				caseReference: 'ref3',
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
				linkedCaseReferences: [],
				caseReceivedDate: null,
				finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
				specialisms: undefined,
				specialismList: 'None',
				leadCaseReference: null
			},
			{
				caseReference: 'ref4',
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
				linkedCaseReferences: [],
				caseReceivedDate: null,
				finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
				specialisms: undefined,
				specialismList: 'None',
				leadCaseReference: null
			},
			{
				caseReference: 'ref5',
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
				linkedCaseReferences: [],
				caseReceivedDate: null,
				finalCommentsDate: new Date('2024-10-10T10:26:11.963Z'),
				specialisms: undefined,
				specialismList: 'None',
				leadCaseReference: null
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
				threePaginatedCases.cases.map((c) => c.caseReference),
				['ref1', 'ref2', 'ref3']
			);
			assert.deepStrictEqual(
				fourPaginatedCases.cases.map((c) => c.caseReference),
				['ref1', 'ref2', 'ref3', 'ref4']
			);
			assert.deepStrictEqual(
				fivePaginatedCases.cases.map((c) => c.caseReference),
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
				pageTwo.cases.map((c) => c.caseReference),
				['ref3', 'ref4']
			);
			assert.deepStrictEqual(pageTwo.total, 5);
		});
		it('should handle fewer cases than page size elegantly', async () => {
			const mockClient = {};
			const casesClient = new CasesClient(mockClient);

			const overflowPageTwo = await casesClient.paginateCases(fiveMockCases, 2, 3);
			assert.deepStrictEqual(
				overflowPageTwo.cases.map((c) => c.caseReference),
				['ref4', 'ref5']
			);
			assert.deepStrictEqual(overflowPageTwo.total, 5);
		});
	});
	describe('getCaseAgeInWeeks', () => {
		it('should get the correct age of the case', () => {
			const mockClient = {};
			const casesClient = new CasesClient(mockClient);

			const now = new Date();
			const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
			assert.strictEqual(casesClient.getCaseAgeInWeeks(twoWeeksAgo), 2);
		});
	});
});
