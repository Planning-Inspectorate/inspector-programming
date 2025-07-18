//import { authenticateGraphClient } from '../../auth/graph-client.js';
import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';
import dummyUsers from './dummy-users.js';

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
		//const client = authenticateGraphClient(req);
		const { query } = req;

		//fetch data from client (todo)
		//but for now:
		let data = dummyUsers || [];

		//optional filtering
		data = query.groupId
			? data.filter((user) => [query.groupId, `Group ${query.groupId}`].includes(user.groupId))
			: data;

		logger.info('API /users endpoint');
		res.status(200).json({ status: 'ok', users: data });
	};
}
