import { describe, it, before, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildHandleWeeklyReport } from './impl.js';

describe('Weekly report Function', () => {
	let mockService;
	let mockContext;

	before(() => {
		mockService = {
			logger: {
				info: () => {},
				error: () => {},
				warn: () => {}
			},
			appInsightsClient: {
				queryLogs: mock.fn(async () => [{ Count: '5' }])
			},
			govNotifyClient: {
				sendWeeklyReportEmail: mock.fn(async () => {})
			},
			weeklyReportEmail: 'test@example.com'
		};

		mockContext = {
			log: () => {},
			error: () => {}
		};
	});

	it('should process weekly case assignments successfully', async (ctx) => {
		ctx.mock.timers.enable({
			apis: ['Date'],
			now: new Date('2026-06-15T09:00:00Z')
		});
		const handler = buildHandleWeeklyReport(mockService);
		const myTimer = {
			ScheduleStatus: {
				Last: new Date(),
				Next: new Date(),
				LastExecution: new Date()
			},
			IsPastDue: false
		};

		// Should not throw
		await handler(myTimer, mockContext);

		assert.strictEqual(mockService.appInsightsClient.queryLogs.mock.callCount(), 1);
		assert.strictEqual(mockService.govNotifyClient.sendWeeklyReportEmail.mock.callCount(), 1);
		const args = mockService.govNotifyClient.sendWeeklyReportEmail.mock.calls[0].arguments;
		assert.strictEqual(args[0], 'test@example.com');
		assert.deepStrictEqual(args[1], {
			weekStart: '8 Jun 2026',
			casesCount: '5',
			greeting: 'Good morning'
		});
	});
});
