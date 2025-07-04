import { buildRouter } from './router.js';
import { configureNunjucks } from './nunjucks.js';
import { addLocalsConfiguration } from '#util/config-middleware.js';
import { createBaseApp } from '@pins/service-name-lib/app/app.js';

/**
 * @param {import('#service').App1Service} service
 * @returns {Express}
 */
export function createApp(service) {
	const router = buildRouter(service);
	// create an express app, and configure it for our usage
	return createBaseApp({ service, configureNunjucks, router, middlewares: [addLocalsConfiguration()] });
}
