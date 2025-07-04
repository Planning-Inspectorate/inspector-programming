import { Router as createRouter } from 'express';
import { buildHomePage } from './controller.js';
import { asyncHandler } from '@pins/service-name-lib/util/async-handler.js';

/**
 * @param {import('#service').App1Service} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter({ mergeParams: true });

	const homePageController = buildHomePage(service);
	router.get('/', asyncHandler(homePageController));

	return router;
}
