import { describe, test, mock } from 'node:test';
import { buildCbosFetchCases } from './impl.js';
import assert from 'node:assert';

describe('cbos-cases-impl', () => {
	test('should call the database client', async () => {
		const service = {
			dbClient: {
				$executeRaw: mock.fn()
			}
		};
		const handler = buildCbosFetchCases(service);
		await handler({}, { log: console.log });
		assert.strictEqual(service.dbClient.$executeRaw.mock.callCount(), 1);
	});
	test('should call context.log on error', async () => {
		const service = {
			dbClient: {
				$executeRaw: mock.fn(() => {
					throw new Error('DB error');
				})
			}
		};
		const context = {
			log: mock.fn()
		};
		const handler = buildCbosFetchCases(service);
		await assert.rejects(() => handler({}, context));
		assert.strictEqual(service.dbClient.$executeRaw.mock.callCount(), 1);
		assert.strictEqual(context.log.mock.callCount(), 3);
		assert.strictEqual(context.log.mock.calls[1].arguments[1], 'DB error');
	});
});
