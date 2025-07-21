import { BaseService } from '@pins/inspector-programming-lib/app/base-service.js';
import { buildInitEntraClient } from '@pins/inspector-programming-lib/graph/cached-entra-client.js';
import { MapCache } from '@pins/inspector-programming-lib/util/map-cache.js';
import { ApiService } from './api/api-service.js';
import { CbosApiClient } from '@pins/inspector-programming-lib/data/cbos/cbos-api-client.js';
import { getAccountId } from '../util/account.js';
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
	}

	/**
	 * @type {import('./config-types.js').Config['auth']}
	 */
	get authConfig() {
		return this.#config.auth;
	}

	/**
	 * Returns a cbosApiClient instance for the current user session.
	 * @param {object} session - The current request session
	 */
	getCbosApiClientForSession(session) {
		const userId = getAccountId(session);
		return new CbosApiClient({
			...this.#config.cbos,
			apiHeader: userId
		});
	}

	get entraConfig() {
		return this.#config.entra;
	}

	get authDisabled() {
		return this.#config.auth.disabled;
	}

	get maps() {
		return this.#config.maps;
	}

	get entraGroupIds() {
		return this.#config.entra.groupIds;
	}

	get mockApiData() {
		return this.#config.api.mockData;
	}
}
