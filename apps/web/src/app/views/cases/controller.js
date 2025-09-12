import { addSessionData, clearSessionData } from '@pins/inspector-programming-lib/util/session.js';
import { assignCasesToInspector, getCaseAndLinkedCasesIds } from '../../case/case.js';
import { generateCaseCalendarEvents } from '../../calendar/calendar.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildPostCases(service) {
	return async (req, res) => {
		let selectedCases = [];

		if (req.body.selectedCases) {
			selectedCases = Array.isArray(req.body.selectedCases)
				? req.body.selectedCases.map(
						/** @param {*} id */
						(id) => parseInt(id)
					)
				: [parseInt(req.body.selectedCases)];
		}

		//need a date to assign events to in the calendar
		if (!req.body.assignmentDate) return handleFailure(req, res, selectedCases, selectedCases);

		const selectedCaseIds = await getCaseAndLinkedCasesIds(selectedCases, service);
		const failedCases = await assignCasesToInspector(req.session, service, req.body.inspectorId, selectedCaseIds);

		if (failedCases.length > 0) return handleFailure(req, res, failedCases, selectedCaseIds);

		const eventsToAdd = await generateCaseCalendarEvents(service, req.body.inspectorId, selectedCaseIds);
		console.log(eventsToAdd);

		clearSessionData(req, 'caseListData', ['selectedCases', 'inspectorId', 'assignmentDate'], 'persistence');

		const redirectUrl = `/?inspectorId=${req.body.inspectorId}`;

		return res.redirect(redirectUrl);
	};
}

/**
 * handles a failure in the case assignment process
 * compiles the response to attach to the user session and renders the error view with the details of the failed cases
 * @param {*} req
 * @param {*} res
 * @param {number[]} failedCases
 * @param {number[]} selectedCaseIds
 * @returns
 */
function handleFailure(req, res, failedCases, selectedCaseIds) {
	let updateCasesResult = {};
	updateCasesResult = {
		selectedCases: failedCases,
		inspectorId: req.body.inspectorId,
		assignmentDate: req.body.assignmentDate
	};

	addSessionData(req, 'caseListData', updateCasesResult, 'persistence');

	let viewData = {};
	if (failedCases.length < selectedCaseIds.length) {
		viewData = {
			bodyCopy: 'Try again later. The following cases were not assigned.',
			failedCases: failedCases
		};
	} else if (!req.body.assignmentDate) {
		viewData = {
			bodyCopy: 'Select an event date.'
		};
	}

	return res.render('views/errors/500.njk', viewData);
}
