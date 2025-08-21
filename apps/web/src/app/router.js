import { Router as createRouter } from 'express';
import { createRoutesAndGuards as createAuthRoutesAndGuards } from './auth/router.js';
import { createMonitoringRoutes } from '@pins/inspector-programming-lib/controllers/monitoring.js';
import { createErrorRoutes } from './views/static/error/index.js';
import { cacheNoCacheMiddleware } from '@pins/inspector-programming-lib/middleware/cache.js';
import { createRoutes as createApiRoutes } from './api/index.js';
import { buildPostHome, buildViewHome } from './views/home/controller.js';
import { asyncHandler } from '@pins/inspector-programming-lib/util/async-handler.js';
import { buildViewCase } from './views/case/controller.js';
import { buildViewInspector } from './views/inspector/controller.js';
import { buildPostCases } from './views/cases/controller.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function buildRouter(service) {
	const router = createRouter();
	const monitoringRoutes = createMonitoringRoutes(service);
	const { router: authRoutes, guards: authGuards } = createAuthRoutesAndGuards(service);
	const apiRoutes = createApiRoutes(service);

	router.use('/', monitoringRoutes);

	// don't cache responses, note no-cache allows some caching, but with revalidation
	// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#no-cache
	router.use(cacheNoCacheMiddleware);

	router.get('/unauthenticated', (req, res) => res.status(401).render('views/errors/401.njk'));

	// API routes don't use the Entra auth, auth is TBC but must be implemented
	router.use('/api/v1', apiRoutes);

	if (!service.authDisabled) {
		service.logger.info('registering auth routes');
		router.use('/auth', authRoutes);

		// all subsequent routes require auth

		// check logged in
		router.use(authGuards.assertIsAuthenticated);
		// check group membership
		router.use(authGuards.assertGroupAccess);
	} else {
		service.logger.warn('auth disabled; auth routes and guards skipped');
	}

	router.use('/error', createErrorRoutes(service));

	// const entraClientMiddleware = buildEntraClientMiddleware(service);
	const viewHome = buildViewHome(service);
	const postHome = buildPostHome(service);
	const viewCase = buildViewCase(service);
	const postCases = buildPostCases(service);
	const viewInspector = buildViewInspector(); // TODO - pass service as param (currently unused)

	// selectedCases, inspectorId (req.body)
	router.get('/', asyncHandler(viewHome));
	router.post('/cases', asyncHandler(postCases));
	router.post('/', asyncHandler(postHome));
	router.get('/case/:caseId', asyncHandler(viewCase));
	router.get('/inspector/:inspectorId', asyncHandler(viewInspector));

	return router;
}
