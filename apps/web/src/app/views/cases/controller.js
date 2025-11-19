import { addSessionData } from '@pins/inspector-programming-lib/util/session.js';
import { assignCasesToInspector, getCaseAndLinkedCasesIds } from '../../case/case.js';
import { generateCaseCalendarEvents, submitCalendarEvents } from '../../calendar/calendar.js';
import { validateAssignmentDate } from './assignment-date-validation.js';
import { notifyInspectorOfAssignedCases } from '../../inspector/inspector.js';

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
	const {
		failedCaseIds,
		alreadyAssignedCaseReferences: alreadyAssignedCases,
		successfullyAssignedCaseReferences: successfullyAssignedCases
	} = await assignCasesToInspector(req.session, service, req.body.inspectorId, selectedCaseIds);

	// Handle successfully assigned cases first
	let successfulCaseIds = [];
	if (successfullyAssignedCases.length > 0) {
		try {
			// Get case IDs for successfully assigned cases
			successfulCaseIds = cases
				.filter((caseItem) => successfullyAssignedCases.includes(caseItem.caseReference))
				.map((caseItem) => caseItem.caseId);

			// Generate calendar events for successful assignments
			const eventsToAdd = await generateCaseCalendarEvents(service, req.body.assignmentDate, successfulCaseIds);
			service.logger.info(
				`Calendar events created: ${eventsToAdd.length} for ${successfullyAssignedCases.length} successfully assigned cases`
			);

			// Submit calendar events
			await submitCalendarEvents(service.entraClient, eventsToAdd, req.session, req.body.inspectorId, service.logger);

			// Delete successfully assigned cases from local database
			await service.casesClient.deleteCases(successfulCaseIds);

			service.logger.info('Successfully processed assigned cases', {
				caseIds: successfulCaseIds,
				caseReferences: successfullyAssignedCases,
				inspectorId: req.body.inspectorId
			});

			// Send notification emails to inspector for successful assignments
			try {
				await notifyInspectorOfAssignedCases(service, req.body.inspectorId, req.body.assignmentDate, successfulCaseIds);
			} catch (err) {
				service.logger.warn(
					err,
					`Failed to send email notification to inspector ${req.body.inspectorId} after case assignment`
				);
			}
		} catch (err) {
			service.logger.error(err, `Failed to process successfully assigned cases for inspector ${req.body.inspectorId}`);
			// If we fail to process successful assignments, treat them as failed
			const failedSuccessfulCases = cases.filter((caseItem) =>
				successfullyAssignedCases.includes(caseItem.caseReference)
			);
			return handleFailure(
				req,
				res,
				failedSuccessfulCases,
				'An error occurred when processing successfully assigned cases. Please try again later.'
			);
		}
	}

	// Handle already assigned cases (sync with CBOS)
	if (alreadyAssignedCases.length > 0) {
		// Log duplicate assignment attempt for audit trail
		service.logger.error('Duplicate assignment attempt detected', {
			user: req.session?.account?.name || 'unknown',
			duplicateCases: alreadyAssignedCases,
			successfullyAssigned: successfullyAssignedCases.length,
			inspectorId: req.body.inspectorId,
			assignmentDate: req.body.assignmentDate,
			timestamp: new Date().toISOString(),
			totalAttempted: selectedCases.length,
			totalDuplicates: alreadyAssignedCases.length
		});

		// Remove already assigned cases from local database to sync with CBOSS
		try {
			const alreadyAssignedCaseIds = cases
				.filter((caseItem) => alreadyAssignedCases.includes(caseItem.caseReference))
				.map((caseItem) => caseItem.caseId);

			if (alreadyAssignedCaseIds.length > 0) {
				await service.casesClient.deleteCases(alreadyAssignedCaseIds);
				service.logger.info('Removed already assigned cases from local database', {
					caseIds: alreadyAssignedCaseIds,
					caseReferences: alreadyAssignedCases
				});
			}
		} catch (error) {
			service.logger.error('Failed to remove already assigned cases from local database', {
				error: error.message,
				caseReferences: alreadyAssignedCases
			});
		}

		// Clear all selected cases from session since they've all been processed
		// (either successfully assigned or identified as duplicates)
		saveSelectedData([], req);

		const bodyCopy =
			alreadyAssignedCases.length === 1
				? 'The following case has already been assigned in Manage appeals:'
				: 'The following cases have already been assigned in Manage appeals:';

		return res.render('views/errors/duplicate-assignment.njk', {
			bodyCopy,
			failedCases: alreadyAssignedCases,
			inspectorId: req.body.inspectorId,
			successfulCases: successfullyAssignedCases
		});
	}

	// Handle assignment failures
	if (failedCaseIds.length > 0) {
		const failedCases = cases.filter((caseItem) => failedCaseIds.includes(caseItem.caseId));
		// Keep selected any failed cases, then go to the failed-cases error page
		saveSelectedData(failedCaseIds, req);

		// Determine error message based on whether all or some cases failed
		const allCasesFailed = successfullyAssignedCases.length === 0 && alreadyAssignedCases.length === 0;
		const errorMessage = allCasesFailed
			? 'Try again later. None of the selected cases were assigned.'
			: 'Try again later. Some of the selected cases failed to assign.';

		return handleFailure(req, res, failedCases, errorMessage);
	}

	// All cases were successfully assigned
	if (successfullyAssignedCases.length > 0) {
		const successSummary = {
			heading: 'Cases have been assigned',
			body: 'Cases have been removed from the unassigned case list'
		};

		const success = { successSummary };
		addSessionData(req, 'success', success, 'persistence');

		// Clear selected cases since all were successfully processed
		saveSelectedData([], req);
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
 * @param {string} errorMessage
 * @returns
 */
function handleFailure(req, res, failedCases, errorMessage) {
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
