import { getInspectorList } from '../../inspector/inspector.js';
import qs from 'qs';
import { parse as parseUrl } from 'url';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildViewHome(service) {
	return async (req, res) => {
		const inspectors = await getInspectorList(service, req.session);
		const selectedInspector = inspectors.find((i) => req.query.inspectorId === i.id);
		const errors = {};

		// Convert the raw query string into a nested object
		const query = qs.parse(parseUrl(req.url).query || '');
		const { filters } = query;

		if (filters) {
			if (filters.minimumAge && (isNaN(filters.minimumAge) || filters.minimumAge < 0 || filters.minimumAge > 500)) {
				errors.minimumAge = 'Please enter a number between 0 and 500';
			}
		}

		const page = req.query.page ? parseInt(req.query.page) : 1;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
		const cases = await service.getCbosApiClientForSession(req.session).getCases();
		const sortedCases = cases.sort((a, b) => b.caseAge - a.caseAge);
		const start = (page - 1) * limit;
		const paginatedCases = sortedCases.slice(start, start + limit);
		const formData = {
			filters,
			limit,
			page,
			sort: req.query.sort || 'age',
			inspectorId: req.query.inspectorId
		};
		const calendarData = {};

		calendarData.error =
			"Can't view this calendar. Please contact the inspector to ensure their calendar is shared with you.";

		return res.render('views/home/view.njk', {
			pageHeading: 'Inspector Programming',
			containerClasses: 'pins-container-wide',
			title: 'Unassigned case list',
			cases: paginatedCases.map(caseViewModel),
			inspectors,
			data: formData,
			apiKey: service.osMapsApiKey,
			inspectorPin: {
				...selectedInspector
			},
			calendarData,
			errors
		});
	};
}

export function caseViewModel(c) {
	return {
		...c,
		finalCommentsDate: c.finalCommentsDate.toLocaleDateString(),
		color:
			c.caseAge > 45
				? 'd4351c' // red (46+ weeks)
				: c.caseAge > 25
					? 'f47738' // orange (26-45 weeks)
					: '_00703c', // green (0-25 weeks)
		currentDate: new Date().toLocaleDateString()
	};
}

export function buildPostHome(service) {
	return async (req, res) => {
		service.logger.info('post home');

		const redirectUrl =
			req.body.action === 'view' ? `/inspector/${req.body.inspectorId}` : `/?inspectorId=${req.body.inspectorId}`;

		return res.redirect(redirectUrl);
	};
}
