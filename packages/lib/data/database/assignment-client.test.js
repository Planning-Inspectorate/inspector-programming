import { describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { AssignmentClient } from './assignment-client.js';

describe('AssignmentClient', () => {
	describe('getAllAssignments', () => {
		it('should fetch inspectors with a programmer assigned', async () => {
			const assignedAt = new Date('2026-01-15T10:30:00.000Z');
			const mockDb = {
				inspector: {
					findMany: mock.fn(() => [{ id: 'insp-1', programmerId: 'prog-1', programmerAssignedAt: assignedAt }])
				}
			};

			const result = await new AssignmentClient(mockDb).getAllAssignments();

			assert.deepEqual(result, [{ inspectorId: 'insp-1', programmerId: 'prog-1', updatedAt: assignedAt }]);
			assert.deepEqual(mockDb.inspector.findMany.mock.calls[0].arguments[0], {
				where: { programmerId: { not: null } },
				select: { id: true, programmerId: true, programmerAssignedAt: true }
			});
		});
	});

	describe('getAssignmentByInspectorId', () => {
		it('should return null if no inspectorId is provided', async () => {
			const mockDb = { inspector: { findUnique: mock.fn() } };

			const result = await new AssignmentClient(mockDb).getAssignmentByInspectorId(undefined);

			assert.equal(result, null);
			assert.equal(mockDb.inspector.findUnique.mock.callCount(), 0);
		});

		it('should fetch an assignment by inspectorId', async () => {
			const mockDb = {
				inspector: {
					findUnique: mock.fn(() => ({
						id: 'insp-1',
						programmerId: 'prog-1',
						programmerAssignedAt: null
					}))
				}
			};

			const result = await new AssignmentClient(mockDb).getAssignmentByInspectorId('insp-1');

			assert.deepEqual(result, { inspectorId: 'insp-1', programmerId: 'prog-1', updatedAt: null });
			assert.deepEqual(mockDb.inspector.findUnique.mock.calls[0].arguments[0].where, { id: 'insp-1' });
		});

		it('should return null when the inspector has no programmer assigned', async () => {
			const mockDb = {
				inspector: {
					findUnique: mock.fn(() => ({ id: 'insp-1', programmerId: null, programmerAssignedAt: null }))
				}
			};

			const result = await new AssignmentClient(mockDb).getAssignmentByInspectorId('insp-1');

			assert.equal(result, null);
		});
	});

	describe('getAssignmentsByProgrammerId', () => {
		it('should return an empty array if no programmerId is provided', async () => {
			const mockDb = { inspector: { findMany: mock.fn() } };

			const result = await new AssignmentClient(mockDb).getAssignmentsByProgrammerId(undefined);

			assert.deepEqual(result, []);
			assert.equal(mockDb.inspector.findMany.mock.callCount(), 0);
		});

		it('should fetch assignments by programmerId', async () => {
			const mockDb = {
				inspector: {
					findMany: mock.fn(() => [
						{ id: 'insp-1', programmerId: 'prog-1', programmerAssignedAt: null },
						{ id: 'insp-2', programmerId: 'prog-1', programmerAssignedAt: null }
					])
				}
			};

			const result = await new AssignmentClient(mockDb).getAssignmentsByProgrammerId('prog-1');

			assert.deepEqual(result, [
				{ inspectorId: 'insp-1', programmerId: 'prog-1', updatedAt: null },
				{ inspectorId: 'insp-2', programmerId: 'prog-1', updatedAt: null }
			]);
			assert.deepEqual(mockDb.inspector.findMany.mock.calls[0].arguments[0].where, {
				programmerId: 'prog-1'
			});
		});
	});

	describe('upsertAssignment', () => {
		it('should assign the programmer on the inspector record', async () => {
			const mockDb = {
				inspector: {
					update: mock.fn(({ data }) => ({
						id: 'insp-1',
						programmerId: data.programmerId,
						programmerAssignedAt: data.programmerAssignedAt
					}))
				}
			};
			const client = new AssignmentClient(mockDb);

			const result = await client.upsertAssignment({ inspectorId: 'insp-1', programmerId: 'prog-1' });

			assert.equal(result.inspectorId, 'insp-1');
			assert.equal(result.programmerId, 'prog-1');
			assert.ok(result.updatedAt instanceof Date);
			assert.deepEqual(mockDb.inspector.update.mock.calls[0].arguments[0].where, { id: 'insp-1' });
			assert.equal(mockDb.inspector.update.mock.calls[0].arguments[0].data.programmerId, 'prog-1');
			assert.ok(mockDb.inspector.update.mock.calls[0].arguments[0].data.programmerAssignedAt instanceof Date);
		});
	});

	describe('removeAssignment', () => {
		it('should return null without querying when no inspectorId is provided', async () => {
			const mockDb = { inspector: { updateMany: mock.fn() } };

			const result = await new AssignmentClient(mockDb).removeAssignment('');

			assert.equal(result, null);
			assert.equal(mockDb.inspector.updateMany.mock.callCount(), 0);
		});

		it('should clear the programmer from the inspector record', async () => {
			const mockDb = { inspector: { updateMany: mock.fn(() => ({ count: 1 })) } };

			const result = await new AssignmentClient(mockDb).removeAssignment('insp-1');

			assert.deepEqual(result, { inspectorId: 'insp-1' });
			assert.deepEqual(mockDb.inspector.updateMany.mock.calls[0].arguments[0], {
				where: { id: 'insp-1', programmerId: { not: null } },
				data: { programmerId: null, programmerAssignedAt: null }
			});
		});

		it('should return null when no assignment exists', async () => {
			const mockDb = { inspector: { updateMany: mock.fn(() => ({ count: 0 })) } };

			const result = await new AssignmentClient(mockDb).removeAssignment('insp-1');

			assert.equal(result, null);
		});

		it('should propagate unexpected errors', async () => {
			const mockDb = {
				inspector: {
					updateMany: mock.fn(() => {
						throw new Error('boom');
					})
				}
			};
			const client = new AssignmentClient(mockDb);

			await assert.rejects(() => client.removeAssignment('insp-1'), /boom/);
		});
	});
});
