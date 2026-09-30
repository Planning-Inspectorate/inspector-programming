import { addSessionData, clearSessionData, readSessionData } from '@planning-inspectorate/core/util';
import { getInspectorList } from '../../inspector/inspector.js';
import { getProgrammerList, getAssignmentPersonByEntraUserId } from '../../programmer/programmer.js';
import { assignmentsViewModel } from './view-model.js';

const SESSION_FIELD = 'assignments';

/**
 * GET /assignments
 * Renders the inspector to programmer assignment page - showing the list of inspectors,
 * the list of programmers sourced from Entra ID, and the current assignment grid.
 *
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildViewAssignments(service) {
	return async (req, res) => {
		const [inspectors, programmers, assignments] = await Promise.all([
			getInspectorList(service, req.session),
			getProgrammerList(service, req.session),
			service.assignmentClient.getAllAssignments()
		]);

		const formData = readSessionData(req, 'form', 'data', {}, SESSION_FIELD);
		const errors = readSessionData(req, 'form', 'errors', {}, SESSION_FIELD);
		const successMessage = readSessionData(req, 'success', 'message', undefined, SESSION_FIELD);

		clearSessionData(req, 'form', ['data', 'errors'], SESSION_FIELD);
		clearSessionData(req, 'success', ['message'], SESSION_FIELD);

		const viewModel = assignmentsViewModel(inspectors, programmers, assignments, formData, errors, successMessage);

		return res.render('views/assignments/view.njk', viewModel);
	};
}

/**
 * POST /assignments/assign
 * Creates a new assignment, or changes/reassigns an existing one, between an inspector and a programmer.
 *
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildPostAssignAssignment(service) {
	return async (req, res) => {
		const inspectorId = typeof req.body?.inspectorId === 'string' ? req.body.inspectorId.trim() : '';
		const programmerId = typeof req.body?.programmerId === 'string' ? req.body.programmerId.trim() : '';

		/** @type {import('./types.js').AssignmentFormErrors} */
		const errors = {};
		if (!inspectorId) {
			errors.inspectorId = { text: 'Select an inspector' };
		}
		if (!programmerId) {
			errors.programmerId = { text: 'Select a programmer' };
		}

		if (Object.keys(errors).length > 0) {
			saveFormState(req, { inspectorId, programmerId }, errors);
			return res.redirect('/assignments');
		}

		const [inspector, programmer] = await Promise.all([
			getAssignmentPersonByEntraUserId(service, req.session, inspectorId),
			getAssignmentPersonByEntraUserId(service, req.session, programmerId)
		]);

		if (!inspector) {
			saveFormState(req, { inspectorId, programmerId }, { inspectorId: { text: 'Select a valid inspector' } });
			return res.redirect('/assignments');
		}

		if (!programmer) {
			saveFormState(req, { inspectorId, programmerId }, { programmerId: { text: 'Select a valid programmer' } });
			return res.redirect('/assignments');
		}

		try {
			await service.assignmentClient.upsertAssignment({
				inspectorId,
				programmerId
			});

			service.logger.info(
				{ inspectorId, programmerId, user: req.session?.account?.name || 'unknown' },
				'Inspector assigned to programmer'
			);

			saveSuccessMessage(req, `${inspector.name} has been assigned to ${programmer.name}`);
		} catch (err) {
			service.logger.error({ err, inspectorId, programmerId }, 'Failed to assign inspector to programmer');

			saveFormState(
				req,
				{ inspectorId, programmerId },
				{
					inspectorId: { text: 'Something went wrong, please try again' }
				}
			);
		}

		return res.redirect('/assignments');
	};
}

/**
 * POST /assignments/remove
 * Removes an existing assignment for the given inspector.
 *
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function buildPostRemoveAssignment(service) {
	return async (req, res) => {
		const inspectorId = typeof req.body?.inspectorId === 'string' ? req.body.inspectorId.trim() : '';

		if (!inspectorId) {
			saveFormState(req, {}, { inspectorId: { text: 'Select an inspector to remove the assignment for' } });
			return res.redirect('/assignments');
		}

		try {
			const removed = await service.assignmentClient.removeAssignment(inspectorId);
			if (removed) {
				service.logger.info(
					{ inspectorId, user: req.session?.account?.name || 'unknown' },
					'Removed inspector to programmer assignment'
				);
				saveSuccessMessage(req, 'The assignment has been removed');
			}
		} catch (err) {
			service.logger.error({ err, inspectorId }, 'Failed to remove inspector to programmer assignment');
			saveFormState(req, {}, { inspectorId: { text: 'Something went wrong, please try again' } });
		}

		return res.redirect('/assignments');
	};
}

/**
 * @param {import('express').Request} req
 * @param {Record<string, string>} data
 * @param {import('./types.js').AssignmentFormErrors} errors
 */
function saveFormState(req, data, errors) {
	addSessionData(req, 'form', { data, errors }, SESSION_FIELD);
}

/**
 * @param {import('express').Request} req
 * @param {string} message
 */
function saveSuccessMessage(req, message) {
	addSessionData(req, 'success', { message }, SESSION_FIELD);
}
