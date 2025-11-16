import { describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { InspectorClient } from './inspector-client.js';

describe('InspectorClient', () => {
	describe('getInspectorDetails', () => {
		it('should return null if no inspectorId is provided', async () => {
			const mockDb = {
				inspectors: {
					findUnique: mock.fn()
				}
			};
			const client = new InspectorClient(mockDb);

			const result = await client.getInspectorDetails(undefined);
			assert.equal(result, null);
		});
		it('should return inspector if inspectorId is provided', async () => {
			const mockInspector = {
				id: '1',
				firstName: 'John',
				lastName: 'Doe'
			};
			const mockDb = {
				inspector: {
					findFirst: mock.fn(() => mockInspector)
				}
			};
			const client = new InspectorClient(mockDb);

			const result = await client.getInspectorDetails('entra-id-1');
			assert.equal(result, mockInspector);
			assert.equal(mockDb.inspector.findFirst.mock.callCount(), 1);
			const args = mockDb.inspector.findFirst.mock.calls[0].arguments[0];
			assert.deepEqual(args.where?.entraId, 'entra-id-1');
			assert.deepEqual(args?.include, { Specialisms: true });
		});
	});

	describe('getInspectorCaseSpecialism', () => {
		it('should fetch inspector case specialisms with correct select fields', async () => {
			const mockData = [
				{ inspectorSpecialismNormalized: 'highways', caseSpecialism: 'Highways' },
				{ inspectorSpecialismNormalized: 'heritage', caseSpecialism: 'Heritage' }
			];

			const mockDb = {
				inspectorCaseSpecialism: {
					findMany: mock.fn(() => mockData)
				}
			};

			const client = new InspectorClient(mockDb);
			const result = await client.getInspectorCaseSpecialism();

			assert.equal(mockDb.inspectorCaseSpecialism.findMany.mock.callCount(), 1);
			const args = mockDb.inspectorCaseSpecialism.findMany.mock.calls[0].arguments[0];
			assert.deepEqual(args?.select, {
				inspectorSpecialismNormalized: true,
				caseSpecialism: true
			});
			assert.deepEqual(result, mockData);
		});
	});
});
