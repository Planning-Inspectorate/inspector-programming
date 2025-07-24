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
 *
 * Used to retrieve information about all PINS users in the Entra groups specified in config as a CSV string.
 * Mainly intended for use in PowerBI reporting
 */
export function getUsersInEntraGroups(service) {
	const { logger, apiService } = service;
	return async (req, res) => {
		const { inspectorGroups } = service.entraConfig.groupIds;
		if (!inspectorGroups?.length) {
			res.status(404).send('No Entra groups configured');
			return;
		}

		//validate the inspectorGroups csv string and reject if will obviously fail
		const groupsArray = inspectorGroups.split(',').map((id) => id.trim());
		if (groupsArray.some((id) => !id)) {
			res.status(400).send('Invalid Entra group configuration');
			return;
		}

		try {
			const allUsers = await Promise.all(
				groupsArray.map(async (id) => {
					const groupMembers = await apiService.entraClient.listAllGroupMembers(id);

					//format returned members for PowerBI
					const usersInGroup = [];
					for (const user of groupMembers || []) {
						usersInGroup.push({
							id: user.id,
							displayName: `${user.givenName} ${user.surname}`,
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
