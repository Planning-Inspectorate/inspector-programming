import {
	APPEAL_ALLOCATION_LEVEL,
	APPEAL_CASE_PROCEDURE,
	APPEAL_CASE_STATUS,
	APPEAL_CASE_TYPE
} from '@planning-inspectorate/data-model';
import { addDays, addWeeks } from 'date-fns';
import { mockLocations } from './data-dev-mock-locations.js';
import { SPECIALISMS, WORKING_ABOVE_BAND_SPECIALISMS } from './specialisms.js';
import crypto from 'node:crypto';
import { caseSpecialismIds, inspectorSpecialismIds } from './data-dev-guids.js';
import { generateCaseEvents } from './data-dev-events.js';

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
	lpaName: 'Example Local Planning Authority',
	caseCreatedDate: new Date('2025-07-30T12:15:00Z'),
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

	const appeals = variations.map((variation, index) => {
		// not concerned with time zone issues, just rough dates is OK
		const valid = addWeeks(now, -Math.floor(index / 2));
		const created = addDays(valid, -crypto.randomInt(5));
		const finalCommentsDue = addWeeks(valid, 5);
		const paddedIndex = String(index + 1).padStart(6, '0');
		const location = mockLocations[index % mockLocations.length];
		const reference = `6${paddedIndex}`;

		return {
			...mockAppeal,
			...variation,
			caseId: index + 1,
			siteAddressPostcode: location.siteAddressPostcode,
			siteAddressLatitude: location.siteAddressLatitude,
			siteAddressLongitude: location.siteAddressLongitude,
			caseReference: reference,
			caseCreatedDate: created,
			caseValidDate: valid,
			finalCommentsDueDate: finalCommentsDue,
			Specialisms: generateCaseSpecialisms(),
			Events: generateCaseEvents(reference, valid)
		};
	});

	// replaced inline linked-case generation with helper
	const linkedCases = generateLinkedCases(appeals, variations, now);
	return [...appeals, ...linkedCases];
}

