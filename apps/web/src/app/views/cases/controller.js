import { addSessionData } from '@pins/inspector-programming-lib/util/session.js';
import { assignCasesToInspector, getCaseAndLinkedCasesIds } from '../../case/case.js';
import { generateCaseCalendarEvents } from '../../calendar/calendar.js';
import { validateAssignmentDate } from './assignment-date-validation.js';

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

		const { error: assignmentDateError } = validateAssignmentDate(req.body.assignmentDate);
		const errors = {
			selectInspectorError: req.body.inspectorId ? false : true,
			caseListError: selectedCases.length == 0 ? 'Select case(s) to assign' : null,
			selectAssignmentDateError: assignmentDateError
		};

		if (errors.selectInspectorError || errors.caseListError || errors.selectAssignmentDateError) {
			// Save errors to be displayed on home page
			saveSelectedData(selectedCases, req);
			addSessionData(req, 'errors', errors, 'persistence');
			return redirectToHome(req, res);
		}

		return handleCases(selectedCases, service, req, res);
	};
}

/**
 * handles the assignment of cases to the selected inspector then assigns the events to calendar
 * @param {number[]} selectedCases
 * @param {import('#service').WebService} service
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function handleCases(selectedCases, service, req, res) {
	const { cases, caseIds: selectedCaseIds } = await getCaseAndLinkedCasesIds(selectedCases, service);
	const { failedCaseIds, alreadyAssignedCaseReferences: alreadyAssignedCases } = await assignCasesToInspector(
		req.session,
		service,
		req.body.inspectorId,
		selectedCaseIds
	);

	if (alreadyAssignedCases.length > 0) {
		// Save error to be displayed on home page
		let caseListError = 'Select another case. The following cases are already assigned:';
		for (let i = 0; i < alreadyAssignedCases.length; i++) {
			const appeal = alreadyAssignedCases[i];
			const errorText = i == alreadyAssignedCases.length - 1 ? ` ${appeal}` : ` ${appeal},`;
			caseListError = caseListError.concat(errorText);
		}

		addSessionData(req, 'errors', { caseListError }, 'persistence');
		saveSelectedData(selectedCases, req);
	} else if (failedCaseIds.length > 0) {
		const failedCases = cases.filter((caseItem) => failedCaseIds.includes(caseItem.caseId));
		// Keep selected any failed cases, then go to the failed-cases error page
		saveSelectedData(failedCaseIds, req);
		return handleFailure(
			req,
			res,
			failedCases,
			selectedCaseIds,
			'Try again later. None of the selected cases were assigned.'
		);
	} else {
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

	return redirectToHome(req, res);
}

/**
 * @typedef {Object} failedCase
 * @property {string | number} caseId
 * @property {string} caseReference
 * @property {boolean} isParent
 */

/**
 * handles a failure in the case assignment process where the user has no actionable fix
 * compiles the response to attach to the user session and renders the error view with the details of the failed cases
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {failedCase[] | (string|number|undefined)[]} failedCases
 * @param {number[]} selectedCaseIds
 * @param {string} errorMessage
 * @returns
 */
function handleFailure(req, res, failedCases, selectedCaseIds, errorMessage) {
	/** @type {string[]} */
	const failedParentCaseRefs = [];
	/** @type {string[]} */
	const failedChildCaseRefs = [];
	/** @type {string} */
	const UNASSIGNED_CASES_MESSAGE =
		'The following linked cases were not assigned and need to be assigned manually in Manage appeals with the Inspector name:';
	/** @type {boolean} */

	const isArrayOfCaseIds = Array.isArray(failedCases) && ['number', 'string'].includes(typeof failedCases[0]);

	if (!isArrayOfCaseIds) {
		failedParentCaseRefs.push(
			...failedCases.filter(({ isParent }) => isParent).map(({ caseReference }) => caseReference)
		);
		failedChildCaseRefs.push(
			...failedCases.filter(({ isParent }) => !isParent).map(({ caseReference }) => caseReference)
		);
	}

	/** @type {string[]} */
	const failedCaseRefs = [...failedParentCaseRefs, ...failedChildCaseRefs];

	const updateCasesResult = {
		selectedCases: isArrayOfCaseIds ? failedCases : failedCaseRefs,
		inspectorId: req.body.inspectorId,
		assignmentDate: req.body.assignmentDate
	};

	addSessionData(req, 'caseListData', updateCasesResult, 'persistence');

	let viewData = {};

	if (!failedParentCaseRefs.length && failedChildCaseRefs.length) {
		viewData = {
			bodyCopy: UNASSIGNED_CASES_MESSAGE,
			failedCases: failedChildCaseRefs
		};
	} else if (failedParentCaseRefs.length && !failedChildCaseRefs.length) {
		viewData = {
			bodyCopy: UNASSIGNED_CASES_MESSAGE,
			failedCases: failedParentCaseRefs
		};
	} else if (failedParentCaseRefs.length && failedChildCaseRefs.length) {
		viewData = {
			bodyCopy: 'Try again later. The following cases were not assigned:',
			failedCases: failedParentCaseRefs,
			linkedCasesNote:
				'The following linked cases were also not assigned. The Inspector name must be added manually to the case in Manage appeals:',
			linkedCases: failedChildCaseRefs
		};
	} else {
		viewData = {
			bodyCopy: errorMessage
		};
	}

	return res.render('views/errors/failed-cases.njk', viewData);
}

/**
 *
 * @param {(number|undefined)[]} selectedCases
 * @param {import('express').Request} req
 */
function saveSelectedData(selectedCases, req) {
	const updateCasesResult = {
		selectedCases: selectedCases,
		inspectorId: req.body.inspectorId,
		assignmentDate: req.body.assignmentDate
	};

	addSessionData(req, 'caseListData', updateCasesResult, 'persistence');
}

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns
 */
function redirectToHome(req, res) {
	const redirectUrl = `/?inspectorId=${req.body.inspectorId}`;
	return res.redirect(redirectUrl);
}
