import { loadConfig } from './config.js';
import { FunctionService } from './service.js';

/** @type {FunctionService|undefined} */
let service;

/**
 * @returns {FunctionService}
 */
export function initialiseService() {
	if (service) {
		return service;
	}
	const config = loadConfig();
	service = new FunctionService(config);
	return service;
}
