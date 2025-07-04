import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/service-name-lib/util/async-handler.js';
import { buildListItems } from './list/controller.js';

/**
 * @param {import('#service').App2Service} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter({ mergeParams: true });
	const listItems = buildListItems(service);

	router.get('/', asyncHandler(listItems));

	return router;
}
