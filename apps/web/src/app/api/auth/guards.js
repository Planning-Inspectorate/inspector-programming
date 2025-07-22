/**
 * @param {import('pino').Logger} logger
 * @param {import('./api-auth-service.js').ApiAuthService} authService
 * @returns {import('express').RequestHandler}
 */
export function buildAssertIsAuthenticated(logger, authService) {
	return async (req, res, next) => {
		const authHeader = req.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			// see https://learn.microsoft.com/en-us/power-query/connector-authentication#supported-workflow
			res.set('WWW-Authenticate', 'Bearer authorization_uri=' + authService.authTokenUrl);
			res.status(401).send({ status: 401, message: 'Unauthorized' });
			return;
		}

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix

		try {
			await authService.verifyApiToken(token);
		} catch (err) {
			logger.error({ err }, 'token verification failed');
			res.sendStatus(403);
			return;
		}
		next();
	};
}
