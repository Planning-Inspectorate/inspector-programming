import { describe, it, mock } from 'node:test';
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
					siteAddressPostcode: 'sy10 7fa',
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
					Lpa: { lpaName: 'Other Local Planning Authority' },
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

			const timingRules = [
				{ caseType: 'W', caseProcedure: 'inquiry', allocationLevel: 'H' },
				{ caseType: 'W', caseProcedure: 'written', allocationLevel: 'A' }
			];

			const mockClient = {
				calendarEventTimingRule: {
					findMany: mock.fn(async () => timingRules)
				},
				appealCase: {
					findMany: mock.fn(async () => mockCases)
				}
			};

			const client = new CasesClient(mockClient);
			const cases = await client.getAllCases();

			assert.strictEqual(mockClient.calendarEventTimingRule.findMany.mock.calls.length, 1);
			assert.strictEqual(mockClient.appealCase.findMany.mock.calls.length, 1);
			const appealFindManyArg = mockClient.appealCase.findMany.mock.calls[0].arguments[0];
			assert.deepStrictEqual(appealFindManyArg.where, {
				OR: [
					{ caseType: 'W', caseProcedure: 'inquiry', allocationLevel: 'H' },
					{ caseType: 'W', caseProcedure: 'written', allocationLevel: 'A' }
				]
			});
			assert.deepStrictEqual(cases, [
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
	describe('getCaseAgeInWeeks', () => {
		it('should get the correct age of the case', () => {
			const mockClient = {};
			const casesClient = new CasesClient(mockClient);

			const now = new Date();
			const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
			assert.strictEqual(casesClient.getCaseAgeInWeeks(twoWeeksAgo), 2);
		});
	});
	describe('caseToViewModel', () => {
		it('should set finalCommentsDate from finalCommentsDueDate regardless of caseType', () => {
			const mockClient = {};
			const casesClient = new CasesClient(mockClient);
			const dueDate = new Date('2025-06-01T00:00:00Z');
			const hasCase = {
				caseReference: 'has-ref',
				caseId: 99,
				caseStatus: 'ready_to_start',
				caseType: 'D',
				caseProcedure: 'written',
				allocationLevel: 'A',
				allocationBand: 1,
				siteAddressPostcode: 'SW1A 1AA',
				siteAddressLatitude: 51.5,
				siteAddressLongitude: -0.14,
				lpaName: 'Test LPA',
				caseValidDate: new Date(),
				finalCommentsDueDate: dueDate,
				linkedCaseStatus: null,
				leadCaseReference: null,
				caseCreatedDate: null,
				ChildCases: [],
				Specialisms: []
			};
			const viewModel = casesClient.caseToViewModel(hasCase);
			assert.deepStrictEqual(
				viewModel.finalCommentsDate,
				dueDate,
				'finalCommentsDate should match finalCommentsDueDate'
			);
		});
		it('should set finalCommentsDate to null when finalCommentsDueDate is not set', () => {
			const mockClient = {};
			const casesClient = new CasesClient(mockClient);
			const caseWithoutDueDate = {
				caseReference: 'w-ref',
				caseId: 100,
				caseStatus: 'ready_to_start',
				caseType: 'W',
				caseProcedure: 'written',
				allocationLevel: 'A',
				allocationBand: 1,
				siteAddressPostcode: 'SW1A 1AA',
				siteAddressLatitude: 51.5,
				siteAddressLongitude: -0.14,
				lpaName: 'Test LPA',
				caseValidDate: new Date(),
				finalCommentsDueDate: null,
				linkedCaseStatus: null,
				leadCaseReference: null,
				caseCreatedDate: null,
				ChildCases: [],
				Specialisms: []
			};
			const viewModel = casesClient.caseToViewModel(caseWithoutDueDate);
			assert.strictEqual(
				viewModel.finalCommentsDate,
				null,
				'finalCommentsDate should be null when finalCommentsDueDate is not set'
			);
		});
	});
	describe('deleteCases', () => {
		it('should call deleteCases', async () => {
			const mockClient = {
				appealCase: {
					deleteMany: mock.fn()
				}
			};
			const casesClient = new CasesClient(mockClient);
			await casesClient.deleteCases([1]);
			assert.deepStrictEqual(mockClient.appealCase.deleteMany.mock.calls[0].arguments[0], {
				where: { caseId: { in: [1] } }
			});
		});
	});
	describe('lastCasesUpdate', () => {
		it('should return the latest update Date', async (ctx) => {
			const now = new Date('2025-01-30T00:00:00.000Z');
			ctx.mock.timers.enable({ apis: ['Date'], now });
			const mockClient = {
				appealCasePollStatus: {
					findFirst: mock.fn(() => {
						return {
							lastPollAt: new Date()
						};
					})
				}
			};
			const casesClient = new CasesClient(mockClient);
			const lastUpdate = await casesClient.lastCasesUpdate();
			assert.strictEqual(lastUpdate.toISOString(), now.toISOString());
		});
		it('should return null if no values', async (ctx) => {
			const now = new Date('2025-01-30T00:00:00.000Z');
			ctx.mock.timers.enable({ apis: ['Date'], now });
			const mockClient = {
				appealCasePollStatus: {
					findFirst: mock.fn(() => {
						return undefined;
					})
				}
			};
			const casesClient = new CasesClient(mockClient);
			const lastUpdate = await casesClient.lastCasesUpdate();
			assert.strictEqual(lastUpdate, null);
		});
	});
});
