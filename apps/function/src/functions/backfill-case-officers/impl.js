// keep load on the Manage appeals API low
const CHUNK_SIZE = 10;
// keep each call well within the ~230s HTTP response limit
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 1000;

/**
 * One-off backfill of caseOfficerId for cases already in the database.
 * Fetches each case missing a caseOfficerId from Manage appeals and updates only that field;
 * no cases are created or deleted, and no other fields are changed.
 *
 * Processes one page of cases per call, ordered by caseReference:
 * - `limit` (optional) - max cases to process, default 500, max 1000
 * - `after` (optional) - only process cases with a caseReference after this one
 * Call repeatedly, passing the returned `nextAfter` as `after`, until `nextAfter` is null.
 * Cases that aren't updated are listed in `notUpdated` with their outcome and the reason.
 *
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').HttpHandler}
 */
export function buildBackfillCaseOfficers(service) {
	return async (request, context) => {
		const limit = parseLimit(request.query?.get('limit'));
		const after = request.query?.get('after') || undefined;
		context.log('backfilling case officer IDs from Manage appeals', JSON.stringify({ limit, after }));

		const cases = await service.dbClient.appealCase.findMany({
			where: { caseOfficerId: null, ...(after && { caseReference: { gt: after } }) },
			select: { caseReference: true },
			orderBy: { caseReference: 'asc' },
			take: limit
		});
		const caseReferences = cases.map((c) => c.caseReference);
		context.log('found', caseReferences.length, 'cases without a case officer ID');

		const summary = {
			processed: caseReferences.length,
			updated: 0,
			noCaseOfficer: 0,
			notFound: 0,
			skipped: 0,
			failed: 0
		};
		/** @type {Result[]} */
		const notUpdated = [];

		for (let i = 0; i < caseReferences.length; i += CHUNK_SIZE) {
			const chunk = caseReferences.slice(i, i + CHUNK_SIZE);
			const results = await Promise.all(chunk.map((ref) => backfillCase(service, ref)));

			for (const result of results) {
				summary[result.outcome]++;
				if (result.outcome !== 'updated') {
					notUpdated.push(result);
					context.log(`[${result.caseReference}] not backfilled (${result.outcome}):`, result.reason);
				}
			}
		}

		// a full page means there may be more cases to process
		const nextAfter = caseReferences.length === limit ? caseReferences[caseReferences.length - 1] : null;

		context.log('finished backfilling case officer IDs', JSON.stringify({ ...summary, nextAfter }));
		return { jsonBody: { ...summary, notUpdated, nextAfter } };
	};
}

/**
 * @param {string|null|undefined} value
 * @returns {number}
 */
function parseLimit(value) {
	const limit = parseInt(value ?? '', 10);
	if (!Number.isInteger(limit) || limit < 1) {
		return DEFAULT_LIMIT;
	}
	return Math.min(limit, MAX_LIMIT);
}

/**
 * @typedef {{ caseReference: string, outcome: 'updated'|'noCaseOfficer'|'notFound'|'skipped'|'failed', reason?: string }} Result
 */

const APPEAL_NOT_FOUND = 'Appeal not found in Manage appeals';

/**
 * Backfill a single case. Never throws - errors are returned as a 'failed' result.
 *
 * @param {import('../../service').FunctionService} service
 * @param {string} caseReference
 * @returns {Promise<Result>}
 */
async function backfillCase(service, caseReference) {
	/** @type {(outcome: Result['outcome'], reason?: string) => Result} */
	const result = (outcome, reason) => ({ caseReference, outcome, reason });

	try {
		const [appeal] = await service.cbosClient.fetchAppealDetailsByReference([caseReference]);
		if (!appeal) {
			return result('notFound', APPEAL_NOT_FOUND);
		}
		if (!appeal.caseOfficer) {
			return result('noCaseOfficer', 'No case officer assigned in Manage appeals');
		}
		// only update if still null so a newer value from the service bus integration isn't overwritten;
		// updateMany also won't throw if the case was removed in the meantime
		const { count } = await service.dbClient.appealCase.updateMany({
			where: { caseReference, caseOfficerId: null },
			data: { caseOfficerId: appeal.caseOfficer }
		});
		if (count === 0) {
			return result('skipped', 'Case already has a case officer ID or no longer exists');
		}
		return result('updated');
	} catch (error) {
		if (error?.status === 404) {
			return result('notFound', APPEAL_NOT_FOUND);
		}
		return result('failed', error instanceof Error ? error.message : String(error));
	}
}
