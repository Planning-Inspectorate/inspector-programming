import { LPA_REGIONS, LPA_REGION_NAMES } from './lpa-regions.js';
import { calendarEventTimings } from './data-static-calendar-event-timings.ts';
import { normalizeString } from '@pins/inspector-programming-lib/util/normalize.js';
import { INSPECTOR_TO_CASE_SPECIALISM_MAP } from './specialism-mapping.js';
import { LpaBoundariesClient } from './lpa-boundaries/lpa-boundaries-client.ts';
import { sleep } from '@pins/inspector-programming-lib/util/sleep.ts';

/**
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.LpaCreateInput[]} lpaList
 */
export async function seedStaticData(dbClient, lpaList) {
	let error;
	await seedCalendarEventTimings(dbClient);
	await seedLpaRegionsAndLpas(dbClient, lpaList);
	try {
		await seedLpaGeometries(dbClient);
	} catch (err) {
		console.error('LPA geometries error', err);
		error = err;
	}
	await seedInspectorCaseSpecialismMapping(dbClient);
	if (error) {
		// ensure the pipeline shows a failure but not before trying all steps
		throw error;
	}
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
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.LpaCreateInput[]} lpaList
 */
async function seedLpaRegionsAndLpas(dbClient, lpaList) {
	for (const region of LPA_REGIONS) {
		await dbClient.lpaRegion.upsert({
			where: { id: region.id },
			create: region,
			update: { number: region.number }
		});
	}
	for (const lpa of lpaList) {
		await dbClient.lpa.upsert({
			where: { lpaCode: lpa.lpaCode },
			create: lpa,
			update: lpa
		});
	}
	console.log(
		'seeding',
		lpaList.length,
		'LPAs',
		LPA_REGIONS.length,
		'regions and',
		Object.keys(LPA_REGION_NAMES).length,
		'region names'
	);
}

async function seedLpaGeometries(dbClient) {
	console.log('adding LPA geometries');
	const client = new LpaBoundariesClient();
	console.log('  downloading LPA geometry data');
	const geometries = await client.getLpaBoundaries();

	const geometryByOnsCode = new Map();
	for (const geometry of geometries) {
		geometryByOnsCode.set(geometry.properties.reference, geometry.geometry);
	}

	console.log('  got', geometryByOnsCode.size, 'geometries');
	console.log('  fetching LPAs from the DB');
	const lpas = await dbClient.lpa.findMany({
		select: {
			lpaName: true,
			lpaCode: true,
			onsCode: true
		}
	});
	console.log('  got', lpas.length, 'LPAs');
	let count = 0;
	for (const lpa of lpas) {
		if (lpa.onsCode) {
			// some LPAs have multiple codes associated, find hte first geometry match
			const codes = lpa.onsCode.split(';').map((code) => code.trim());
			for (const code of codes) {
				const found = await addLpaGeometry(dbClient, client, { ...lpa, onsCode: code }, geometryByOnsCode);
				if (found) {
					count++;
					break;
				}
			}
		}
	}
	console.log('  added geometries to', count, 'lpas');
}

async function addLpaGeometry(dbClient, boundaryClient, lpa, geometryByOnsCode) {
	const geometry = geometryByOnsCode.get(lpa.onsCode);
	if (geometry) {
		await dbClient.lpa.update({
			where: { lpaCode: lpa.lpaCode },
			data: {
				geometry: JSON.stringify(geometry)
			}
		});
		return true;
	} else {
		await sleep(250); // crude rate limiting
		const res = await boundaryClient.getCountyBoundary(lpa.onsCode);
		if (res !== null) {
			console.log('  got geometry for', lpa.lpaName, 'in counties');
			await dbClient.lpa.update({
				where: { lpaCode: lpa.lpaCode },
				data: {
					geometry: JSON.stringify(res)
				}
			});
			return true;
		}
	}
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
