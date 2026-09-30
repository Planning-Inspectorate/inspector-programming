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
		session: {
			account: { name: 'Test User', idTokenClaims: { groups: ['team-leads-group-id', 'inspectors-group-id'] } }
		},
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
				entraClient: mock.fn(() => ({
					listAllGroupMembers: mock.fn((groupId) =>
						groupId === 'inspectors-group-id'
							? [{ id: 'insp-1', givenName: 'Michael', surname: 'Chalk', mail: 'm@e.com' }]
							: [{ id: 'prog-1', displayName: 'Paul Howell', mail: 'paul@example.com' }]
					)
				})),
				entraGroupIds: {
					teamLeads: 'team-leads-group-id',
					inspectors: 'inspectors-group-id',
					programmers: 'programmers-group-id'
				},
				inspectorClient: {
					getAllInspectors: mock.fn(() => [
						{ id: 'insp-1', firstName: 'Database name', lastName: 'Only' },
						{ id: 'db-only', firstName: 'Database', lastName: 'Only' }
					])
				},
				assignmentClient: {
					getAllAssignments: mock.fn(() => [{ inspectorId: 'insp-1', programmerId: 'prog-1', updatedAt: new Date() }])
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
			assert.deepEqual(viewModel.inspectorOptions, [{ id: 'insp-1', name: 'Michael Chalk', email: 'm@e.com' }]);
			assert.equal(viewModel.assignments[0].inspectorEmail, 'm@e.com');
			assert.equal(viewModel.assignments[0].programmerName, 'Paul Howell');
			assert.equal(viewModel.assignments[0].programmerEmail, 'paul@example.com');
			assert.equal(viewModel.isAssignmentsPage, true);
		});
	});

	describe('buildPostAssignAssignment', () => {
		/** @type {*} */
		let service;

		/** @type {Record<string, { id: string, displayName: string, mail: string }>} */
		const entraUsers = {
			'insp-1': { id: 'insp-1', displayName: 'Michael Chalk', mail: 'm@e.com' },
			'prog-1': { id: 'prog-1', displayName: 'Paul Howell', mail: 'paul.howell@example.com' }
		};

		beforeEach(() => {
			service = {
				logger: { info: mock.fn(), warn: mock.fn(), error: mock.fn() },
				entraClient: mock.fn(() => ({
					getUserById: mock.fn(async (id) => entraUsers[id] ?? null)
				})),
				entraGroupIds: {
					teamLeads: 'team-leads-group-id',
					inspectors: 'inspectors-group-id',
					programmers: 'programmers-group-id'
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
			const req = mockReq({ body: { inspectorId: 'db-only', programmerId: 'prog-1' } });
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
				programmerId: 'prog-1'
			});
			assert.equal(req.session.assignments?.success?.message, 'Michael Chalk has been assigned to Paul Howell');
			assert.equal(res.redirect.mock.calls[0].arguments[0], '/assignments');
		});

		it('should reject an inspector not visible to the current user', async () => {
			const req = mockReq({
				session: { account: { name: 'Test User', idTokenClaims: { groups: [] } } },
				body: { inspectorId: 'insp-1', programmerId: 'prog-1' }
			});
			const res = mockRes();

			await buildPostAssignAssignment(service)(req, res);

			assert.equal(service.assignmentClient.upsertAssignment.mock.callCount(), 0);
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
				},
				entraClient: mock.fn(() => ({
					listAllGroupMembers: mock.fn((groupId) =>
						groupId === 'inspectors-group-id'
							? [{ id: 'insp-1', givenName: 'Michael', surname: 'Chalk', mail: 'm@e.com' }]
							: []
					)
				})),
				entraGroupIds: {
					teamLeads: 'team-leads-group-id',
					inspectors: 'inspectors-group-id',
					nationalTeam: 'national-team-group-id'
				},
				inspectorClient: {
					getAllInspectors: mock.fn(async () => [{ id: 'insp-1' }])
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

		it('should attempt to remove an assignment for an unknown inspector', async () => {
			const req = mockReq({ body: { inspectorId: 'other-inspector' } });
			const res = mockRes();

			await buildPostRemoveAssignment(service)(req, res);

			assert.equal(service.assignmentClient.removeAssignment.mock.callCount(), 1);
			assert.equal(service.assignmentClient.removeAssignment.mock.calls[0].arguments[0], 'other-inspector');
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
