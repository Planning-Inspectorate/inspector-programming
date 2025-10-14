import { newDatabaseClient } from '@pins/inspector-programming-database';
import { CbosApiClient } from '@pins/inspector-programming-lib/data/cbos/cbos-api-client.js';
import { OsApiClient } from '@pins/inspector-programming-lib/os/os-api-client.js';
import { initLogger } from '@pins/inspector-programming-lib/util/logger.js';

/**
 * This class encapsulates all the services and clients for the application
 */
export class FunctionService {
	/**
	 * @type {import('./config-types.js').Config}
	 * @private
	 */
	#config;
	/**
	 * @type {import('pino').Logger}
	 */
	logger;
	/**
	 * @type {import('@pins/inspector-programming-database/src/client').PrismaClient}
	 */
	dbClient;

	/**
	 * @param {import('./config-types.js').Config} config
	 */
	constructor(config) {
		this.#config = config;
		const logger = initLogger(config);
		this.logger = logger;
		this.dbClient = newDatabaseClient(config.database.connectionString);
		const osApiClient = new OsApiClient(config.osApi.key);
		this.cbosClient = new CbosApiClient(config.cbos, osApiClient, logger);
	}

	get cbosFetchCasesSchedule() {
		return this.#config.cbos.fetchCasesSchedule;
	}
}
