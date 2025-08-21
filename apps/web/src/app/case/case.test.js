import { describe, mock, test } from 'node:test';
import assert from 'assert';
import { getCaseDetails } from './case.js';

describe('getCaseDetails', () => {
	test('returns case details when caseId is valid', async () => {
		const db = {
			appealCase: {
				findUnique: mock.fn(async ({ where }) => ({
					caseReference: where.caseReference,
					Events: [
						{
							id: '6900107-1',
							caseReference: '6900107',
							eventType: 'site_visit_accompanied'
						}
					],
					Specialisms: [
						{
							id: 'c938e712-bebf-4010-b618-1218ce991145',
							caseReference: '6900107',
							specialism: 'Listed building and enforcement'
						}
					]
				}))
			}
		};
		const result = await getCaseDetails(db, '6900107');
		assert.strictEqual(result.caseReference, '6900107');
		assert.deepStrictEqual(result.Events, [
			{
				id: '6900107-1',
				caseReference: '6900107',
				eventType: 'site_visit_accompanied'
			}
		]);
		assert.deepStrictEqual(result.Specialisms, [
			{
				id: 'c938e712-bebf-4010-b618-1218ce991145',
				caseReference: '6900107',
				specialism: 'Listed building and enforcement'
			}
		]);
	});

	test('returns null when caseId is missing', async () => {
		const db = {
			appealCase: {
				findUnique: mock.fn()
			}
		};
		const result = await getCaseDetails(db, '');
		assert.strictEqual(result, null);
	});

	test('returns null when caseId is null', async () => {
		const db = {
			appealCase: {
				findUnique: mock.fn()
			}
		};
		const result = await getCaseDetails(db, null);
		assert.strictEqual(result, null);
	});
});
