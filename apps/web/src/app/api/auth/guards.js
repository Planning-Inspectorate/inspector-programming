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
			const url = await authService.getAuthCodeUrl({});
			res.set('WWW-Authenticate', 'Bearer authorization_uri=' + url);
			res.status(401).send({ status: 401, message: 'Unauthorized' });
			return;
		}

		next();
	};
}
