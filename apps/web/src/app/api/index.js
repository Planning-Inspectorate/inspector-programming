import { Router as createRouter } from 'express';
import { buildApiHealth } from './endpoints/health/controller.js';
import { buildAssertIsAuthenticated } from './auth/guards.js';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';
import { ApiAuthService } from './auth/api-auth-service.js';
import { buildMockApiControllers } from './endpoints/mock/controller.js';
import { createRoutes as createUsersRoutes } from './endpoints/users/controller.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter({ mergeParams: true });

	if (!service.authDisabled) {
		const authService = new ApiAuthService({
			config: service.authConfig
		});
		router.use(buildAssertIsAuthenticated(service.logger, authService));
	}

	router.get('/health', asyncHandler(buildApiHealth(service)));

	// todo: /events
	if (service.mockApiData) {
		const { inspectors, events } = buildMockApiControllers(service);
		router.get('/users', asyncHandler(inspectors));
		router.get('/events', asyncHandler(events));
	} else {
		const usersRoutes = createUsersRoutes(service);
		router.use('/users', usersRoutes);
	}

	return router;
}
