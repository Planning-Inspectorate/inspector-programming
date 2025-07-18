import { authenticateGraphClient } from '../../auth/graph-client.js';
import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter();

	router.get('/', asyncHandler(buildUsersApi(service)));

	return router;
}

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildUsersApi(service) {
	const { logger } = service;
	return async (req, res) => {
		const client = authenticateGraphClient(req);
		const tempGroupId = '0ae5fff7-2cf9-4ea5-ad83-cc2c8d4fbef9';
		const apiResult = await client.api(`/groups/${tempGroupId}/transitiveMembers`).get();

		//TODO
		//enable group id to be passed as parameter
		//update openapi doc once endpoint is working and grabbing users properly

		logger.info('API /users endpoint');
		res.status(200).json({ status: 'ok', users: apiResult.value });
	};
}
