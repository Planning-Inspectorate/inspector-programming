import { Router as createRouter } from 'express';
import { buildApiHealth } from './endpoints/health/controller.js';
import { buildAssertIsAuthenticated } from './auth/guards.js';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';
import { ApiAuthService } from './auth/api-auth-service.js';

import { createRoutes as createUsersRoutes } from './endpoints/users/controller.js';
import { createRoutes as createEventsRoutes } from './endpoints/events/controller.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter({ mergeParams: true });
	const usersRoutes = createUsersRoutes(service);
	const eventsRoutes = createEventsRoutes(service);

	if (!service.authDisabled) {
		const authService = new ApiAuthService({
			config: service.authConfig
		});
		router.use(buildAssertIsAuthenticated(service.logger, authService));
	}

	router.get('/health', asyncHandler(buildApiHealth(service)));

	router.use('/users', usersRoutes);
	router.use('/events', eventsRoutes);

	return router;
}
