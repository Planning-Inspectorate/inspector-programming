import { Client } from '@microsoft/microsoft-graph-client';

/**
 * @param {import('express').Request} req
 * @returns {import('@microsoft/microsoft-graph-client').Client}
 */
export function authenticateGraphClient(req) {
	const authHeader = req.get('authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		throw new Error('missing authorization');
	}
	return Client.initWithMiddleware({
		authProvider: {
			async getAccessToken() {
				return req.get('authorization')?.substring(7) || ''; // Remove 'Bearer ' prefix
			}
		}
	});
}
