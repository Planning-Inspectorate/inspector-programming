import { BaseService } from '@pins/inspector-programming-lib/app/base-service.js';
import { buildInitEntraClient } from '@pins/inspector-programming-lib/graph/cached-entra-client.js';
import { MapCache } from '@pins/inspector-programming-lib/util/map-cache.js';
import { ApiService } from './api/api-service.js';
import { CasesClient } from '@pins/inspector-programming-lib/data/database/cases-client.js';
import { InspectorClient } from '@pins/inspector-programming-lib/data/database/inspector-client.js';
import { OsApiClient } from '@pins/inspector-programming-lib/os/os-api-client.js';

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
		const entraGroupCache = new MapCache(config.entra.cacheTtl);
		this.entraClient = buildInitEntraClient(!config.auth.disabled, entraGroupCache);
		this.apiService = new ApiService(this);

		this.osApiClient = new OsApiClient(config.osApi.key);
		this.casesClient = new CasesClient(this.dbClient, this.osApiClient);
		this.inspectorClient = new InspectorClient(this.dbClient);
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
