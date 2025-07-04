import helmet from 'helmet';
import crypto from 'node:crypto';

/**
 * @param {import('helmet').ContentSecurityPolicyOptions['directives']} directives
 * @returns {import('express').Handler[]}
 */
export function initContentSecurityPolicyMiddlewares(directives) {
	/** @type {import('express').Handler[]} */
	const middlewares = [];

	// Generate the nonce for each request
	middlewares.push((req, res, next) => {
		res.locals.cspNonce = crypto.randomBytes(32).toString('hex');
		next();
	});

	// Secure apps by setting various HTTP headers
	middlewares.push(helmet());

	middlewares.push(
		helmet.contentSecurityPolicy({
			directives
		})
	);

	return middlewares;
}
