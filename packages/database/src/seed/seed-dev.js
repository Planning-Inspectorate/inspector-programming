import { newDatabaseClient } from '../index.js';
import { seedStaticData } from './data-static.js';
import { seedDev } from './data-dev.js';
import { loadConfig } from '../configuration/config.js';

async function run() {
	const config = loadConfig();
	const dbClient = newDatabaseClient(config.db);

	try {
		await seedStaticData(dbClient);
		await seedDev(dbClient);
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();
