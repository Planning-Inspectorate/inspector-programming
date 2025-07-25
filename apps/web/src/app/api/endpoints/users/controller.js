import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter();

	router.get('/', asyncHandler(handleGetUsersInEntraGroups(service)));

	return router;
}

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 * Wrapper function to call getUsersInEntraGroups and handle the output for api requests.
 */
function handleGetUsersInEntraGroups(service) {
	const { logger, apiService } = service;
	return async (req, res) => {
		try {
			const { inspectorGroups } = service.entraConfig.groupIds;
			const users = await getUsersInEntraGroups(apiService, inspectorGroups);
			res.status(200).send(users);
		} catch (err) {
			logger.error({ err }, '	API /users error');
			switch (err.message) {
				case 'No Entra groups configured':
					res.status(404).send('No Entra groups configured');
					return;
				case 'Invalid Entra group configuration':
					res.status(400).send('Invalid Entra group configuration');
					return;
				default:
					res.status(500).send('A server error occurred');
			}
			res.status(500).send('A server error occurred');
		} finally {
			logger.info('API /users endpoint');
		}
	};
}
/**
 * @param {import("#api-service").ApiService} apiService
 * @param {string} inspectorGroups
 * @returns {Promise<import("./types").User[]>}
 *
 * Used to retrieve information about all PINS users in the Entra groups specified in config as a CSV string.
 * Mainly intended for use in PowerBI reporting
 */
export async function getUsersInEntraGroups(apiService, inspectorGroups) {
	if (!inspectorGroups?.length) {
		throw new Error('No Entra groups configured');
	}

	//validate the inspectorGroups csv string and reject if will obviously fail
	const groupsArray = inspectorGroups.split(',').map((id) => id.trim());
	if (groupsArray.some((id) => !id)) {
		throw new Error('Invalid Entra group configuration');
	}

	const allUsers = await Promise.all(
		groupsArray.map(async (id) => {
			const groupMembers = await apiService.entraClient.listAllGroupMembers(id);

			//format returned members for PowerBI
			const usersInGroup = [];
			for (const user of groupMembers || []) {
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
	return allUsers.flat();
}
