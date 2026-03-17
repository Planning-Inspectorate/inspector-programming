import { newDatabaseClient } from '../index.js';
import { seedStaticData } from './data-static.js';
import { loadConfig } from '../configuration/config.js';
import { LPAS_PROD } from './data-lpa-prod.ts';

async function run() {
	const config = loadConfig();
	const dbClient = newDatabaseClient(config.db);

	try {
		await seedStaticData(dbClient, LPAS_PROD);
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();
