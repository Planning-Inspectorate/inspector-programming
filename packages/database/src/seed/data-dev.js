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

// generated with
//  node -e "console.log(require('crypto').randomUUID())"
const specialismIds = [
	'03cde37b-f7e5-4abb-80be-f448dd24a4ea',
	'c73fb6c9-fb2e-4303-8cb1-b4be49652d33',
	'80fc2857-4321-468b-81a5-8628578ae6b0',
	'196473d9-e2d1-4f71-842e-1b1ba9a01fd9',
	'a60bfe1b-1f96-4d9d-b4e6-c163da19a045',
	'2bc01f8d-c030-4725-950f-07cffeda3501',
	'2a0d1bbb-1c07-4ec5-88e2-aca343ec6375',
	'214346b2-7e4c-4ca2-92b4-c742d81a1fb0',
	'27fe25d8-8e0a-409b-a22f-fea7104200d8',
	'03918a8f-37fb-4d17-8fc6-56306a159226'
];

/**
 * @type {import('@pins/inspector-programming-database/src/client').Prisma.InspectorUncheckedCreateInput[]}
 */
const inspectors = [
	{
		id: 'baf4bc6f-fe93-406c-a1ff-93b562739f11',
		firstName: 'User One',
		lastName: 'Inspector (Test)',
		email: 'inspector-programming-test-1@planninginspectorate.gov.uk',
		entraId: 'baf4bc6f-fe93-406c-a1ff-93b562739f11',
		grade: 'B1',
		postcode: 'BS1 6PN',
		workingAboveBand: false,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: specialismIds[0] },
					create: {
						id: specialismIds[0],
						name: 'Advertisements',
						proficiency: 'Trained',
						validFrom: '2024-03-11T00:00:00Z'
					}
				},
				{
					where: { id: specialismIds[1] },
					create: {
						id: specialismIds[1],
						name: 'Green belt',
						proficiency: 'In Training',
						validFrom: '2025-06-09T23:00:00Z'
					}
				}
			]
		}
	},
	{
		id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
		firstName: 'User Two',
		lastName: 'Inspector (Test)',
		email: 'inspector-programming-test-2@planninginspectorate.gov.uk',
		entraId: 'd53dea42-369b-44aa-b3ca-a8537018b422',
		grade: 'B2',
		postcode: 'BS1 6PN',
		workingAboveBand: true,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: specialismIds[2] },
					create: {
						id: specialismIds[2],
						name: 'Special protection area',
						proficiency: 'Trained',
						validFrom: '2024-03-11T00:00:00Z'
					}
				},
				{
					where: { id: specialismIds[3] },
					create: {
						id: specialismIds[3],
						name: 'Hearings trained',
						proficiency: 'In Training',
						validFrom: '2025-06-09T23:00:00Z'
					}
				}
			]
		}
	},
	{
		id: '7a0c62e2-182a-47a8-987a-26d0faa02876',
		firstName: 'User Three',
		lastName: 'Inspector (Test)',
		email: 'inspector-programming-test-3@planninginspectorate.gov.uk',
		entraId: '7a0c62e2-182a-47a8-987a-26d0faa02876',
		grade: 'B1',
		postcode: 'BS1 6PN',
		workingAboveBand: true,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: specialismIds[4] },
					create: {
						id: specialismIds[4],
						name: 'Special protection area',
						proficiency: 'Trained',
						validFrom: '2024-03-11T00:00:00Z'
					}
				},
				{
					where: { id: specialismIds[5] },
					create: {
						id: specialismIds[5],
						name: 'Appearance design',
						proficiency: 'Trained',
						validFrom: '2025-06-09T23:00:00Z'
					}
				}
			]
		}
	},
	{
		id: 'b62bce27-eb35-40e5-9164-1ad47786abcb',
		firstName: 'User Four',
		lastName: 'Inspector (Test)',
		email: 'inspector-programming-test-4@planninginspectorate.gov.uk',
		entraId: 'b62bce27-eb35-40e5-9164-1ad47786abcb',
		grade: 'B3',
		postcode: 'BS1 6PN',
		workingAboveBand: false,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: specialismIds[6] },
					create: {
						id: specialismIds[6],
						name: 'Hearings trained',
						proficiency: 'Trained',
						validFrom: '2024-03-11T00:00:00Z'
					}
				},
				{
					where: { id: specialismIds[7] },
					create: {
						id: specialismIds[7],
						name: 'Appeal against conditions',
						proficiency: 'Trained',
						validFrom: '2025-06-09T23:00:00Z'
					}
				}
			]
		}
	},
	{
		id: '2b5991be-cb19-440e-9012-12daa31e1252',
		firstName: 'User Five',
		lastName: 'Inspector (Test)',
		email: 'inspector-programming-test-5@planninginspectorate.gov.uk',
		entraId: '2b5991be-cb19-440e-9012-12daa31e1252',
		grade: 'B2',
		postcode: 'BS1 6PN',
		workingAboveBand: false,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: specialismIds[8] },
					create: {
						id: specialismIds[8],
						name: 'Special protection area',
						proficiency: 'Trained',
						validFrom: '2025-03-11T00:00:00Z'
					}
				},
				{
					where: { id: specialismIds[9] },
					create: {
						id: specialismIds[9],
						name: 'Hearings trained',
						proficiency: 'In Training',
						validFrom: '2025-06-09T23:00:00Z'
					}
				}
			]
		}
	}
];

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

	console.log('seeding', inspectors.length, 'inspectors');

	for (const inspector of inspectors) {
		await dbClient.inspector.upsert({
			where: { id: inspector.id },
			create: inspector,
			update: inspector
		});
	}

	console.log('dev seed complete');
}
