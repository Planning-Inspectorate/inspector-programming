import { BaseService } from '@pins/inspector-programming-lib/app/base-service.js';
import { buildInitEntraClient } from '@pins/inspector-programming-lib/graph/cached-entra-client.js';
import { buildInitCasesClient } from '@pins/inspector-programming-lib/data/database/cached-cases-client.js';
import { MapCache } from '@pins/inspector-programming-lib/util/map-cache.js';
import { ApiService } from '#api-service';
import { OsApiClient } from '@pins/inspector-programming-lib/os/os-api-client.js';
import { initGovNotify } from '@pins/inspector-programming-lib/emails/index.js';

/**
 * This class encapsulates all the services and clients for the application
 */
export class WebService extends BaseService {
	/**
	 * @type {import('./config-types.js').Config}
	 * @private
	 */
	#config;

	/**
	 * @param {import('./config-types.js').Config} config
	 */
	constructor(config) {
		super(config);
		this.#config = config;

		this.apiService = new ApiService(this);

		const casesCache = new MapCache(config.cases.casesCacheTtl);
		this.casesClient = buildInitCasesClient(this.dbClient, casesCache);

		const entraGroupCache = new MapCache(config.entra.cacheTtl);
		this.entraClient = buildInitEntraClient(!config.auth.disabled, entraGroupCache);

		this.notifyClient = initGovNotify(config.notify, this.logger);

		this.osApiClient = new OsApiClient(config.osApi.key);
	}

	/**
	 * @type {import('./config-types.js').Config['auth']}
	 */
	get authConfig() {
		return this.#config.auth;
	}

	get entraConfig() {
		return this.#config.entra;
	}

	get authDisabled() {
		return this.#config.auth.disabled;
	}

	get entraGroupIds() {
		return this.#config.entra.groupIds;
	}

	get mockApiData() {
		return this.#config.api.mockData;
	}

	get osMapsApiKey() {
		return this.#config.osApi.key;
	}
}
