import { describe, test, mock, beforeEach } from 'node:test';
import { buildCbosFetchCases } from './impl.js';
import assert from 'node:assert';

describe('cbos-cases-impl', () => {
	const service = {
		dbClient: {
			$transaction: mock.fn(),
			appealCase: {
				upsert: mock.fn(),
				deleteMany: mock.fn()
			},
			appealCasePollStatus: {
				create: mock.fn()
			}
		},
		cbosClient: {
			getUnassignedCases: mock.fn()
		}
	};

	beforeEach(() => {
		service.cbosClient.getUnassignedCases.mock.resetCalls();
	});

	test('should call the cbos api and update database', async () => {
		const appealsData = {
			cases: [{ caseReference: 1 }, { caseReference: 2 }],
			caseReferences: [1, 2]
		};
		service.cbosClient.getUnassignedCases.mock.mockImplementationOnce(() => appealsData);
		const handler = buildCbosFetchCases(service);
		await handler({}, { log: console.log });
		assert.strictEqual(service.cbosClient.getUnassignedCases.mock.callCount(), 1);
		assert.strictEqual(service.dbClient.$transaction.mock.callCount(), 1);
		assert.strictEqual(service.dbClient.appealCase.upsert.mock.callCount(), 2);
		assert.strictEqual(service.dbClient.appealCase.deleteMany.mock.callCount(), 1);
		assert.strictEqual(service.dbClient.appealCasePollStatus.create.mock.callCount(), 1);
	});
	test('should call context.log on error', async () => {
		const context = {
			log: mock.fn()
		};
		service.cbosClient.getUnassignedCases.mock.mockImplementationOnce(() => {
			throw new Error('CBOS error');
		});
		const handler = buildCbosFetchCases(service);
		await assert.rejects(() => handler({}, context));
		assert.strictEqual(service.cbosClient.getUnassignedCases.mock.callCount(), 1);
		assert.strictEqual(context.log.mock.callCount(), 3);
		assert.strictEqual(context.log.mock.calls[1].arguments[1], 'CBOS error');
	});
});
