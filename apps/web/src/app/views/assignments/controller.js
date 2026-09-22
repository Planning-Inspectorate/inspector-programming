import { addSessionData, clearSessionData, readSessionData } from '@planning-inspectorate/core/util';
import { getProgrammerList } from '../../programmer/programmer.js';
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
			service.inspectorClient.getAllInspectors(),
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
			addSessionData(req, 'form', { data: { inspectorId, programmerId }, errors }, SESSION_FIELD);
			return res.redirect('/assignments');
		}

		const [inspector, programmers] = await Promise.all([
			service.inspectorClient.getAllInspectors().then((list) => list.find((i) => i.id === inspectorId)),
			getProgrammerList(service, req.session)
		]);
		const programmer = programmers.find((p) => p.id === programmerId);

		if (!inspector) {
			addSessionData(
				req,
				'form',
				{ data: { inspectorId, programmerId }, errors: { inspectorId: { text: 'Select a valid inspector' } } },
				SESSION_FIELD
			);
			return res.redirect('/assignments');
		}

		if (!programmer) {
			addSessionData(
				req,
				'form',
				{ data: { inspectorId, programmerId }, errors: { programmerId: { text: 'Select a valid programmer' } } },
				SESSION_FIELD
			);
			return res.redirect('/assignments');
		}

		try {
			await service.assignmentClient.upsertAssignment({
				inspectorId,
				programmerId,
				programmerName: `${programmer.firstName} ${programmer.lastName}`.trim(),
				programmerEmail: programmer.emailAddress || null
			});

			service.logger.info(
				{ inspectorId, programmerId, user: req.session?.account?.name || 'unknown' },
				'Inspector assigned to programmer'
			);

			addSessionData(
				req,
				'success',
				{
					message: `${inspector.firstName} ${inspector.lastName} has been assigned to ${programmer.firstName} ${programmer.lastName}`
				},
				SESSION_FIELD
			);
		} catch (err) {
			service.logger.error({ err, inspectorId, programmerId }, 'Failed to assign inspector to programmer');
			addSessionData(
				req,
				'form',
				{
					data: { inspectorId, programmerId },
					errors: { inspectorId: { text: 'Something went wrong, please try again' } }
				},
				SESSION_FIELD
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
			addSessionData(
				req,
				'form',
				{ data: {}, errors: { inspectorId: { text: 'Select an inspector to remove the assignment for' } } },
				SESSION_FIELD
			);
			return res.redirect('/assignments');
		}

		try {
			const removed = await service.assignmentClient.removeAssignment(inspectorId);
			if (removed) {
				service.logger.info(
					{ inspectorId, user: req.session?.account?.name || 'unknown' },
					'Removed inspector to programmer assignment'
				);
				addSessionData(req, 'success', { message: 'The assignment has been removed' }, SESSION_FIELD);
			}
		} catch (err) {
			service.logger.error({ err, inspectorId }, 'Failed to remove inspector to programmer assignment');
			addSessionData(
				req,
				'form',
				{ data: {}, errors: { inspectorId: { text: 'Something went wrong, please try again' } } },
				SESSION_FIELD
			);
		}

		return res.redirect('/assignments');
	};
}
