/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} db
 * @param {string} caseId
 * @returns {import('./types.d.ts').CaseWithEventsAndSpecialisms | null}
 */
export async function getCaseDetails(db, caseId) {
	if (!caseId) {
		return null;
	}
	return db.appealCase.findUnique({
		where: { caseReference: caseId },
		include: { Events: true, Specialisms: true }
	});
}
