import { describe, it, mock, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildViewAssignments, buildPostAssignAssignment, buildPostRemoveAssignment } from './controller.js';

function mockRes() {
	return {
		render: mock.fn(),
		redirect: mock.fn()
	};
}

function mockReq(overrides = {}) {
	return {
		session: { account: { name: 'Test User' } },
		body: {},
		...overrides
	};
}

describe('assignments controller', () => {
	describe('buildViewAssignments', () => {
		/** @type {*} */
		let service;

		beforeEach(() => {
			service = {
				logger: { info: mock.fn(), warn: mock.fn(), error: mock.fn() },
				entraClient: mock.fn(() => ({ listAllGroupMembers: mock.fn(() => []) })),
				entraGroupIds: { programmers: 'programmers-group-id' },
				inspectorClient: {
					getAllInspectors: mock.fn(() => [{ id: 'insp-1', firstName: 'Michael', lastName: 'Chalk', email: 'm@e.com' }])
				},
				assignmentClient: {
					getAllAssignments: mock.fn(() => [])
				}
			};
		});

		it('should render the assignments view with inspectors, programmers and assignments', async () => {
			const req = mockReq();
			const res = mockRes();

			await buildViewAssignments(service)(req, res);

			assert.equal(res.render.mock.callCount(), 1);
			const [view, viewModel] = res.render.mock.calls[0].arguments;
			assert.equal(view, 'views/assignments/view.njk');
			assert.equal(viewModel.inspectorOptions.length, 1);
			assert.equal(viewModel.isAssignmentsPage, true);
		});
	});

	describe('buildPostAssignAssignment', () => {
		/** @type {*} */
		let service;

		beforeEach(() => {
			service = {
				logger: { info: mock.fn(), warn: mock.fn(), error: mock.fn() },
				entraClient: mock.fn(() => ({
					listAllGroupMembers: mock.fn(() => [
						{ id: 'prog-1', givenName: 'Paul', surname: 'Howell', mail: 'paul.howell@example.com' }
					])
				})),
				entraGroupIds: { programmers: 'programmers-group-id' },
				inspectorClient: {
					getAllInspectors: mock.fn(async () => [
						{ id: 'insp-1', firstName: 'Michael', lastName: 'Chalk', email: 'm@e.com' }
					])
				},
				assignmentClient: {
					upsertAssignment: mock.fn(() => ({}))
				}
			};
		});

		it('should redirect with errors if inspectorId is missing', async () => {
			const req = mockReq({ body: { programmerId: 'prog-1' } });
			const res = mockRes();

			await buildPostAssignAssignment(service)(req, res);

			assert.equal(service.assignmentClient.upsertAssignment.mock.callCount(), 0);
			assert.equal(res.redirect.mock.calls[0].arguments[0], '/assignments');
		});

		it('should redirect with errors if programmerId is missing', async () => {
			const req = mockReq({ body: { inspectorId: 'insp-1' } });
			const res = mockRes();

			await buildPostAssignAssignment(service)(req, res);

			assert.equal(service.assignmentClient.upsertAssignment.mock.callCount(), 0);
		});

		it('should redirect with errors if the inspector does not exist', async () => {
			const req = mockReq({ body: { inspectorId: 'unknown', programmerId: 'prog-1' } });
			const res = mockRes();

			await buildPostAssignAssignment(service)(req, res);

			assert.equal(service.assignmentClient.upsertAssignment.mock.callCount(), 0);
		});

		it('should redirect with errors if the programmer does not exist', async () => {
			const req = mockReq({ body: { inspectorId: 'insp-1', programmerId: 'unknown' } });
			const res = mockRes();

			await buildPostAssignAssignment(service)(req, res);

			assert.equal(service.assignmentClient.upsertAssignment.mock.callCount(), 0);
		});

		it('should assign the inspector to the programmer', async () => {
			const req = mockReq({ body: { inspectorId: 'insp-1', programmerId: 'prog-1' } });
			const res = mockRes();

			await buildPostAssignAssignment(service)(req, res);

			assert.equal(service.assignmentClient.upsertAssignment.mock.callCount(), 1);
			const args = service.assignmentClient.upsertAssignment.mock.calls[0].arguments[0];
			assert.deepEqual(args, {
				inspectorId: 'insp-1',
				programmerId: 'prog-1',
				programmerName: 'Paul Howell',
				programmerEmail: 'paul.howell@example.com'
			});
			assert.equal(res.redirect.mock.calls[0].arguments[0], '/assignments');
		});

		it('should handle errors from the assignment client', async () => {
			service.assignmentClient.upsertAssignment.mock.mockImplementationOnce(() => {
				throw new Error('db error');
			});
			const req = mockReq({ body: { inspectorId: 'insp-1', programmerId: 'prog-1' } });
			const res = mockRes();

			await buildPostAssignAssignment(service)(req, res);

			assert.equal(service.logger.error.mock.callCount(), 1);
			assert.equal(res.redirect.mock.calls[0].arguments[0], '/assignments');
		});
	});

	describe('buildPostRemoveAssignment', () => {
		/** @type {*} */
		let service;

		beforeEach(() => {
			service = {
				logger: { info: mock.fn(), warn: mock.fn(), error: mock.fn() },
				assignmentClient: {
					removeAssignment: mock.fn(() => ({ inspectorId: 'insp-1' }))
				}
			};
		});

		it('should redirect with an error if inspectorId is missing', async () => {
			const req = mockReq({ body: {} });
			const res = mockRes();

			await buildPostRemoveAssignment(service)(req, res);

			assert.equal(service.assignmentClient.removeAssignment.mock.callCount(), 0);
			assert.equal(res.redirect.mock.calls[0].arguments[0], '/assignments');
		});

		it('should remove the assignment', async () => {
			const req = mockReq({ body: { inspectorId: 'insp-1' } });
			const res = mockRes();

			await buildPostRemoveAssignment(service)(req, res);

			assert.equal(service.assignmentClient.removeAssignment.mock.callCount(), 1);
			assert.equal(res.redirect.mock.calls[0].arguments[0], '/assignments');
		});

		it('should handle errors from the assignment client', async () => {
			service.assignmentClient.removeAssignment.mock.mockImplementationOnce(() => {
				throw new Error('db error');
			});
			const req = mockReq({ body: { inspectorId: 'insp-1' } });
			const res = mockRes();

			await buildPostRemoveAssignment(service)(req, res);

			assert.equal(service.logger.error.mock.callCount(), 1);
			assert.equal(res.redirect.mock.calls[0].arguments[0], '/assignments');
		});
	});
});
