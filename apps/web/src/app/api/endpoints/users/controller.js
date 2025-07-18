import { authenticateGraphClient } from '../../auth/graph-client.js';
import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter();

	router.get('/:groupId', asyncHandler(buildUsersApi(service)));

	return router;
}

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildUsersApi(service) {
	const { logger } = service;
	return async (req, res) => {
		//sanitise groupid param to only contain numbers, letters and hyphens (as GraphAPI id's do)
		if (!/^[A-Za-z0-9-]+$/.test(req.params.groupId)) {
			res.status(400).json({ status: 'Invalid groupId' });
			return;
		}

		try {
			const client = authenticateGraphClient(req);
			const apiResult = await client.api(`/groups/${encodeURIComponent(req.params.groupId)}/transitiveMembers`).get();

			res.status(200).send(
				!apiResult?.value?.length
					? []
					: apiResult.value.map(
							/** @param {{id: string, displayName: string, mail: string}} user */
							(user) => {
								return {
									id: user.id,
									displayName: user.displayName,
									email: user.mail,
									groupId: req.params.groupId
								};
							}
						)
			);
		} catch (err) {
			logger.error(`API /users error: ${err}`);
			res.status(500).send('An server error occurred');
		} finally {
			logger.info('API /users endpoint');
		}
	};
}
