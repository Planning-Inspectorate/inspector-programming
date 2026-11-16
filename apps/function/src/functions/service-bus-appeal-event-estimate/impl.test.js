import { describe, test, mock } from 'node:test';
import assert from 'node:assert';
import { MESSAGE_EVENT_TYPE } from '@planning-inspectorate/data-model';
import { buildHandleAppealEventEstimateMessage } from './impl.js';

const BASE_MESSAGE = {
	id: 101,
	caseReference: '6000123',
	preparationTime: 0.5,
	sittingTime: 1,
	reportingTime: null
};

const msg = (overrides = {}) => ({ ...BASE_MESSAGE, ...overrides });

const ctx = (type = MESSAGE_EVENT_TYPE.UPDATE) => ({
	log: mock.fn(),
	triggerMetadata: { applicationProperties: { type } }
});

const svc = ({ caseExists = true, upsertThrow = false } = {}) => {
	const appealCase = {
		findUnique: mock.fn(async () => (caseExists ? { caseReference: BASE_MESSAGE.caseReference } : null))
	};
	const appealEventEstimate = {
		upsert: mock.fn(async () => {
			if (upsertThrow) throw new Error('db upsert failed');
		}),
		deleteMany: mock.fn(async () => ({ count: 1 }))
	};
	return {
		dbClient: {
			appealCase,
			appealEventEstimate,
			$transaction: mock.fn(async (callback) => callback({ appealCase, appealEventEstimate }))
		},
		databaseRetryOptions: { maxAttempts: 1 }
	};
};

describe('service-bus-appeal-event-estimate', () => {
	test('upserts the estimate for create/update messages', async () => {
		for (const type of [MESSAGE_EVENT_TYPE.CREATE, MESSAGE_EVENT_TYPE.UPDATE]) {
			const service = svc();
			await buildHandleAppealEventEstimateMessage(service)(msg(), ctx(type));

			assert.strictEqual(service.dbClient.appealEventEstimate.upsert.mock.callCount(), 1);
			const expected = { ...BASE_MESSAGE };
			assert.deepStrictEqual(service.dbClient.appealEventEstimate.upsert.mock.calls[0].arguments[0], {
				where: { caseReference: '6000123' },
				create: expected,
				update: expected
			});
			assert.strictEqual(service.dbClient.appealEventEstimate.deleteMany.mock.callCount(), 0);
		}
	});

	test('deletes the estimate for delete messages', async () => {
		const service = svc();
		await buildHandleAppealEventEstimateMessage(service)(msg(), ctx(MESSAGE_EVENT_TYPE.DELETE));

		assert.strictEqual(service.dbClient.appealEventEstimate.deleteMany.mock.callCount(), 1);
		assert.deepStrictEqual(service.dbClient.appealEventEstimate.deleteMany.mock.calls[0].arguments[0], {
			where: { id: 101 }
		});
		assert.strictEqual(service.dbClient.appealEventEstimate.upsert.mock.callCount(), 0);
	});

	test('ignores estimates for cases not in the database', async () => {
		const service = svc({ caseExists: false });
		await buildHandleAppealEventEstimateMessage(service)(msg(), ctx());

		assert.strictEqual(service.dbClient.appealCase.findUnique.mock.callCount(), 1);
		assert.strictEqual(service.dbClient.appealEventEstimate.upsert.mock.callCount(), 0);
	});

	test('throws on invalid message without touching the database', async () => {
		const service = svc();
		const invalid = msg();
		delete invalid.sittingTime;
		await assert.rejects(() => buildHandleAppealEventEstimateMessage(service)(invalid, ctx()), {
			message: /failed schema validation/
		});
		assert.strictEqual(service.dbClient.$transaction.mock.callCount(), 0);
		assert.strictEqual(service.dbClient.appealEventEstimate.deleteMany.mock.callCount(), 0);
	});

	test('throws on database failure', async () => {
		const service = svc({ upsertThrow: true });
		await assert.rejects(() => buildHandleAppealEventEstimateMessage(service)(msg(), ctx()), {
			message: 'Failed to upsert event estimate for case 6000123: db upsert failed'
		});
	});
});
