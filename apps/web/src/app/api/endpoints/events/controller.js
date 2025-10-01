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
			const { calendarEventsDayRange, calendarEventsFromDateOffset } = service.entraConfig;
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
							calendarEventsFromDateOffset: calendarEventsFromDateOffset,
							fetchExtension: true
						});

						//format returned events for PowerBI
						//startDate and endDate are in UTC timezone
						const formattedEvents = [];
						for (const event of usersEvents || []) {
							formattedEvents.push(formatCalendarEvent(event, user));
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
	if (Array.isArray(event.extensions)) {
		const ext = event.extensions.find((e) => e.id === `Microsoft.OutlookServices.OpenTypeExtension.${EXTENSION_ID}`);
		if (ext) {
			systemEvent = !!ext;
			if (typeof ext.caseReference === 'string') caseReference = ext.caseReference;
			if (typeof ext.eventType === 'string') eventType = ext.eventType;
		}
	}
	return {
		id: event.id,
		userEmail: user.email,
		title: event.subject,
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
