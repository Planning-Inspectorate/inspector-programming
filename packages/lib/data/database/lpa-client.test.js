import { describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { LpaClient } from './lpa-client.js';

describe('LpaClient', () => {
	describe('getLpaList', () => {
		it('should fetch LPAs with correct query shape', async () => {
			const mockData = [
				{ lpaCode: 'ABC', lpaName: 'Alpha Council' },
				{ lpaCode: 'XYZ', lpaName: 'Zeta Borough' }
			];

			const mockDb = {
				lpa: {
					findMany: mock.fn(() => mockData)
				}
			};

			const client = new LpaClient(mockDb);
			const result = await client.getLpaList();

			assert.equal(mockDb.lpa.findMany.mock.callCount(), 1);

			const args = mockDb.lpa.findMany.mock.calls[0].arguments[0];

			assert.deepEqual(args.select, { lpaCode: true, lpaName: true });
			assert.deepEqual(args.orderBy, { lpaName: 'asc' });

			assert.deepEqual(result, mockData);
		});

		it('should return LPAs even when lpaName is null', async () => {
			const mockData = [
				{ lpaCode: 'ABC', lpaName: 'Alpha Council' },
				{ lpaCode: 'XYZ', lpaName: null },
				{ lpaCode: 'DEF', lpaName: 'Delta District' }
			];

			const mockDb = {
				lpa: {
					findMany: mock.fn(() => mockData)
				}
			};

			const client = new LpaClient(mockDb);
			const result = await client.getLpaList();

			assert.equal(mockDb.lpa.findMany.mock.callCount(), 1);

			assert.deepEqual(result, mockData);
		});
	});
});
