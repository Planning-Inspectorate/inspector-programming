import { addSessionData, readSessionData } from '@pins/inspector-programming-lib/util/session.js';
import { assignCasesToInspector, getCaseAndLinkedCasesIds } from '../../case/case.js';
import { generateCaseCalendarEvents, submitCalendarEvents } from '../../calendar/calendar.js';
import { validateAssignmentDate } from './assignment-date-validation.js';
import { notifyInspectorOfAssignedCases, notifyProgrammeOfficerOfAssignedCases } from '../../inspector/inspector.js';

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
	const casesByReference = new Map(cases.map((c) => [c.caseReference, c]));
	const casesById = new Map(cases.map((c) => [c.caseId, c]));
	let emailNotificationSent = false;
	let poEmailSent = false;
	const {
		failedCaseIds,
		alreadyAssignedCaseReferences: alreadyAssignedCases,
		successfullyAssignedCaseReferences: successfullyAssignedCases
	} = await assignCasesToInspector(req.session, service, req.body.inspectorId, selectedCaseIds);

	// Get case IDs for successfully assigned cases
	const successfulCaseIds = successfullyAssignedCases.map((ref) => casesByReference.get(ref)?.caseId).filter(Boolean);

	if (successfulCaseIds.length > 0) {
		try {
			// Generate calendar events for successful assignments
			const eventsToAdd = await generateCaseCalendarEvents(service, req.body.assignmentDate, successfulCaseIds);
			service.logger.info(
				{
					eventsCount: eventsToAdd.length,
					casesCount: successfullyAssignedCases.length
				},
				'Calendar events created for successfully assigned cases'
			);

			// Submit calendar events
			await submitCalendarEvents(service.entraClient, eventsToAdd, req.session, req.body.inspectorId, service.logger);

			// Delete successfully assigned cases from local database
			try {
				await service.casesClient.deleteCases(successfulCaseIds);
				service.logger.info(
					{
						caseIds: successfulCaseIds,
						caseReferences: successfullyAssignedCases
					},
					'Removed successfully assigned cases from local database'
				);
			} catch (error) {
				service.logger.error(
					{
						error: error.message,
						caseReferences: successfullyAssignedCases
					},
					'Failed to remove successfully assigned cases from local database'
				);
			}

			// Send notification emails to inspector for successful assignments
			try {
				await notifyInspectorOfAssignedCases(service, req.body.inspectorId, req.body.assignmentDate, successfulCaseIds);
				emailNotificationSent = true;
				service.logger.info(
					{
						inspectorId: req.body.inspectorId,
						caseCount: successfulCaseIds.length
					},
					'Email notification sent successfully to inspector'
				);
			} catch (err) {
				service.logger.warn(
					{
						err,
						inspectorId: req.body.inspectorId
					},
					'Failed to send email notification to inspector after case assignment'
				);
			}

			// Send notification email to programme officer for successful assignments
			try {
				await notifyProgrammeOfficerOfAssignedCases(
					service,
					req.session?.account,
					req.body.inspectorId,
					req.body.assignmentDate,
					successfullyAssignedCases
				);
				poEmailSent = true;
				service.logger.info(
					{
						programmeOfficerEmail: req.session?.account?.username,
						caseCount: successfullyAssignedCases.length
					},
					'Email notification sent successfully to programme officer'
				);
			} catch (err) {
				service.logger.warn(
					{
						err,
						programmeOfficerEmail: req.session?.account?.username
					},
					'Failed to send email notification to programme officer after case assignment'
				);
			}
		} catch (err) {
			service.logger.error(
				{
					err,
					inspectorId: req.body.inspectorId
				},
				'Failed to process successfully assigned cases for inspector'
			);
			// If we fail to process successful assignments, treat them as failed
			const failedSuccessfulCases = successfullyAssignedCases.map((ref) => casesByReference.get(ref)).filter(Boolean);
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
		service.logger.error(
			{
				user: req.session?.account?.name || 'unknown',
				alreadyAssignedCases: alreadyAssignedCases,
				successfullyAssigned: successfullyAssignedCases.length,
				inspectorId: req.body.inspectorId,
				assignmentDate: req.body.assignmentDate,
				totalAttempted: selectedCases.length,
				alreadyAssignedCasesCount: alreadyAssignedCases.length
			},
			'Duplicate assignment attempt detected'
		);

		// Remove already assigned cases from local database to sync with CBOSS
		try {
			const alreadyAssignedCaseIds = alreadyAssignedCases
				.map((ref) => casesByReference.get(ref)?.caseId)
				.filter(Boolean);

			if (alreadyAssignedCaseIds.length > 0) {
				await service.casesClient.deleteCases(alreadyAssignedCaseIds);
				service.logger.info(
					{
						caseIds: alreadyAssignedCaseIds,
						caseReferences: alreadyAssignedCases
					},
					'Removed already assigned cases from local database'
				);
			}
		} catch (error) {
			service.logger.error(
				{
					error: error.message,
					caseReferences: alreadyAssignedCases
				},
				'Failed to remove already assigned cases from local database'
			);
		}

		// Keep only unprocessed cases selected (preserve state for retry)
		// Remove both successfully assigned and duplicate cases from selection
		const processedCaseReferences = [...successfullyAssignedCases, ...alreadyAssignedCases];
		const unprocessedCaseIds = selectedCases.filter((caseId) => {
			const caseItem = casesById.get(caseId);
			return caseItem && !processedCaseReferences.includes(caseItem.caseReference);
		});

		// Preserve unprocessed cases, inspector, and assignment date for retry
		saveSelectedData(unprocessedCaseIds, req);

		const bodyCopy =
			alreadyAssignedCases.length === 1
				? 'The following case has already been assigned in Manage appeals:'
				: 'The following cases have already been assigned in Manage appeals:';

		return res.render('views/errors/duplicate-assignment.njk', {
			bodyCopy,
			failedCases: alreadyAssignedCases,
			inspectorId: req.body.inspectorId,
			successfulCases: successfullyAssignedCases,
			emailNotificationSent: emailNotificationSent
		});
	}

	// Handle assignment failures
	if (failedCaseIds.length > 0) {
		const failedCases = failedCaseIds.map((id) => casesById.get(id)).filter(Boolean);
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
			body: getSuccessMessage(emailNotificationSent, poEmailSent)
		};

		const success = { successSummary };
		addSessionData(req, 'success', success, 'persistence');

		// Clear selected cases since all were successfully processed
		saveSelectedData([], req);
	}

	return redirectToHome(req, res);
}

