import { describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { AssignmentClient } from './assignment-client.js';

describe('AssignmentClient', () => {
	describe('getAllAssignments', () => {
		it('should fetch all assignments including the inspector', async () => {
			const mockData = [{ id: '1', inspectorId: 'insp-1', programmerId: 'prog-1' }];
			const mockDb = {
				inspectorProgrammerAssignment: {
					findMany: mock.fn(() => mockData)
				}
			};

			const client = new AssignmentClient(mockDb);
			const result = await client.getAllAssignments();

			assert.equal(mockDb.inspectorProgrammerAssignment.findMany.mock.callCount(), 1);
			const args = mockDb.inspectorProgrammerAssignment.findMany.mock.calls[0].arguments[0];
			assert.deepEqual(args.include, { Inspector: true });
			assert.deepEqual(result, mockData);
		});
	});

	describe('getAssignmentByInspectorId', () => {
		it('should return null if no inspectorId is provided', async () => {
			const mockDb = {
				inspectorProgrammerAssignment: {
					findUnique: mock.fn()
				}
			};
			const client = new AssignmentClient(mockDb);

			const result = await client.getAssignmentByInspectorId(undefined);
			assert.equal(result, null);
			assert.equal(mockDb.inspectorProgrammerAssignment.findUnique.mock.callCount(), 0);
		});

		it('should fetch an assignment by inspectorId', async () => {
			const mockAssignment = { id: '1', inspectorId: 'insp-1', programmerId: 'prog-1' };
			const mockDb = {
				inspectorProgrammerAssignment: {
					findUnique: mock.fn(() => mockAssignment)
				}
			};
			const client = new AssignmentClient(mockDb);

			const result = await client.getAssignmentByInspectorId('insp-1');
			assert.equal(result, mockAssignment);
			const args = mockDb.inspectorProgrammerAssignment.findUnique.mock.calls[0].arguments[0];
			assert.deepEqual(args.where, { inspectorId: 'insp-1' });
		});
	});

	describe('getAssignmentsByProgrammerId', () => {
		it('should return an empty array if no programmerId is provided', async () => {
			const mockDb = {
				inspectorProgrammerAssignment: {
					findMany: mock.fn()
				}
			};
			const client = new AssignmentClient(mockDb);

			const result = await client.getAssignmentsByProgrammerId(undefined);
			assert.deepEqual(result, []);
			assert.equal(mockDb.inspectorProgrammerAssignment.findMany.mock.callCount(), 0);
		});

		it('should fetch assignments by programmerId', async () => {
			const mockData = [{ id: '1', inspectorId: 'insp-1', programmerId: 'prog-1' }];
			const mockDb = {
				inspectorProgrammerAssignment: {
					findMany: mock.fn(() => mockData)
				}
			};
			const client = new AssignmentClient(mockDb);

			const result = await client.getAssignmentsByProgrammerId('prog-1');
			assert.deepEqual(result, mockData);
			const args = mockDb.inspectorProgrammerAssignment.findMany.mock.calls[0].arguments[0];
			assert.deepEqual(args.where, { programmerId: 'prog-1' });
		});
	});

	describe('upsertAssignment', () => {
		it('should upsert an assignment on inspectorId', async () => {
			const mockAssignment = {
				inspectorId: 'insp-1',
				programmerId: 'prog-1',
				programmerName: 'Paul Howell',
				programmerEmail: 'paul.howell@example.com'
			};
			const mockDb = {
				inspectorProgrammerAssignment: {
					upsert: mock.fn(() => mockAssignment)
				}
			};
			const client = new AssignmentClient(mockDb);

			const result = await client.upsertAssignment(mockAssignment);
			assert.equal(result, mockAssignment);

			const args = mockDb.inspectorProgrammerAssignment.upsert.mock.calls[0].arguments[0];
			assert.deepEqual(args.where, { inspectorId: 'insp-1' });
			assert.deepEqual(args.create, mockAssignment);
			assert.deepEqual(args.update, {
				programmerId: 'prog-1',
				programmerName: 'Paul Howell',
				programmerEmail: 'paul.howell@example.com'
			});
		});
	});

	describe('removeAssignment', () => {
		it('should delete an assignment by inspectorId', async () => {
			const mockAssignment = { inspectorId: 'insp-1', programmerId: 'prog-1' };
			const mockDb = {
				inspectorProgrammerAssignment: {
					delete: mock.fn(() => mockAssignment)
				}
			};
			const client = new AssignmentClient(mockDb);

			const result = await client.removeAssignment('insp-1');
			assert.equal(result, mockAssignment);
			const args = mockDb.inspectorProgrammerAssignment.delete.mock.calls[0].arguments[0];
			assert.deepEqual(args.where, { inspectorId: 'insp-1' });
		});

		it('should return null when the record does not exist', async () => {
			const mockDb = {
				inspectorProgrammerAssignment: {
					delete: mock.fn(() => {
						const err = new Error('not found');
						err.code = 'P2025';
						throw err;
					})
				}
			};
			const client = new AssignmentClient(mockDb);

			const result = await client.removeAssignment('insp-1');
			assert.equal(result, null);
		});

		it('should rethrow unexpected errors', async () => {
			const mockDb = {
				inspectorProgrammerAssignment: {
					delete: mock.fn(() => {
						throw new Error('boom');
					})
				}
			};
			const client = new AssignmentClient(mockDb);

			await assert.rejects(() => client.removeAssignment('insp-1'), /boom/);
		});
	});
});
