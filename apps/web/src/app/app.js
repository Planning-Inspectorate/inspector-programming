import { buildRouter } from './router.js';
import { configureNunjucks } from './nunjucks.js';
import { addLocalsConfiguration } from '#util/config-middleware.js';
import { createBaseApp } from '@planning-inspectorate/core/app';

/** @type {import('helmet').ContentSecurityPolicyOptions['directives']} */
const cspDirectives = {
	// Added ArcGIS static domain to allow font / resource fetches needed for clustering labels
	scriptSrc: [
		"'self'",
		"'unsafe-inline'",
		"'unsafe-eval'",
		'https://js.arcgis.com',
		'https://static.arcgis.com',
		'https://cdn.jsdelivr.net',
		'https://api.os.uk'
	],
	styleSrc: [
		"'self'",
		"'unsafe-inline'",
		'https://js.arcgis.com',
		'https://static.arcgis.com',
		'https://cdn.jsdelivr.net',
		'https://fonts.googleapis.com',
		'https://api.os.uk'
	],
	imgSrc: [
		"'self'",
		'https://js.arcgis.com',
		'https://static.arcgis.com',
		'https://cdn.jsdelivr.net',
		'https://api.os.uk',
		'data:',
		'blob:'
	],
	fontSrc: [
		"'self'",
		'https://fonts.gstatic.com',
		'https://static.arcgis.com',
		'https://cdn.jsdelivr.net',
		'https://js.arcgis.com',
		'data:'
	],
	workerSrc: ["'self'", 'blob:', 'https://js.arcgis.com', 'https://static.arcgis.com'],
	connectSrc: ["'self'", 'https://api.os.uk', 'https://js.arcgis.com', 'https://static.arcgis.com', 'blob:'],
	defaultSrc: ["'self'"]
};

/**
 * @param {import('#service').WebService} service
 * @returns {Express}
 */
export function createApp(service) {
	const router = buildRouter(service);
	// create an express app, and configure it for our usage
	return createBaseApp({
		service,
		configureNunjucks,
		router,
		middlewares: [addLocalsConfiguration(service.feedbackUrl)],
		cspDirectives
	});
}
