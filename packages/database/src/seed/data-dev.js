import {
	APPEAL_ALLOCATION_LEVEL,
	APPEAL_CASE_PROCEDURE,
	APPEAL_CASE_STATUS,
	APPEAL_CASE_TYPE
} from '@planning-inspectorate/data-model';
import { addWeeks } from 'date-fns';

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
	const now = new Date();
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
		// not concerned with time zone issues, just rough dates is OK
		const valid = addWeeks(now, -Math.floor(index / 2));
		const finalCommentsDue = addWeeks(valid, 5);
		const paddedIndex = String(index + 1).padStart(5, '0');
		return {
			...mockAppeal,
			...variation,
			caseReference: `69${paddedIndex}`,
			caseValidDate: valid,
			finalCommentsDueDate: finalCommentsDue
		};
	});
}

/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
 */
export async function seedDev(dbClient) {
	// const appeals = generateAppeals();
  //
	// console.log('seeding', appeals.length, 'appeals');
  //
	// for (const appeal of appeals) {
	// 	await dbClient.appealCase.upsert({
	// 		where: { caseReference: appeal.caseReference },
	// 		create: appeal,
	// 		update: appeal
	// 	});
	// }

  const SEED_COUNT = 30000;

  console.log('seeding', SEED_COUNT, 'appeals');

  for (let i = 0; i < SEED_COUNT; i++) {
    if ((i + 1) % 1000 === 0) {
      console.log(`Seeded ${i + 1} appeals`);
    }
    const reference = `69${String(i + 1).padStart(5, '0')}`;
    await dbClient.appealCase.upsert({
      where: { caseReference: reference },
      create: {...mockAppeal, caseReference: reference },
      update: { ...mockAppeal, caseReference: reference }
    });
  }

	console.log('dev seed complete');
}
