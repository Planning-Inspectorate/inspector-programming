import { Client } from '@microsoft/microsoft-graph-client';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildApiHealth(service) {
	const { logger } = service;
	return async (req, res) => {
		const authHeader = req.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('missing authorization');
		}
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken() {
					return req.get('authorization').substring(7); // Remove 'Bearer ' prefix
				}
			}
		});

		const me = await client.api('/me').get();

		logger.info('API health check endpoint');
		res.status(200).json({ status: 'ok', me });
	};
}
