import { newDatabaseClient } from '@pins/inspector-programming-database';

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
	 * @type {import('@pins/inspector-programming-database/src/client').PrismaClient}
	 */
	dbClient;

	/**
	 * @param {import('./config-types.js').Config} config
	 */
	constructor(config) {
		this.#config = config;
		this.dbClient = newDatabaseClient(config.database);

		// TODO: add CBOS client
	}

	get cbosFetchCasesSchedule() {
		return this.#config.cbos.fetchCasesSchedule;
	}
}