/**
 * Returns the appropriate success message based on email notification status
 * @param {boolean} emailNotificationSent - Whether inspector email was sent successfully
 * @param {boolean} poEmailSent - Whether programme officer email was sent successfully
 * @returns {string}
 */
export function getSuccessMessage(emailNotificationSent, poEmailSent) {
	if (emailNotificationSent && poEmailSent) {
		return 'Cases have been removed from the unassigned case list and notifications have been sent.';
	}
	if (emailNotificationSent && !poEmailSent) {
		return 'Cases have been removed from the unassigned case list. The inspector has been notified by email, but the programme officer notification could not be sent.';
	}
	if (!emailNotificationSent && poEmailSent) {
		return 'Cases have been removed from the unassigned case list. The programme officer has been notified by email, but the inspector notification could not be sent.';
	}
	return 'Cases have been removed from the unassigned case list. Email notifications could not be sent.';
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
	const UNASSIGNED_CASES_MESSAGE = 'Try again later. The following cases were not assigned:';

	const lastQueryParams = readSessionData(req, 'lastRequest', 'queryParams', '', 'persistence');

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

	let viewData = {};

	if (!failedParentCaseRefs.length && failedChildCaseRefs.length) {
		viewData = {
			bodyCopy:
				'The following linked cases were not assigned and need to be assigned manually in Manage appeals with the Inspector name:',
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

	return res.render('views/errors/failed-cases.njk', { ...viewData, queryParams: lastQueryParams });
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
