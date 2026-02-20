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
	 * @type {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient}
	 */
	dbClient;
	/** @type {import('@pins/inspector-programming-lib/os/os-api-client.js').OsApiClient} */
	osApiClient;

	/**
	 * @param {import('./config-types.js').Config} config
	 */
	constructor(config) {
		this.#config = config;
		const logger = initLogger(config);
		this.logger = logger;
		this.dbClient = newDatabaseClient(config.database.connectionString);
		const osApiClient = new OsApiClient(config.osApi.key);
		this.osApiClient = osApiClient;
		this.cbosClient = new CbosApiClient(config.cbos, osApiClient, logger);
	}

	get inspectorServiceBusConfig() {
		return this.#config.serviceBus.inspector;
	}
	get caseHasServiceBusConfig() {
		return this.#config.serviceBus.caseHas;
	}
	get caseS78ServiceBusConfig() {
		return this.#config.serviceBus.caseS78;
	}
	get syncCasesTransactionOptions() {
		return {
			maxWait: this.#config.syncCases.transactionWaitTime,
			timeout: this.#config.syncCases.transactionTimeout
		};
	}
}
