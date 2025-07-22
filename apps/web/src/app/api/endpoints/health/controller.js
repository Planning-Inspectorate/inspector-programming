/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildApiHealth(service) {
	const { logger, apiService } = service;
	return async (req, res) => {
		const authHeader = req.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('missing authorization');
		}

		// check Graph API access by reading some metadata
		const data = await apiService.graphClient.api('').get();

		logger.info('API health check endpoint');
		res.status(200).json({ status: 'ok', data });
	};
}
