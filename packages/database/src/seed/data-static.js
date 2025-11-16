import { LPA_REGIONS, LPAS, LPA_REGION_NAMES } from './lpa-regions.js';
import { calendarEventTimings } from './data-static-calendar-event-timings.ts';
import { normalizeString } from '@pins/inspector-programming-lib/util/normalize.js';
import { INSPECTOR_TO_CASE_SPECIALISM_MAP } from './specialism-mapping.js';

/**
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
 */
export async function seedStaticData(dbClient) {
	await seedCalendarEventTimings(dbClient);
	await seedLpaRegionsAndLpas(dbClient);
	await seedInspectorCaseSpecialismMapping(dbClient);
	console.log('static data seed complete');
}

/**
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
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
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
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

/**
 * Seed InspectorCaseSpecialismMap from inspector-programming-web/src/app/specialism/specialism.ts
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
 */
export async function seedInspectorCaseSpecialismMapping(dbClient) {
	for (const [key, value] of Object.entries(INSPECTOR_TO_CASE_SPECIALISM_MAP)) {
		await dbClient.inspectorCaseSpecialism.upsert({
			where: { inspectorSpecialismNormalized: normalizeString(key) },
			update: { caseSpecialism: value, inspectorSpecialism: key },
			create: {
				inspectorSpecialism: key,
				inspectorSpecialismNormalized: normalizeString(key),
				caseSpecialism: value
			}
		});
	}
	console.log('seeding', Object.keys(INSPECTOR_TO_CASE_SPECIALISM_MAP).length, 'inspector-case specialism mappings');
}
