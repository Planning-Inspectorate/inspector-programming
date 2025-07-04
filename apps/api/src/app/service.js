import { BaseService } from '@pins/service-name-lib/app/base-service.js';

/**
 * This class encapsulates all the services and clients for the application
 */
export class App1Service extends BaseService {
	/**
	 * @param {import('./config-types.js').Config} config
	 */
	constructor(config) {
		super(config);
	}
}
