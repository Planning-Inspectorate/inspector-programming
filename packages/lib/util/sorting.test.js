import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sortCasesByAge, sortCasesByDistance } from './sorting.js';
import { Prisma } from '@pins/inspector-programming-database/src/client/client.ts';

const Decimal = Prisma.Decimal;

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
	describe('sortCasesByDistance', () => {
		const inspectorCoordinates = { lat: 50.4155, lng: -4.8882 }; //Plymouth
		const cases = {
			newcastle: { siteAddressLatitude: 54.980328, siteAddressLongitude: -1.6157238 },
			london: { siteAddressLatitude: 51.4998415, siteAddressLongitude: -0.1246377 },
			edinburgh: { siteAddressLatitude: 55.953251, siteAddressLongitude: -3.188267 },
			manchester: { siteAddressLatitude: 53.3497019, siteAddressLongitude: -2.2962547 },
			portsmouth: { siteAddressLatitude: 50.8038674, siteAddressLongitude: -1.0723581 }
		};
		const casesArray = [cases.portsmouth, cases.manchester, cases.edinburgh, cases.london, cases.newcastle];

		it('should sort cases by distance in descending order when specified by sort parameter', () => {
			let sortedCases = casesArray.sort((a, b) => sortCasesByDistance(inspectorCoordinates, a, b));
			assert.strictEqual(sortedCases.length, 5, 'Should return the same number of cases');
			assert.deepStrictEqual(sortedCases, [
				cases.portsmouth,
				cases.london,
				cases.manchester,
				cases.newcastle,
				cases.edinburgh
			]);
		});
		it('should place cases with wholly invalid coordinates at the bottom of the list when sorting by distance', async () => {
			const mockCasesArray = [{ siteAddressLatitude: null, siteAddressLongitude: null }, ...casesArray];

			let sortedCases = mockCasesArray.sort((a, b) => sortCasesByDistance(inspectorCoordinates, a, b));
			assert.strictEqual(sortedCases.length, 6, 'Should return the same number of cases');
			assert.deepStrictEqual(sortedCases, [
				cases.portsmouth,
				cases.london,
				cases.manchester,
				cases.newcastle,
				cases.edinburgh,
				{ siteAddressLatitude: null, siteAddressLongitude: null }
			]);
		});
		it('multiple cases with invalid coordinates in different permutations should all be sorted to the bottom of the list when sorting by distance', async () => {
			const mockCasesArray = [
				{ siteAddressLatitude: null, siteAddressLongitude: null },
				{ siteAddressLatitude: null, siteAddressLongitude: -2.2962547 },
				{ siteAddressLatitude: 54.980328, siteAddressLongitude: null },
				...casesArray
			];

			let sortedCases = mockCasesArray.sort((a, b) => sortCasesByDistance(inspectorCoordinates, a, b));
			assert.strictEqual(sortedCases.length, 8, 'Should return the same number of cases');
			assert.deepStrictEqual(sortedCases, [
				cases.portsmouth,
				cases.london,
				cases.manchester,
				cases.newcastle,
				cases.edinburgh,
				{ siteAddressLatitude: null, siteAddressLongitude: null },
				{ siteAddressLatitude: null, siteAddressLongitude: -2.2962547 },
				{ siteAddressLatitude: 54.980328, siteAddressLongitude: null }
			]);
		});
		it('can sort cases with coordinates in either Decimal or number format', () => {
			const mockCasesArray = [
				{ siteAddressLatitude: 54.980328, siteAddressLongitude: -1.6157238 }, //newcastle
				{ siteAddressLatitude: new Decimal(55.953251), siteAddressLongitude: new Decimal(-3.188267) }, //edinburgh
				{ siteAddressLatitude: new Decimal(50.8038674), siteAddressLongitude: new Decimal(-1.0723581) }, //portsmouth
				{ siteAddressLatitude: new Decimal(53.3497019), siteAddressLongitude: new Decimal(-2.2962547) } //manchester
			];

			let sortedCases = mockCasesArray.sort((a, b) => sortCasesByDistance(inspectorCoordinates, a, b));
			assert.strictEqual(sortedCases.length, 4, 'Should return the same number of cases');
			assert.deepStrictEqual(sortedCases, [
				{ siteAddressLatitude: new Decimal(50.8038674), siteAddressLongitude: new Decimal(-1.0723581) }, //portsmouth
				{ siteAddressLatitude: new Decimal(53.3497019), siteAddressLongitude: new Decimal(-2.2962547) }, //manchester
				{ siteAddressLatitude: 54.980328, siteAddressLongitude: -1.6157238 }, //newcastle
				{ siteAddressLatitude: new Decimal(55.953251), siteAddressLongitude: new Decimal(-3.188267) } //edinburgh
			]);
		});
	});
});
