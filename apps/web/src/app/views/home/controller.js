import { getInspectorList } from '../../inspector/inspector.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildViewHome(service) {
	return async (req, res) => {
		const inspectors = await getInspectorList(service, req.session);
		const selectedInspector = inspectors.find((i) => req.query.inspectorId === i.id);
		const filters = req.query.filters;
		const page = req.query.page ? parseInt(req.query.page) : 1;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
		const cases = await service.getCbosApiClientForSession(req.session).getCases();
		const sortedCases = cases.sort((a, b) => b.caseAge - a.caseAge);
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
			cases: sortedCases.map(caseViewModel),
			inspectors,
			data: formData,
			apiKey: service.osMapsApiKey,
			inspectorPin: {
				...selectedInspector
			},
			calendarData
		});
	};
}

export function caseViewModel(c) {
	return {
		...c,
		finalCommentsDate: c.finalCommentsDate.toLocaleDateString(),
		color:
			c.caseAge > 45
				? 'fa72a8'
				: c.caseAge > 39
					? 'dea529'
					: c.caseAge > 28
						? 'd0b300'
						: c.caseAge > 24
							? 'd0b300'
							: '89a63a'
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
