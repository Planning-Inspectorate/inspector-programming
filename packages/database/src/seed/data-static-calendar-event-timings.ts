// @ts-ignore - these do exist and work!
import { APPEAL_ALLOCATION_LEVEL, APPEAL_CASE_PROCEDURE, APPEAL_CASE_TYPE } from '@planning-inspectorate/data-model';
import { calendarEventTimingIds } from './data-static-guids.js';
import type { Prisma } from '@pins/inspector-programming-database/src/client/client.ts';

interface CalendarEventTimingRule extends Omit<Prisma.CalendarEventTimingCreateInput, 'CalendarEventTimingRules'> {
	AppliesTo: {
		caseType: string;
		caseProcedure: string;
		allocationLevels: string[];
	}[];
}

const allocationLevels = {
	F_G: [APPEAL_ALLOCATION_LEVEL.F, APPEAL_ALLOCATION_LEVEL.G],
	get F_G_H() {
		return [...this.F_G, APPEAL_ALLOCATION_LEVEL.H];
	},
	A_TO_E: [
		APPEAL_ALLOCATION_LEVEL.A,
		APPEAL_ALLOCATION_LEVEL.B,
		APPEAL_ALLOCATION_LEVEL.C,
		APPEAL_ALLOCATION_LEVEL.D,
		APPEAL_ALLOCATION_LEVEL.E
	],
	get A_TO_G() {
		return [...this.A_TO_E, APPEAL_ALLOCATION_LEVEL.F, APPEAL_ALLOCATION_LEVEL.G];
	}
};

const calendarEventTimingsRules: CalendarEventTimingRule[] = [
	{
		id: calendarEventTimingIds[0],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.D, // householder
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.F_G_H
			}
		],
		prepTime: 0,
		siteVisitTime: 2,
		reportTime: 6,
		costsTime: 2
	},
	{
		id: calendarEventTimingIds[1],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.D, // householder
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.A_TO_E
			}
		],
		prepTime: 0,
		siteVisitTime: 2,
		reportTime: 10,
		costsTime: 2
	},
	{
		id: calendarEventTimingIds[2],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.ZP, // CAS Planning
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: [APPEAL_ALLOCATION_LEVEL.H]
			},
			{
				caseType: APPEAL_CASE_TYPE.ZA, // CAS Advert
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: [APPEAL_ALLOCATION_LEVEL.H]
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 4,
		costsTime: 2
	},
	{
		id: calendarEventTimingIds[3],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.W, // S78/Planning
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.F_G_H
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 8,
		costsTime: 4
	},
	{
		id: calendarEventTimingIds[4],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.W, // S78/Planning
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.A_TO_E
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 12,
		costsTime: 4
	},
	{
		id: calendarEventTimingIds[5],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.Y, // Listed building
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.F_G_H
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 8,
		costsTime: 4
	},
	{
		id: calendarEventTimingIds[6],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.Y, // Listed building
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.A_TO_E
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 12,
		costsTime: 4
	},
	{
		id: calendarEventTimingIds[7],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.C, // Enforcement notice
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.F_G
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 12,
		costsTime: 4
	},
	{
		id: calendarEventTimingIds[8],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.C, // Enforcement notice
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.A_TO_E
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 16,
		costsTime: 4
	},
	{
		id: calendarEventTimingIds[9],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.F, // Enforcement listed building and conservation area
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.A_TO_G
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 16,
		costsTime: 4
	},

	{
		id: calendarEventTimingIds[10],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.X, // Lawful development certificate
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.F_G
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 12,
		costsTime: 4
	},
	{
		id: calendarEventTimingIds[11],
		AppliesTo: [
			{
				caseType: APPEAL_CASE_TYPE.X, // Lawful development certificate
				caseProcedure: APPEAL_CASE_PROCEDURE.WRITTEN,
				allocationLevels: allocationLevels.A_TO_E
			}
		],
		prepTime: 2,
		siteVisitTime: 2,
		reportTime: 16,
		costsTime: 4
	}
];

function ruleToCreateInput(rule: CalendarEventTimingRule): Prisma.CalendarEventTimingCreateInput {
	const rules: Prisma.CalendarEventTimingRuleCreateOrConnectWithoutCalendarEventTimingInput[] = [];
	for (const appliesTo of rule.AppliesTo) {
		for (const allocationLevel of appliesTo.allocationLevels) {
			const caseType_caseProcedure_allocationLevel = {
				caseType: appliesTo.caseType,
				caseProcedure: appliesTo.caseProcedure,
				allocationLevel
			};
			rules.push({
				where: {
					caseType_caseProcedure_allocationLevel
				},
				create: caseType_caseProcedure_allocationLevel
			});
		}
	}
	return {
		id: rule.id,
		CalendarEventTimingRules: {
			connectOrCreate: rules
		},
		prepTime: rule.prepTime,
		siteVisitTime: rule.siteVisitTime,
		reportTime: rule.reportTime,
		costsTime: rule.costsTime
	};
}

export const calendarEventTimings: Prisma.CalendarEventTimingCreateInput[] =
	calendarEventTimingsRules.map(ruleToCreateInput);
