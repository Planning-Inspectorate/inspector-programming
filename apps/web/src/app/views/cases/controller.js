import { addSessionData } from '@pins/inspector-programming-lib/util/session.js';
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

		const errors = {
			selectInspectorError: req.body.inspectorId ? false : true,
			selectCasesError: selectedCases.length == 0 ? true : false,
			selectAssignmentDateError: req.body.assignmentDate ? false : true
		};

		if (errors.selectInspectorError || errors.selectCasesError || errors.selectAssignmentDateError) {
			const updateCasesResult = {
				selectedCases: selectedCases,
				inspectorId: req.body.inspectorId,
				assignmentDate: req.body.assignmentDate
			};

			addSessionData(req, 'caseListData', updateCasesResult, 'persistence');
			addSessionData(req, 'errors', errors, 'persistence');
		} else {
			const selectedCaseIds = await getCaseAndLinkedCasesIds(selectedCases, service);
			const failedCases = await assignCasesToInspector(req.session, service, req.body.inspectorId, selectedCaseIds);

			if (failedCases.length > 0)
				return handleFailure(
					req,
					res,
					failedCases,
					selectedCaseIds,
					'Try again later. The requested cases were not assigned.'
				);

			try {
				const eventsToAdd = await generateCaseCalendarEvents(service, req.body.assignmentDate, selectedCaseIds);
				service.logger.info('Calendar events created: ' + eventsToAdd.length); //placeholder
			} catch (/** @type {any} */ err) {
				service.logger.error(err, `Failed to generate case calendar events for inspector ${req.body.inspectorId}`);
				return handleFailure(
					req,
					res,
					selectedCases,
					selectedCases,
					'An error occurred when generating case calendar events. Please try again later.'
				);
			}

			const success = {
				successSummary: {
					heading: 'Cases have been assigned',
					body: 'Cases have been removed from the unassigned case list'
				}
			};

			addSessionData(req, 'success', success, 'persistence');
		}

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
 * @param {string} errorMessage
 * @returns
 */
function handleFailure(req, res, failedCases, selectedCaseIds, errorMessage) {
	const updateCasesResult = {
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
	} else {
		viewData = {
			bodyCopy: errorMessage
		};
	}

	return res.render('views/errors/500.njk', viewData);
}
