/**
 * @param {import('prisma-client-2e8196588fe8a34a502e6100a3474af541587a272e46e508afe33dfc40ae1937').PrismaClient} db
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
