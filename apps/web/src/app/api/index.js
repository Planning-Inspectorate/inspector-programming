import { Router as createRouter } from 'express';
import { buildApiHealth } from './endpoints/health/controller.js';
import { buildAssertIsAuthenticated } from './auth/guards.js';
import { AuthService } from '../auth/auth-service.js';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter({ mergeParams: true });

	if (!service.authDisabled) {
		const authService = new AuthService({
			config: service.authConfig,
			logger: service.logger
		});
		router.use(buildAssertIsAuthenticated(service.logger, authService));
	}

	router.get('/health', asyncHandler(buildApiHealth(service)));

	// todo: /events
	// todo: /users

	return router;
}
