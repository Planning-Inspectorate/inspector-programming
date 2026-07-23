import { newDatabaseClient } from '@pins/inspector-programming-database';
import { CbosApiClient } from '@pins/inspector-programming-lib/data/cbos/cbos-api-client.js';
import { OsApiClient } from '@pins/inspector-programming-lib/os/os-api-client.js';
import { initLogger } from '@pins/inspector-programming-lib/util/logger.js';
import { ApplicationInsightsClient } from '@pins/inspector-programming-lib/util/app-insights-client.js';
import { FunctionGovNotifyClient } from './functions/weekly-report/gov-notify-client.js';

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
	 * @type {import('@pins/inspector-programming-lib/util/app-insights-client.js').ApplicationInsightsClient|undefined}
	 */
	appInsightsClient;
	/**
	 * @type {import('./functions/weekly-report/gov-notify-client.js').FunctionGovNotifyClient|undefined}
	 */
	govNotifyClient;

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

		if (this.weeklyReportEnabled) {
			const weeklyReport = config.weeklyReport;
			this.appInsightsClient = new ApplicationInsightsClient(weeklyReport.appInsightsWorkspaceId, logger);
			this.govNotifyClient = new FunctionGovNotifyClient(
				logger,
				weeklyReport.notifyApiKey,
				weeklyReport.notifyTemplateId
			);
		}
	}

	get databaseTransactionOptions() {
		return {
			maxWait: this.#config.database.transactionMaxWait
		};
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
	get appealEventServiceBusConfig() {
		return this.#config.serviceBus.appealEvent;
	}
	get syncCasesTransactionOptions() {
		return {
			maxWait: this.#config.syncCases.transactionWaitTime,
			timeout: this.#config.syncCases.transactionTimeout
		};
	}

	get weeklyReportEnabled() {
		const config = this.#config.weeklyReport;
		return Boolean(
			config.appInsightsWorkspaceId && config.notifyApiKey && config.notifyTemplateId && config.emailAddress
		);
	}

	get weeklyReportEmail() {
		return this.#config.weeklyReport.emailAddress;
	}
}
