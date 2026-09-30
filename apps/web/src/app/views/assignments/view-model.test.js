import { describe, test } from 'node:test';
import assert from 'assert';
import { toInspectorOption, toAssignmentRow, toAssignmentRows, assignmentsViewModel } from './view-model.js';

describe('view-model', () => {
	describe('toInspectorOption', () => {
		test('should map an inspector to an option', () => {
			const inspector = {
				id: 'insp-1',
				firstName: 'Michael',
				lastName: 'Chalk',
				emailAddress: 'michael.chalk@example.com'
			};
			assert.deepEqual(toInspectorOption(inspector), {
				id: 'insp-1',
				name: 'Michael Chalk',
				email: 'michael.chalk@example.com'
			});
		});

		test('should default a missing email to null', () => {
			const inspector = { id: 'insp-1', firstName: 'Michael', lastName: 'Chalk', emailAddress: '' };
			assert.equal(toInspectorOption(inspector).email, null);
		});
	});

	describe('toAssignmentRow', () => {
		test('should build a row with no assignment', () => {
			const inspector = {
				id: 'insp-1',
				firstName: 'Michael',
				lastName: 'Chalk',
				emailAddress: 'michael.chalk@example.com'
			};
			const row = toAssignmentRow(inspector, undefined, []);
			assert.deepEqual(row, {
				inspectorId: 'insp-1',
				inspectorName: 'Michael Chalk',
				inspectorEmail: 'michael.chalk@example.com',
				programmerId: null,
				programmerName: null,
				programmerEmail: null,
				lastUpdated: null
			});
		});

		test('should build a row with an assignment', () => {
			const inspector = {
				id: 'insp-1',
				firstName: 'Michael',
				lastName: 'Chalk',
				emailAddress: 'michael.chalk@example.com'
			};
			const assignment = {
				programmerId: 'prog-1',
				updatedAt: new Date('2026-01-15T10:30:00.000Z')
			};
			const programmers = [{ id: 'prog-1', name: 'Paul Howell', email: 'paul.howell@example.com' }];
			const row = toAssignmentRow(inspector, assignment, programmers);
			assert.equal(row.programmerId, 'prog-1');
			assert.equal(row.programmerName, 'Paul Howell');
			assert.equal(row.programmerEmail, 'paul.howell@example.com');
			assert.ok(row.lastUpdated);
		});

		test('should handle an assigned programmer missing from Entra', () => {
			const inspector = {
				id: 'insp-1',
				firstName: 'Michael',
				lastName: 'Chalk',
				emailAddress: 'michael.chalk@example.com'
			};
			const row = toAssignmentRow(inspector, { programmerId: 'prog-1' }, []);

			assert.equal(row.programmerId, 'prog-1');
			assert.equal(row.programmerName, undefined);
			assert.equal(row.programmerEmail, null);
		});
	});

	describe('toAssignmentRows', () => {
		test('should combine inspectors and assignments, sorted by inspector name', () => {
			const inspectors = [
				{ id: 'insp-2', firstName: 'Lucy', lastName: 'Wootton', emailAddress: 'lucy.wootton@example.com' },
				{ id: 'insp-1', firstName: 'Dave', lastName: 'Flower', emailAddress: 'dave.flower@example.com' }
			];
			const assignments = [
				{
					inspectorId: 'insp-2',
					programmerId: 'prog-1',
					updatedAt: new Date()
				}
			];

			const rows = toAssignmentRows(inspectors, assignments, [
				{ id: 'prog-1', name: 'Paul Howell', email: 'paul.howell@example.com' }
			]);
			assert.equal(rows.length, 2);
			assert.equal(rows[0].inspectorName, 'Dave Flower');
			assert.equal(rows[0].programmerId, null);
			assert.equal(rows[1].inspectorName, 'Lucy Wootton');
			assert.equal(rows[1].programmerId, 'prog-1');
		});

		test('should support one programmer assigned to multiple inspectors', () => {
			const inspectors = [
				{ id: 'insp-1', firstName: 'Dave', lastName: 'Flower', emailAddress: '' },
				{ id: 'insp-2', firstName: 'Lucy', lastName: 'Wootton', emailAddress: '' }
			];
			const assignments = [
				{ inspectorId: 'insp-1', programmerId: 'prog-1' },
				{ inspectorId: 'insp-2', programmerId: 'prog-1' }
			];

			const rows = toAssignmentRows(inspectors, assignments, []);

			assert.deepEqual(
				rows.map(({ inspectorId, programmerId }) => ({ inspectorId, programmerId })),
				[
					{ inspectorId: 'insp-1', programmerId: 'prog-1' },
					{ inspectorId: 'insp-2', programmerId: 'prog-1' }
				]
			);
		});
	});

	describe('assignmentsViewModel', () => {
		test('should build the full view model', () => {
			const inspectors = [
				{ id: 'insp-1', firstName: 'Michael', lastName: 'Chalk', emailAddress: 'michael@example.com' }
			];
			const programmers = [{ id: 'prog-1', name: 'Paul Howell', email: 'paul@example.com' }];
			const assignments = [
				{
					inspectorId: 'insp-1',
					programmerId: 'prog-1',
					updatedAt: new Date()
				}
			];
			const formData = { inspectorId: 'insp-1', programmerId: 'prog-1' };
			const errors = {};

			const viewModel = assignmentsViewModel(inspectors, programmers, assignments, formData, errors, 'Assigned!');

			assert.equal(viewModel.pageHeading, 'Assign inspectors to programmers');
			assert.equal(viewModel.isAssignmentsPage, true);
			assert.deepEqual(viewModel.inspectorOptions, [
				{ id: 'insp-1', name: 'Michael Chalk', email: 'michael@example.com' }
			]);
			assert.deepEqual(viewModel.programmerOptions, programmers);
			assert.equal(viewModel.assignments.length, 1);
			assert.deepEqual(viewModel.assignedInspectorIds, ['insp-1']);
			assert.deepEqual(viewModel.form, { inspectorId: 'insp-1', programmerId: 'prog-1' });
			assert.equal(viewModel.successMessage, 'Assigned!');
			assert.deepEqual(viewModel.errorSummary, []);
		});

		test('should build an error summary from errors', () => {
			const errors = { inspectorId: { text: 'Select an inspector' } };
			const viewModel = assignmentsViewModel([], [], [], {}, errors);

			assert.deepEqual(viewModel.errorSummary, [{ text: 'Select an inspector', href: '#inspectorId' }]);
		});
	});
});
