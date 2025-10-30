import { buildLogRequestsMiddleware } from '../middleware/log-requests.js';
import { initSessionMiddleware } from '../util/session.js';
import bodyParser from 'body-parser';
import express from 'express';
import { initContentSecurityPolicyMiddlewares } from '../middleware/csp-middleware.js';
import { buildDefaultErrorHandlerMiddleware, notFoundHandler } from '../middleware/errors.js';

/**
 * @param {Object} opts
 * @param {import('./base-service.js').BaseService} opts.service
 * @param {import('express').Router} opts.router
 * @param {import('express').Handler[]} opts.middlewares
 * @param {function(): import('nunjucks').Environment} [opts.configureNunjucks]
 * @param {import('helmet').ContentSecurityPolicyOptions['directives']} [opts.cspDirectives]
 * @returns {import('express').Express}
 */
export function createBaseApp({
	service,
	router,
	middlewares,
	configureNunjucks,
	cspDirectives = cspDirectiveDefaults
}) {
	// create an express app, and configure it for our usage
	const app = express();

	const logRequests = buildLogRequestsMiddleware(service.logger);
	app.use(logRequests);

	// configure body-parser, to populate req.body
	// see https://expressjs.com/en/resources/middleware/body-parser.html
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	const sessionMiddleware = initSessionMiddleware({
		redis: service.redisClient,
		secure: service.secureSession,
		secret: service.sessionSecret
	});
	app.use(sessionMiddleware);

	app.use(...initContentSecurityPolicyMiddlewares(cspDirectives));

	// static files
	app.use(express.static(service.staticDir, service.cacheControl));

	if (configureNunjucks) {
		const nunjucksEnvironment = configureNunjucks();
		// Set the express view engine to nunjucks
		// calls to res.render will use nunjucks
		nunjucksEnvironment.addGlobal('govukRebrand', true);
		nunjucksEnvironment.express(app);
		app.set('view engine', 'njk');
	}

	app.use(...middlewares);

	// register the router, which will define any subpaths
	// any paths not defined will return 404 by default
	app.use('/', router);

	app.use(notFoundHandler);

	const defaultErrorHandler = buildDefaultErrorHandlerMiddleware(service.logger);
	// catch/handle errors last
	app.use(defaultErrorHandler);

	return app;
}

/** @type {import('helmet').ContentSecurityPolicyOptions['directives']} */
const cspDirectiveDefaults = {
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
