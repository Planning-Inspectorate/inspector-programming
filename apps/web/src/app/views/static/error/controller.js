/**
 * @param {import('#service').App2Service} service
 * @returns {import('express').Handler}
 */
export function firewallErrorPage(service) {
	return async (req, res) => {
		service.logger.warn('Firewall error page requested');
		return res.render('views/static/error/firewall-error.njk', {
			pageTitle: 'Firewall Error'
		});
	};
}
