/**
 * @param {import('pino').Logger} logger
 * @param {import('./auth-service.js').AuthService} authService
 * @returns {import('express').RequestHandler}
 */
export function buildAssertIsAuthenticated(logger, authService) {
	return async (req, res, next) => {
		const authHeader = req.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			logger.debug('not authorized');
			res.set('WWW-Authenticate', 'Bearer authorization_uri=' + authService.authTokenUrl);
			res.status(401).send({ status: 401, message: 'Unauthorized' });
			return;
		}

		// token does not need verifying, it is used to call the Graph API and that will verify it

		next();
	};
}
