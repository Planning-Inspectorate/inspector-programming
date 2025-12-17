import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';
import { getUsersInEntraGroups } from '../users/controller.js';
import { EXTENSION_ID } from '@pins/inspector-programming-lib/graph/entra.js';

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
	const { apiService } = service;
	const logger = apiService.logger;
	return async (req, res) => {
		try {
			const { inspectorGroups } = service.entraConfig.groupIds;
			const usersInGroups = await getUsersInEntraGroups(apiService, inspectorGroups);

			if (!usersInGroups.length) {
				logger.error('No users found in Entra groups');
				res.status(404).send('No users found in Entra groups');
				return;
			}

			//should not be able to use endpoint without valid config: fetch far too many events otherwise
			const { calendarEventsDayRange, calendarEventsFromDateOffset } = service.entraConfig;
			if (!+calendarEventsDayRange) {
				logger.error(
					{ calendarEventsDayRange, calendarEventsFromDateOffset },
					'invalid calendar events day range configuration'
				);
				res.status(400).send('Invalid calendar events day range configuration');
				return;
			}

			// NOTE
			// this would not work if running multiple instances/scaling
			// only works for a single instance
			// could save this value in Redis instead so it is shared, but then the promise would have to be a poll
			//
			// this is to avoid MailboxConcurrency limit errors
			if (service.apiService.isFetchingEvents) {
				logger.info('already fetching calendar events');
				const events = await service.apiService.fetchingEventsPromise;
				res.status(200).send(events);
				return;
			}

			/**
			 * @returns {Promise<import('./types').CalendarEvent[]>}
			 */
			async function fetchAllEvents() {
				//chunk users into groups of 5 to avoid overwhelming the API with requests
				const chunkedUsers = chunkArray(usersInGroups, 5);
				const allEvents = [];

				for (const userChunk of chunkedUsers) {
					const chunkResults = await Promise.all(
						userChunk.map(async (user) => {
							const usersEvents = await apiService.entraClient.listAllUserCalendarEvents(user.id, {
								calendarEventsDayRange,
								calendarEventsFromDateOffset,
								fetchExtension: true
							});

							//format returned events for PowerBI
							//startDate and endDate are in UTC timezone
							const formattedEvents = [];
							for (const event of usersEvents || []) {
								try {
									// Scenario 1: Check the explicit 'isCancelled' flag from Graph API
									const isCancelledFlag = event.isCancelled === true;

									// Scenario 3: Legacy fallback - Check if title starts with "CANCELLED:"
									const hasCancelledTitle = (event.subject || '').toUpperCase().startsWith('CANCELLED:');

									if (isCancelledFlag || hasCancelledTitle) {
										logger.debug({ eventId: event.id, userEmail: user.email }, 'Filtering out cancelled event');
										continue;
									}

									// Format the event
									const formatted = formatCalendarEvent(event, user);
									formattedEvents.push(formatted);
								} catch (err) {
									logger.error(
										{ err, eventId: event?.id, userEmail: user.email },
										'Excluding malformed or invalid event'
									);
								}
							}
							return formattedEvents;
						})
					);
					allEvents.push(...chunkResults.flat());
				}
				return allEvents;
			}

			logger.info('fetching calendar events');
			service.apiService.isFetchingEvents = true;
			// save the promise for other requests to wait on
			service.apiService.fetchingEventsPromise = fetchAllEvents();

			const events = await service.apiService.fetchingEventsPromise;
			service.apiService.isFetchingEvents = false;
			logger.info('fetched calendar events');

			res.status(200).send(events);
		} catch (err) {
			logger.error({ err }, `/events error`);
			res.status(500).send('A server error occurred');
		} finally {
			// ensure we set to false for future requests to try again
			service.apiService.isFetchingEvents = false;
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

/** @typedef {import('@pins/inspector-programming-lib/graph/types').CalendarEvent} GraphCalendarEvent */
/** @typedef {import('./types').CalendarEvent} AppCalendarEvent */
/** @typedef {import('../users/types').User} User */

/**
 * @param {GraphCalendarEvent} event
 * @param {User} user
 * @returns {AppCalendarEvent}
 */
function formatCalendarEvent(event, user) {
	/** @type {boolean} */
	let systemEvent = false;
	/** @type {string} */
	let caseReference;
	/** @type {string} */
	let eventType;
	if (Array.isArray(event.singleValueExtendedProperties)) {
		const ext = event.singleValueExtendedProperties.find((e) => e.id === EXTENSION_ID);
		if (ext) {
			systemEvent = true;
			try {
				const extValues = JSON.parse(ext.value);
				if (typeof extValues.caseReference === 'string') caseReference = extValues.caseReference;
				if (typeof extValues.eventType === 'string') eventType = extValues.eventType;
			} catch {
				// ignore JSON parsing errors
			}
		}
	}
	return {
		id: event.id,
		userEmail: user.email,
		title: event.sensitivity === 'private' ? 'Private Event' : event.subject,
		startDate: event.start?.dateTime || 'N/A',
		endDate: event.end?.dateTime || 'N/A',
		isAllDay: !!event.isAllDay,
		isOutOfOffice: (event.showAs || '').toLowerCase() === 'oof',
		status: event.showAs,
		sensitivity: event.sensitivity,
		systemEvent,
		caseReference,
		eventType
	};
}
