import { describe, test, mock } from 'node:test';
import assert from 'node:assert';
import { buildBackfillCaseOfficers } from './impl.js';

describe('backfill-case-officers-impl', () => {
	const newService = (caseReferences, fetchDetails) => ({
		dbClient: {
			appealCase: {
				findMany: mock.fn(async () => caseReferences.map((caseReference) => ({ caseReference }))),
				updateMany: mock.fn(async () => ({ count: 1 }))
			}
		},
		cbosClient: {
			fetchAppealDetailsByReference: mock.fn(fetchDetails)
		}
	});
	const newRequest = (query = '') => ({ query: new URLSearchParams(query) });
	const context = { log: mock.fn() };

	test('should query the first page of cases without a case officer ID by default', async () => {
		const service = newService([], async () => []);
		const res = await buildBackfillCaseOfficers(service)(newRequest(), context);
		assert.deepStrictEqual(service.dbClient.appealCase.findMany.mock.calls[0].arguments[0], {
			where: { caseOfficerId: null },
			select: { caseReference: true },
			orderBy: { caseReference: 'asc' },
			take: 500
		});
		assert.strictEqual(service.cbosClient.fetchAppealDetailsByReference.mock.callCount(), 0);
		assert.strictEqual(res.jsonBody.nextAfter, null);
	});

	test('should query cases after the given cursor with the given limit', async () => {
		const service = newService([], async () => []);
		await buildBackfillCaseOfficers(service)(newRequest('limit=50&after=6000123'), context);
		assert.deepStrictEqual(service.dbClient.appealCase.findMany.mock.calls[0].arguments[0], {
			where: { caseOfficerId: null, caseReference: { gt: '6000123' } },
			select: { caseReference: true },
			orderBy: { caseReference: 'asc' },
			take: 50
		});
	});

	test('should cap the limit and fall back to the default for invalid values', async () => {
		const cases = [
			['limit=5000', 1000],
			['limit=0', 500],
			['limit=abc', 500]
		];
		for (const [query, expectedTake] of cases) {
			const service = newService([], async () => []);
			await buildBackfillCaseOfficers(service)(newRequest(query), context);
			assert.strictEqual(service.dbClient.appealCase.findMany.mock.calls[0].arguments[0].take, expectedTake, query);
		}
	});

	test('should return nextAfter as the last case reference when the page is full', async () => {
		const service = newService(['1', '2'], async ([ref]) => [{ appealReference: ref, caseOfficer: 'officer' }]);
		const res = await buildBackfillCaseOfficers(service)(newRequest('limit=2'), context);
		assert.strictEqual(res.jsonBody.nextAfter, '2');
	});

	test('should update only caseOfficerId for cases with a case officer in Manage appeals', async () => {
		const service = newService(['1', '2'], async ([ref]) => [{ appealReference: ref, caseOfficer: `officer-${ref}` }]);
		const res = await buildBackfillCaseOfficers(service)(newRequest(), context);

		const updates = service.dbClient.appealCase.updateMany.mock.calls.map((c) => c.arguments[0]);
		assert.deepStrictEqual(updates, [
			{ where: { caseReference: '1', caseOfficerId: null }, data: { caseOfficerId: 'officer-1' } },
			{ where: { caseReference: '2', caseOfficerId: null }, data: { caseOfficerId: 'officer-2' } }
		]);
		assert.deepStrictEqual(res.jsonBody, {
			processed: 2,
			updated: 2,
			noCaseOfficer: 0,
			notFound: 0,
			skipped: 0,
			failed: 0,
			notUpdated: [],
			nextAfter: null
		});
	});

	test('should record a reason for each case that is not updated and continue when a fetch fails', async () => {
		const notFoundError = (ref) =>
			Object.assign(new Error(`Failed to fetch details for appealReference ${ref}. Status: 404`), { status: 404 });
		const service = newService(['1', '2', '3', '4', '5', '6'], async ([ref]) => {
			if (ref === '2' || ref === '3') throw notFoundError(ref);
			if (ref === '4') throw Object.assign(new Error('Status: 500'), { status: 500 });
			if (ref === '5') return [{ appealReference: ref }];
			if (ref === '6') return [];
			return [{ appealReference: ref, caseOfficer: 'officer-1' }];
		});
		const res = await buildBackfillCaseOfficers(service)(newRequest(), context);

		assert.strictEqual(service.dbClient.appealCase.updateMany.mock.callCount(), 1);
		assert.deepStrictEqual(res.jsonBody, {
			processed: 6,
			updated: 1,
			noCaseOfficer: 1,
			notFound: 3,
			skipped: 0,
			failed: 1,
			notUpdated: [
				{ caseReference: '2', outcome: 'notFound', reason: 'Appeal not found in Manage appeals' },
				{ caseReference: '3', outcome: 'notFound', reason: 'Appeal not found in Manage appeals' },
				{ caseReference: '4', outcome: 'failed', reason: 'Status: 500' },
				{ caseReference: '5', outcome: 'noCaseOfficer', reason: 'No case officer assigned in Manage appeals' },
				{ caseReference: '6', outcome: 'notFound', reason: 'Appeal not found in Manage appeals' }
			],
			nextAfter: null
		});
	});

	test('should process all cases in the page in chunks', async () => {
		const refs = Array.from({ length: 25 }, (_, i) => String(i));
		const service = newService(refs, async ([ref]) => [{ appealReference: ref, caseOfficer: 'officer' }]);
		const res = await buildBackfillCaseOfficers(service)(newRequest(), context);

		assert.strictEqual(service.cbosClient.fetchAppealDetailsByReference.mock.callCount(), 25);
		assert.strictEqual(res.jsonBody.updated, 25);
	});

	test('should count a case as skipped if it already has a case officer ID or was removed', async () => {
		const service = newService(['1'], async () => [{ appealReference: '1', caseOfficer: 'officer-1' }]);
		service.dbClient.appealCase.updateMany.mock.mockImplementation(async () => ({ count: 0 }));
		const res = await buildBackfillCaseOfficers(service)(newRequest(), context);

		assert.strictEqual(res.jsonBody.updated, 0);
		assert.strictEqual(res.jsonBody.skipped, 1);
		assert.deepStrictEqual(res.jsonBody.notUpdated, [
			{ caseReference: '1', outcome: 'skipped', reason: 'Case already has a case officer ID or no longer exists' }
		]);
	});
});
