import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';

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
			await apiService.entraClient.listAllGroupMembers('blah'); // Placeholder for actual group ID
			res.status(200).send('WIP');
			return;
		} catch (err) {
			logger.error({ err }, `API /events error`);
			res.status(500).send('A server error occurred');
		} finally {
			logger.info('API /events endpoint');
		}
	};
}
