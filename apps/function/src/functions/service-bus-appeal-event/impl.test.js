import { describe, test, mock } from 'node:test';
import assert from 'node:assert';
import { APPEAL_EVENT_TYPE } from '@planning-inspectorate/data-model';
import { buildHandleAppealEventMessage } from './impl.js';

const BASE_EVENT_MESSAGE = {
	eventId: '7000000-1',
	caseReference: 'APP/W1234/D/25/1234567',
	eventType: 'site_visit_accompanied',
	eventName: 'Site visit',
	eventStatus: 'confirmed',
	isUrgent: false,
	eventPublished: true,
	eventStartDateTime: '2025-03-01T10:00:00.000Z',
	eventEndDateTime: '2025-03-01T12:00:00.000Z',
	notificationOfSiteVisit: '2025-02-20T00:00:00.000Z',
	addressLine1: '1 Test Street',
	addressLine2: null,
	addressTown: 'Test Town',
	addressCounty: 'Test County',
	addressPostcode: 'TE1 1ST'
};

const msg = (overrides = {}) => ({ ...BASE_EVENT_MESSAGE, ...overrides });

const ctx = () => ({
	log: mock.fn()
});

const svc = (options = {}) => {
	const { caseExists = true, updateThrow = false } = options;

	const appealCase = {
		findUnique: mock.fn(async () => (caseExists ? { caseReference: BASE_EVENT_MESSAGE.caseReference } : null)),
		update: mock.fn(async () => {
			if (updateThrow) throw new Error('db update failed');
			return { caseReference: BASE_EVENT_MESSAGE.caseReference };
		})
	};

	return {
		dbClient: {
			appealCase,
			$transaction: mock.fn(async (callback) => callback({ appealCase }))
		}
	};
};

describe('service-bus-appeal-event', () => {
	describe('buildHandleAppealEventMessage', () => {
		test('updates eventType for site_visit_accompanied', async () => {
			const service = svc();
			const context = ctx();
			await buildHandleAppealEventMessage(service)(msg(), context);

			assert.strictEqual(service.dbClient.$transaction.mock.callCount(), 1);
			assert.strictEqual(service.dbClient.appealCase.findUnique.mock.callCount(), 1);
			assert.strictEqual(service.dbClient.appealCase.update.mock.callCount(), 1);
			assert.deepStrictEqual(service.dbClient.appealCase.update.mock.calls[0].arguments[0], {
				where: { caseReference: 'APP/W1234/D/25/1234567' },
				data: { eventType: 'site_visit_accompanied' }
			});
		});

		test('updates eventType for site_visit_unaccompanied', async () => {
			const service = svc();
			const context = ctx();
			await buildHandleAppealEventMessage(service)(
				msg({ eventType: APPEAL_EVENT_TYPE.SITE_VISIT_UNACCOMPANIED }),
				context
			);

			assert.strictEqual(service.dbClient.appealCase.update.mock.callCount(), 1);
			assert.deepStrictEqual(service.dbClient.appealCase.update.mock.calls[0].arguments[0], {
				where: { caseReference: 'APP/W1234/D/25/1234567' },
				data: { eventType: 'site_visit_unaccompanied' }
			});
		});

		test('updates eventType for site_visit_access_required', async () => {
			const service = svc();
			const context = ctx();
			await buildHandleAppealEventMessage(service)(
				msg({ eventType: APPEAL_EVENT_TYPE.SITE_VISIT_ACCESS_REQUIRED }),
				context
			);

			assert.strictEqual(service.dbClient.appealCase.update.mock.callCount(), 1);
			assert.deepStrictEqual(service.dbClient.appealCase.update.mock.calls[0].arguments[0], {
				where: { caseReference: 'APP/W1234/D/25/1234567' },
				data: { eventType: 'site_visit_access_required' }
			});
		});

		test('ignores non-site-visit event types (hearing)', async () => {
			const service = svc();
			const context = ctx();
			await buildHandleAppealEventMessage(service)(msg({ eventType: 'hearing' }), context);

			assert.strictEqual(service.dbClient.appealCase.findUnique.mock.callCount(), 0);
			assert.strictEqual(service.dbClient.appealCase.update.mock.callCount(), 0);
		});

		test('ignores non-site-visit event types (inquiry)', async () => {
			const service = svc();
			const context = ctx();
			await buildHandleAppealEventMessage(service)(msg({ eventType: 'inquiry' }), context);

			assert.strictEqual(service.dbClient.appealCase.findUnique.mock.callCount(), 0);
			assert.strictEqual(service.dbClient.appealCase.update.mock.callCount(), 0);
		});

		test('ignores event if case not found in database', async () => {
			const service = svc({ caseExists: false });
			const context = ctx();
			await buildHandleAppealEventMessage(service)(msg(), context);

			assert.strictEqual(service.dbClient.appealCase.findUnique.mock.callCount(), 1);
			assert.strictEqual(service.dbClient.appealCase.update.mock.callCount(), 0);
		});

		test('throws on update failure', async () => {
			const service = svc({ updateThrow: true });
			const context = ctx();
			await assert.rejects(() => buildHandleAppealEventMessage(service)(msg(), context), {
				message: 'Failed to process appeal event for case APP/W1234/D/25/1234567: db update failed'
			});
		});

		test('logs are called', async () => {
			const service = svc();
			const context = ctx();
			await buildHandleAppealEventMessage(service)(msg(), context);
			assert.ok(context.log.mock.callCount() > 0, 'Expected logging');
		});
	});
});
