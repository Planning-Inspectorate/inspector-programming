import { Router as createRouter } from 'express';
import { createMonitoringRoutes } from '@pins/service-name-lib/controllers/monitoring.js';
import { createRoutes as appRoutes } from './views/home/index.js';
import { createErrorRoutes } from './views/static/error/index.js';
import { cacheNoCacheMiddleware } from '@pins/service-name-lib/middleware/cache.js';

/**
 * @param {import('#service').App1Service} service
 * @returns {import('express').Router}
 */
export function buildRouter(service) {
	const router = createRouter();

	const monitoringRoutes = createMonitoringRoutes(service);

	router.use('/', monitoringRoutes);

	// don't cache responses, note no-cache allows some caching, but with revalidation
	// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#no-cache
	router.use(cacheNoCacheMiddleware);

	router.use('/', appRoutes(service));
	router.use('/error', createErrorRoutes(service));

	return router;
}
