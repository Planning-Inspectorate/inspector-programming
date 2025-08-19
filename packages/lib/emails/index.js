import { GovNotifyClient } from './gov-notify-client.js';

/**
 * @param {import('./types.js').NotifyConfig} config
 * @param {import('pino').Logger} logger
 * @returns {GovNotifyClient|null}
 */
export function initGovNotify(config, logger) {
	if (config.disabled) {
		return null;
	}

	if (!config.apiKey) {
		return null;
	}

	return new GovNotifyClient(logger, config.apiKey, config.templateIds);
}
