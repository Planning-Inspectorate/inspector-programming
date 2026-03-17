import { writeFile } from 'node:fs/promises';
import { LPAS_DEV } from './data-lpa-dev.ts';
import path from 'node:path';
import { Prisma } from '@pins/inspector-programming-database/src/client/client.ts';
import { LPA_REGION_IDS } from './lpa-regions.js';
import { LPAS_PROD } from './data-lpa-prod.ts';

const devList = `https://raw.githubusercontent.com/Planning-Inspectorate/appeals-back-office/refs/heads/main/appeals/api/src/database/seed/LPAs/dev.js`;
const prodList = `https://raw.githubusercontent.com/Planning-Inspectorate/appeals-back-office/refs/heads/main/appeals/api/src/database/seed/LPAs/prod.js`;

/**
 * Fetch the manage appeals lpas lists and update the local seed scripts
 * Check any changes after running this script before commiting
 */
async function fetchManageAppealsLpaList() {
	// load the LPA seed scripts from the manage appeals repo using dynamic data imports
	const { localPlanningDepartmentList: devLpaList } = await import(await fetchFileForImport(devList));
	const { localPlanningDepartmentList: prodLpaList } = await import(await fetchFileForImport(prodList));
	console.log('dev', devLpaList.length);
	console.log('prod', prodLpaList.length);

	if (devLpaList.length > 50) {
		throw new Error('Expected < 50 dev LPAs');
	}

	if (prodLpaList.length < 300) {
		throw new Error('Expected > 300 LPAs');
	}
	// merge the manage appeals list with the local lists
	const dev = mergeLpaLists(LPAS_DEV, devLpaList, LPA_REGION_MAP_DEV);
	const prod = mergeLpaLists(LPAS_PROD, prodLpaList, LPA_REGION_MAP_PROD);
	console.log('merged, dev', dev.length);
	console.log('merged, prod', prod.length);

	// write the new lists to the data-lpa-* files
	let devFile = `import { LPA_REGION_IDS } from './lpa-regions.js';\n\n// Test LPAs from Manage appeals\nexport const LPAS_DEV = Object.freeze([`;
	for (const lpa of dev) {
		devFile += `\n    ${printLpa(lpa)},`;
	}
	devFile += `\n]);\n`;
	await writeFile(path.join(import.meta.dirname, 'data-lpa-dev.ts'), devFile);

	let prodFile = `import { LPA_REGION_IDS } from './lpa-regions.js';\n\nexport const LPAS_PROD = Object.freeze([`;
	for (const lpa of prod) {
		prodFile += `\n    ${printLpa(lpa)},`;
	}
	prodFile += `\n]);\n`;
	await writeFile(path.join(import.meta.dirname, 'data-lpa-prod.ts'), prodFile);
	console.log('laps written to file');
}

type Lpa = Prisma.LpaCreateInput;
interface ManageAppealsLpa {
	lpaCode: string;
	name: string;
	teamId: number;
}

function printLpa(lpa: Lpa): string {
	const regionName = lpaRegionVariableName(lpa.LpaRegion.connect?.id);
	const variables: (keyof Lpa)[] = ['lpaCode', 'lpaName'];
	let output = '{';
	for (const variable of variables) {
		output += variable + ': "' + lpa[variable] + '", ';
	}
	output += `LpaRegion: { connect: { id: ${regionName} } }`;
	output += '}';
	return output;
}

function mergeLpaLists(
	local: typeof LPAS_DEV | typeof LPAS_PROD,
	manageAppeals: ManageAppealsLpa[],
	regions: Map<number, string>
): Lpa[] {
	const list: Lpa[] = [];
	for (const lpa of manageAppeals) {
		const existing = local.find((l) => l.lpaCode === lpa.lpaCode);
		if (existing) {
			list.push({
				...existing,
				lpaName: lpa.name
			});
		} else {
			// default null or undefined to WEST_1, for test LPAs
			const regionId = lpa.teamId ? regions.get(lpa.teamId) : LPA_REGION_IDS.WEST_1;
			if (!regionId) {
				throw new Error('No region ID mapping for' + lpa.teamId);
			}
			list.push({
				lpaCode: lpa.lpaCode,
				lpaName: lpa.name,
				LpaRegion: { connect: { id: regionId } }
			});
		}
	}
	return list;
}

function lpaRegionVariableName(value: string | undefined): string {
	if (!value) {
		throw new Error('no region id');
	}
	const entry = Object.entries(LPA_REGION_IDS).find(([k, v]) => v === value);
	if (!entry) {
		throw new Error('No region ID mapping for ' + value);
	}
	return `LPA_REGION_IDS.${entry[0]}`;
}

// mapping of 'teamId' to region
// see https://github.com/Planning-Inspectorate/appeals-back-office/blob/dc986bd92bbfbc849fb38ab107fdc2c167169b48/appeals/api/src/database/seed/teams/prod.js#L1
const LPA_REGION_MAP_PROD: Map<number, string> = new Map([
	[7, LPA_REGION_IDS.WEST_1],
	[8, LPA_REGION_IDS.WEST_2],
	[9, LPA_REGION_IDS.WEST_3],
	[10, LPA_REGION_IDS.WEST_4],
	[11, LPA_REGION_IDS.EAST_1],
	[12, LPA_REGION_IDS.EAST_2],
	[13, LPA_REGION_IDS.EAST_3],
	[14, LPA_REGION_IDS.EAST_4],
	[15, LPA_REGION_IDS.NORTH_1],
	[16, LPA_REGION_IDS.NORTH_2],
	[17, LPA_REGION_IDS.NORTH_3],
	[18, LPA_REGION_IDS.NORTH_4]
]);

const LPA_REGION_MAP_DEV: Map<number, string> = new Map([
	[1, LPA_REGION_IDS.WEST_1],
	[2, LPA_REGION_IDS.EAST_1],
	[3, LPA_REGION_IDS.NORTH_1]
]);

async function fetchFileForImport(url: string) {
	const res = await fetch(url);
	if (!res.ok) {
		try {
			console.log('manage appeals file fetch error', await res.text());
			// eslint-disable-next-line no-empty
		} catch {} // ignore errors
		throw new Error(`error fetching file ${res.statusText} ${res.status}`);
	}

	const data = await res.arrayBuffer();
	return 'data:text/javascript;base64,' + Buffer.from(data).toString('base64');
}

fetchManageAppealsLpaList();
