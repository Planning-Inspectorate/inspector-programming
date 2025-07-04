import { BaseService } from '@pins/service-name-lib/app/base-service.js';

/**
 * This class encapsulates all the services and clients for the application
 */
export class App2Service extends BaseService {
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
	}

	/**
	 * @type {import('./config-types.js').Config['auth']}
	 */
	get authConfig() {
		return this.#config.auth;
	}

	get authDisabled() {
		return this.#config.auth.disabled;
	}
}