/**
 * @param {Array} array The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = crypto.randomInt(i + 1);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

let specialismIdCounter = 0;

function nextSpecialismId() {
	// If we've used all IDs, cycle back to the beginning
	if (specialismIdCounter >= caseSpecialismIds.length) {
		specialismIdCounter = 0; // Reset the counter to reuse IDs
	}
	const id = caseSpecialismIds[specialismIdCounter];
	specialismIdCounter++;
	return id;
}

function generateCaseSpecialisms() {
	/** @type {import('@pins/inspector-programming-database/src/client').Prisma.AppealCaseSpecialismCreateNestedManyWithoutAppealCaseInput} */
	const specialisms = { connectOrCreate: [] };
	const randomPercent = crypto.randomInt(100);
	// not the same IDs each time, or the same specialisms per case
	// but using a set of IDs stops the list of specialisms growing each time seed is run
	if (randomPercent > 35) {
		const id = nextSpecialismId();
		specialisms.connectOrCreate.push({
			where: { id },
			create: { id, specialism: SPECIALISMS[crypto.randomInt(SPECIALISMS.length)] }
		});
		if (randomPercent > 75) {
			const id = nextSpecialismId();
			specialisms.connectOrCreate.push({
				where: { id },
				create: { id, specialism: SPECIALISMS[crypto.randomInt(SPECIALISMS.length)] }
			});
		}
	}
	return specialisms;
}

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
		postcode: 'NE1 7RU',
		longitude: -1.6157238,
		latitude: 54.980328,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: inspectorSpecialismIds[0] },
					create: {
						id: inspectorSpecialismIds[0],
						name: 'Advertisements',
						proficiency: 'Trained',
						validFrom: '2024-03-11T00:00:00Z'
					}
				},
				{
					where: { id: inspectorSpecialismIds[1] },
					create: {
						id: inspectorSpecialismIds[1],
						name: 'Green belt',
						proficiency: 'In Training',
						validFrom: '2025-06-09T23:00:00Z'
					}
				},
				{
					where: { id: inspectorSpecialismIds[10] },
					create: {
						id: inspectorSpecialismIds[10],
						name: WORKING_ABOVE_BAND_SPECIALISMS[0],
						proficiency: 'Trained',
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
		postcode: 'SW1A 0AA',
		longitude: -0.1246377,
		latitude: 51.4998415,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: inspectorSpecialismIds[2] },
					create: {
						id: inspectorSpecialismIds[2],
						name: 'Special protection area',
						proficiency: 'Trained',
						validFrom: '2024-03-11T00:00:00Z'
					}
				},
				{
					where: { id: inspectorSpecialismIds[3] },
					create: {
						id: inspectorSpecialismIds[3],
						name: 'Hearings trained',
						proficiency: 'In Training',
						validFrom: '2025-06-09T23:00:00Z'
					}
				},
				{
					where: { id: inspectorSpecialismIds[11] },
					create: {
						id: inspectorSpecialismIds[11],
						name: WORKING_ABOVE_BAND_SPECIALISMS[1],
						proficiency: 'Trained',
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
		postcode: 'WA15 0RE',
		longitude: -2.2962547,
		latitude: 53.3497019,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: inspectorSpecialismIds[4] },
					create: {
						id: inspectorSpecialismIds[4],
						name: 'Special protection area',
						proficiency: 'Trained',
						validFrom: '2024-03-11T00:00:00Z'
					}
				},
				{
					where: { id: inspectorSpecialismIds[5] },
					create: {
						id: inspectorSpecialismIds[5],
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
		postcode: 'PO1 5LL',
		longitude: -1.0723581,
		latitude: 50.8038674,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: inspectorSpecialismIds[6] },
					create: {
						id: inspectorSpecialismIds[6],
						name: 'Hearings trained',
						proficiency: 'Trained',
						validFrom: '2024-03-11T00:00:00Z'
					}
				},
				{
					where: { id: inspectorSpecialismIds[7] },
					create: {
						id: inspectorSpecialismIds[7],
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
		longitude: -2.5828931,
		latitude: 51.4508591,
		Specialisms: {
			connectOrCreate: [
				{
					where: { id: inspectorSpecialismIds[8] },
					create: {
						id: inspectorSpecialismIds[8],
						name: 'Special protection area',
						proficiency: 'Trained',
						validFrom: '2025-03-11T00:00:00Z'
					}
				},
				{
					where: { id: inspectorSpecialismIds[9] },
					create: {
						id: inspectorSpecialismIds[9],
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

	console.log('removing non generated appeals');
	const caseReferences = appeals.map((appeal) => appeal.caseReference);
	await dbClient.appealCase.deleteMany({
		where: {
			caseReference: {
				notIn: caseReferences
			}
		}
	});

	// assign valid LPA codes to all appeals
	await assignAppealLpaCodes(dbClient, appeals);

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

/**
 * Set a proportion of appeals to valid `lpaCode` values from the `Lpa` table.
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
 * @param {import('@pins/inspector-programming-database/src/client').Prisma.AppealCaseCreateInput[]} appeals
 * @param {number} ratio
 */
async function assignAppealLpaCodes(dbClient, appeals, ratio = 1) {
	try {
		if (!appeals.length || ratio <= 0) return;
		const lpas = await dbClient.lpa.findMany({ select: { lpaCode: true } });
		if (!lpas.length) return;

		const targetCount = Math.floor(appeals.length * ratio);
		if (!targetCount) return;

		const indices = appeals.map((_, i) => i);
		const selected = shuffleArray(indices).slice(0, targetCount);

		selected.forEach((appealIdx, i) => {
			const { lpaCode } = lpas[i % lpas.length];
			appeals[appealIdx].lpaCode = lpaCode;
		});
	} catch (err) {
		console.warn('failed assigning LPA codes to appeals', err);
	}
}

/**
 * Generate linked (child) cases for a randomly selected 50% of the supplied appeals.
 * Each selected appeal becomes a lead case with 2 child cases.
 * @param {import('@pins/inspector-programming-database/src/client').Prisma.AppealCaseCreateInput[]} appeals
 * @param {object[]} variations
 * @param {Date} now
 * @returns {import('@pins/inspector-programming-database/src/client').Prisma.AppealCaseCreateInput[]}
 */
function generateLinkedCases(appeals, variations, now) {
	const linkedCases = [];

	// 50% of appeals become lead cases
	const leadCaseCount = Math.floor(appeals.length * 0.5);
	const allIndices = Array.from({ length: appeals.length }, (_, i) => i);
	const shuffledIndices = shuffleArray(allIndices);
	const selectedLeadIndices = shuffledIndices.slice(0, leadCaseCount);

	for (const leadIndex of selectedLeadIndices) {
		const leadCaseReference = appeals[leadIndex].caseReference;

		// mark the existing appeal as a parent case
		appeals[leadIndex].linkedCaseStatus = 'Parent';

		for (let j = 0; j < 2; j++) {
			const childIndex = appeals.length + linkedCases.length + 1;
			const paddedIndex = String(childIndex).padStart(6, '0');
			const reference = `6${paddedIndex}`;
			const location = mockLocations[childIndex % mockLocations.length];
			const valid = addWeeks(now, -Math.floor(childIndex / 2));
			const created = addDays(valid, -crypto.randomInt(5));
			const finalCommentsDue = addWeeks(valid, 5);

			linkedCases.push({
				...mockAppeal,
				...variations[leadIndex % variations.length],
				caseId: childIndex,
				siteAddressPostcode: location.siteAddressPostcode,
				siteAddressLatitude: location.siteAddressLatitude,
				siteAddressLongitude: location.siteAddressLongitude,
				caseReference: reference,
				leadCaseReference,
				caseCreatedDate: created,
				caseValidDate: valid,
				finalCommentsDueDate: finalCommentsDue,
				linkedCaseStatus: 'Child',
				Specialisms: generateCaseSpecialisms(),
				Events: generateCaseEvents(reference, valid)
			});
		}
	}
	return linkedCases;
}
