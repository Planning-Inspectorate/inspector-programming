import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';
import { getUsersInEntraGroups } from '../users/controller.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter();

	router.get('/', asyncHandler(getCalendarEventsForEntraUsers(service)));

	return router;
}

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 *
 * Used to retrieve calendar events for all PINS users in the Entra groups specified in config.
 * Mainly intended for use in PowerBI reporting
 */
export function getCalendarEventsForEntraUsers(service) {
	const { logger, apiService } = service;
	return async (req, res) => {
		try {
			const { inspectorGroups } = service.entraConfig.groupIds;
			const usersInGroups = await getUsersInEntraGroups(apiService, inspectorGroups);

			if (!usersInGroups.length) {
				res.status(404).send('No users found in Entra groups');
				return;
			}

			/**
			 * @type {(import("./types").CalendarEvent)[]}
			 */
			let calendarEvents = [];

			//should not be able to use endpoint without valid config: fetch far too many events otherwise
			const { calendarEventsDayRange } = service.entraConfig;
			if (+calendarEventsDayRange < 0) {
				res.status(400).send('Invalid calendar events day range configuration');
				return;
			}

			const chunkedUsers = chunkArray(usersInGroups, 5);
			for (const userChunk of chunkedUsers) {
				const chunkEvents = await Promise.all(
					userChunk.map(async (user) => {
						const usersEvents = await apiService.entraClient.listAllUserCalendarEvents(user.id, calendarEventsDayRange);

						//format returned events for PowerBI
						//startDate and endDate are in UTC timezone
						const formattedEvents = [];
						for (const event of usersEvents || []) {
							formattedEvents.push({
								id: event.id,
								userEmail: user.email,
								title: event.subject,
								startDate: event.start?.dateTime || 'N/A',
								endDate: event.end?.dateTime || 'N/A'
							});
						}
						return formattedEvents;
					})
				);
				calendarEvents = calendarEvents.concat(chunkEvents.flat());
			}

			res.status(200).send(calendarEvents);
			return;
		} catch (err) {
			logger.error({ err }, `API /events error`);
			res.status(500).send('A server error occurred');
		} finally {
			logger.info('API /events endpoint');
		}
	};
}

/**
 *
 * @param {any[]} array
 * @param {number} chunkSize
 * @returns
 */
function chunkArray(array, chunkSize) {
	const chunks = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}
