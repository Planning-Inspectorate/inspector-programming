import {
	APPEAL_ALLOCATION_LEVEL,
	APPEAL_CASE_PROCEDURE,
	APPEAL_CASE_STATUS,
	APPEAL_CASE_TYPE
} from '@planning-inspectorate/data-model';

/**
 * @type {import('@pins/inspector-programming-database/src/client').Prisma.AppealCaseCreateInput}
 */
const mockAppeal = {
	caseReference: '6900001',
	caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE,
	caseType: APPEAL_CASE_TYPE.D,
	caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
	allocationLevel: APPEAL_ALLOCATION_LEVEL.A,
	allocationBand: 1,
	siteAddressLine1: '123 Example Street',
	siteAddressTown: 'Example Town',
	siteAddressCounty: 'Example County',
	siteAddressPostcode: 'EX1 2PL',
	lpaCode: 'Q9999',
	lpaName: 'Example Local Planning Authority',
	caseValidDate: new Date('2025-07-31T23:00:00Z'),
	finalCommentsDueDate: new Date('2025-08-06T23:00:00Z')
};

/**
 * @returns {import('@pins/inspector-programming-database/src/client').Prisma.AppealCaseCreateInput[]}
 */
function generateAppeals() {
	const allocationLevels = Object.values(APPEAL_ALLOCATION_LEVEL);
	const procedures = Object.values(APPEAL_CASE_PROCEDURE);
	const caseTypes = [APPEAL_CASE_TYPE.D, APPEAL_CASE_TYPE.W]; // Householder and S78

	const variables = {
		allocationLevel: allocationLevels,
		caseProcedure: procedures,
		caseType: caseTypes
	};
	const variations = [{}];
	for (const [k, values] of Object.entries(variables)) {
		const newVariations = [];
		for (const value of values) {
			for (const variation of variations) {
				newVariations.push({ ...variation, [k]: value });
			}
		}
		variations.push(...newVariations);
	}

	return variations.map((variation, index) => {
		const paddedIndex = String(index + 1).padStart(5, '0');
		return {
			...mockAppeal,
			...variation,
			caseValidDate: getRandomDateInLast50Weeks(),
			caseReference: `69${paddedIndex}`
		};
	});
}

/**
 *
 * @returns {Date}
 */
function getRandomDateInLast50Weeks() {
	const now = new Date();
	const millisecondsInAWeek = 7 * 24 * 60 * 60 * 1000;
	const fiftyWeeksAgo = new Date(now.getTime() - 50 * millisecondsInAWeek);

	const randomTimestamp = fiftyWeeksAgo.getTime() + Math.random() * (now.getTime() - fiftyWeeksAgo.getTime());
	return new Date(randomTimestamp);
}

/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
 */
export async function seedDev(dbClient) {
	const appeals = generateAppeals();

	console.log('seeding', appeals.length, 'appeals');

	for (const appeal of appeals) {
		await dbClient.appealCase.upsert({
			where: { caseReference: appeal.caseReference },
			create: appeal,
			update: appeal
		});
	}

	console.log('dev seed complete');
}
