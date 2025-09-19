import { APPEAL_ALLOCATION_LEVEL, APPEAL_CASE_PROCEDURE, APPEAL_CASE_TYPE } from '@planning-inspectorate/data-model';
import { calendarEventTimingIds } from './data-static-guids.js';
import { LPA_REGIONS, LPAS, LPA_REGION_NAMES } from './lpa-regions.js';

/**
 * @type {import('@pins/inspector-programming-database/src/client').Prisma.CalendarEventTimingCreateInput[]}
 */
const calendarEventTimings = [
	{
		id: calendarEventTimingIds[0],
		CalendarEventTimingRules: {
			connectOrCreate: [
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.D, //householder
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.F
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.D,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.F
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.D, //householder
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.G
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.D,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.G
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.D, //householder
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.H
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.D,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.H
					}
				}
			]
		},
		prepTime: 0,
		siteVisitTime: 2,
		reportTime: 6,
		costsTime: 2
	},
	{
		id: calendarEventTimingIds[1],
		CalendarEventTimingRules: {
			connectOrCreate: [
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.D, //householder
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.A
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.D,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.A
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.D, //householder
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.B
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.D,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.B
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.D, //householder
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.C
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.D,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.C
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.D, //householder
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.D
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.D,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.D
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.D, //householder
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.E
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.D,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.E
					}
				}
			]
		},
		prepTime: 0,
		siteVisitTime: 2,
		reportTime: 10,
		costsTime: 2
	},
	{
		id: calendarEventTimingIds[2],
		CalendarEventTimingRules: {
			connectOrCreate: [
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.H, //advertisement
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.H
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.H,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.H
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.ZA, //CAS Adverts
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.H
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.ZA,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.H
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.ZP, //CAS Planning
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.H
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.ZP,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.H
					}
				}
			]
		},
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 4,
		costsTime: 2
	},
	{
		id: calendarEventTimingIds[3],
		CalendarEventTimingRules: {
			connectOrCreate: [
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.W, //S78 / Planning
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.F
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.W,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.F
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.W, //S78 / Planning
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.G
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.W,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.G
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.W, //S78 / Planning
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.H
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.W,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.H
					}
				}
			]
		},
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 8,
		costsTime: 4
	},
	{
		id: calendarEventTimingIds[4],
		CalendarEventTimingRules: {
			connectOrCreate: [
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.W, //S74 / Planning
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.A
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.W,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.A
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.W, //S74 / Planning
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.B
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.W,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.B
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.W, //S74 / Planning
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.C
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.W,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.C
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.W, //S74 / Planning
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.D
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.W,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.D
					}
				},
				{
					where: {
						caseType_caseProcedure_allocationLevel: {
							caseType: APPEAL_CASE_TYPE.W, //S74 / Planning
							caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
							allocationLevel: APPEAL_ALLOCATION_LEVEL.E
						}
					},
					create: {
						caseType: APPEAL_CASE_TYPE.W,
						caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
						allocationLevel: APPEAL_ALLOCATION_LEVEL.E
					}
				}
			]
		},
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 12,
		costsTime: 4
	}
];

/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
 */
export async function seedStaticData(dbClient) {
	await seedCalendarEventTimings(dbClient);
	await seedLpaRegionsAndLpas(dbClient);
	console.log('static data seed complete');
}

/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
 */
async function seedCalendarEventTimings(dbClient) {
	console.log('seeding', calendarEventTimings.length, 'calendar event timing rules');
	for (const timing of calendarEventTimings) {
		await dbClient.calendarEventTiming.upsert({
			where: { id: timing.id },
			create: timing,
			update: timing
		});
	}
}

/**
 * Seed Region names and Regions explicitly, then upsert LPAs by connecting to known Region IDs.
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
 */
async function seedLpaRegionsAndLpas(dbClient) {
	for (const region of LPA_REGIONS) {
		await dbClient.lpaRegion.upsert({
			where: { id: region.id },
			create: region,
			update: { number: region.number }
		});
	}
	for (const lpa of LPAS) {
		await dbClient.lpa.upsert({
			where: { lpaCode: lpa.lpaCode },
			create: lpa,
			update: { LpaRegion: lpa.LpaRegion }
		});
	}
	console.log(
		'seeding',
		LPAS.length,
		'LPAs',
		LPA_REGIONS.length,
		'regions and',
		Object.keys(LPA_REGION_NAMES).length,
		'region names'
	);
}
