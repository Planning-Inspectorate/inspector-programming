import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sortCasesByAge } from './sorting.js';

describe('sorting', () => {
	describe('sortCasesByAge', () => {
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
			const cases = mockCases.sort(sortCasesByAge);
			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref4', 'ref3', 'ref2', 'ref1', 'ref5']
			);
		});
		it('cases having the same age should sort by caseReceivedDate instead', async () => {
			const testCases = mockCases.map((c) => {
				return { ...c, caseAge: 5 };
			});

			const cases = testCases.sort(sortCasesByAge);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref2', 'ref3', 'ref1', 'ref4', 'ref5']
			);
		});
		it('cases having the same age and caseReceivedDate should sort by LPA name in alphabetical order', async () => {
			const testCases = mockCases.map((c) => {
				return { ...c, caseAge: 5, caseReceivedDate: new Date('2024-10-09T10:26:11.963Z') };
			});

			const cases = testCases.sort(sortCasesByAge);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref3', 'ref4', 'ref2', 'ref1', 'ref5']
			);
		});
		it('cases with null ages should be placed at the bottom', async () => {
			const testCases = mockCases;
			const nullCase = testCases.find((c) => c.caseId === 'ref3');
			nullCase.caseAge = null;

			const cases = testCases.sort(sortCasesByAge);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref4', 'ref2', 'ref1', 'ref5', 'ref3']
			);
		});
		it('multiple cases with null ages should use caseReceivedDate sort criteria', async () => {
			const testCases = mockCases.map((c) => (['ref3', 'ref4'].includes(c.caseId) ? { ...c, caseAge: null } : c));

			const cases = testCases.sort(sortCasesByAge);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref2', 'ref1', 'ref5', 'ref3', 'ref4']
			);
		});
		it('when using caseReceivedDate sort criteria, null results should be placed at the bottom', async () => {
			const testCases = mockCases.map((c) => {
				return { ...c, caseAge: 5, caseReceivedDate: c.caseId === 'ref3' ? null : c.caseReceivedDate };
			});

			const cases = testCases.sort(sortCasesByAge);

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

			const cases = testCases.sort(sortCasesByAge);

			assert.deepStrictEqual(
				cases.map((c) => c.caseId),
				['ref4', 'ref2', 'ref1', 'ref5', 'ref3']
			);
		});
	});
});
