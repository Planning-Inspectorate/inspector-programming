import { authenticateGraphClient } from '../../auth/graph-client.js';
import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter();

	router.get('/', asyncHandler(getUsersInEntraGroups(service)));

	return router;
}

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function getUsersInEntraGroups(service) {
	const { logger } = service;
	return async (req, res) => {
		const { powerBiGroups } = service.entraConfig.groupIds;
		if (!powerBiGroups?.length) {
			res.status(404).send('No Entra groups configured');
			return;
		}

		try {
			//PLACEHOLDER - WILL BE REPLACED WITH GABI'S PROPER ENTRA CLIENT
			const client = authenticateGraphClient(req);

			const allUsers = await Promise.all(
				powerBiGroups.map(async (id) => {
					const response = await client.api(`/groups/${encodeURIComponent(id)}/transitiveMembers`).get();

					const usersInGroup = [];
					for (const user of response?.value || []) {
						usersInGroup.push({
							id: user.id,
							displayName: user.displayName,
							email: user.mail,
							groupId: id
						});
					}
					return usersInGroup;
				})
			);

			res.status(200).send(allUsers.flat());
		} catch (err) {
			logger.error(`API /users error: ${err}`);
			res.status(500).send('A server error occurred');
		} finally {
			logger.info('API /users endpoint');
		}
	};
}
