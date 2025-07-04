/**
 * @param {import('#service').App1Service} service
 * @returns {import('express').Handler}
 */
export function buildHomePage(service) {
	const { db, logger } = service;
	return async (req, res) => {
		let connected = false;
		try {
			// Check if the database is connected
			await db.$queryRaw`SELECT 1`;
			connected = true;
		} catch (error) {
			logger.error('Database connection failed', error);
		}

		req.session.visits = (req.session.visits || 0) + 1;

		const viewModel = {
			connected,
			visitCount: req.session.visits
		};

		logger.info({ viewModel }, 'home page');
		return res.render('views/home/view.njk', {
			pageTitle: 'This is the home page',
			...viewModel
		});
	};
}
