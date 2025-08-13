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
			 * @type {(import("./types").CalendarEvent)[][]}
			 */
			const calendarEvents = [];

			//should not be able to use endpoint without valid config: fetch far too many events otherwise
			const { calendarEventsDayRange, calendarEventsStartDateOffset } = service.entraConfig;
			if (!+calendarEventsDayRange) {
				res.status(400).send('Invalid calendar events day range configuration');
				return;
			}

			//chunk users into groups of 5 to avoid overwhelming the API with requests
			const chunkedUsers = chunkArray(usersInGroups, 5);
			for (const userChunk of chunkedUsers) {
				const chunkEvents = await Promise.all(
					userChunk.map(async (user) => {
						const usersEvents = await apiService.entraClient.listAllUserCalendarEvents(user.id, {
							calendarEventsDayRange: calendarEventsDayRange,
							calendarEventsStartDateOffset: calendarEventsStartDateOffset
						});

						//for validating that the events are within the date range
						const [startOfDateRange, endOfDateRange] = [new Date(), new Date()];
						startOfDateRange.setDate(startOfDateRange.getDate() + calendarEventsStartDateOffset);
						endOfDateRange.setDate(endOfDateRange.getDate() - calendarEventsDayRange);
						startOfDateRange.setHours(23, 59, 59, 999); //Set to end of the day
						endOfDateRange.setHours(0, 0, 0, 0); // Set to start of the day

						//format returned events for PowerBI
						//startDate and endDate are in UTC timezone
						const formattedEvents = [];
						for (const event of usersEvents || []) {
							//if events are outside the configured date range Graph API may be incorrectly configured
							if (new Date(event.end.dateTime) < endOfDateRange || new Date(event.end.dateTime) > startOfDateRange) {
								throw new Error(`Event ${event.id} for user ${user.email} is outside the configured date range`);
							}
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
				calendarEvents.push(...chunkEvents);
			}

			res.status(200).send(calendarEvents.flat());
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
