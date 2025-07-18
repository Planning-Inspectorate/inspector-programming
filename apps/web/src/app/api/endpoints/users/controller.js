import { authenticateGraphClient } from '../../auth/graph-client.js';
/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildUsersApi(service) {
	const { logger } = service;
	return async (req, res) => {
		const client = authenticateGraphClient(req);
		const me = await client.api('/me').get();

		logger.info('API health check endpoint');
		res.status(200).json({ status: 'ok', me });
	};
}
