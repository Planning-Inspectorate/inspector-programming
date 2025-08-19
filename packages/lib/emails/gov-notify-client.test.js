import { describe, it } from 'node:test';
import { GovNotifyClient } from './gov-notify-client.js';
import { mockLogger } from '../testing/mock-logger.js';
import assert from 'node:assert';

describe(`gov-notify-client`, () => {
	describe('sendEmail', () => {
		it('should call NotifyClient', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {});
			ctx.mock.method(client.notifyClient, 'sendEmail', () => {});

			await client.sendEmail('templateId', 'emailAddress', { personalisation: {} });
			assert.strictEqual(client.notifyClient.sendEmail.mock.callCount(), 1);
			assert.strictEqual(logger.info.mock.callCount(), 1);
			assert.strictEqual(logger.error.mock.callCount(), 0);
			const args = client.notifyClient.sendEmail.mock.calls[0].arguments;
			assert.deepStrictEqual(args, ['templateId', 'emailAddress', { personalisation: {} }]);
		});
		it('should log an error if NotifyClient fails', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {});
			ctx.mock.method(client.notifyClient, 'sendEmail', () => {
				throw new Error('Notify API error');
			});
			await assert.rejects(
				async () => {
					await client.sendEmail('templateId', 'emailAddress', { personalisation: {} });
				},
				{
					message: 'email failed to dispatch: Notify API error'
				}
			);
			assert.strictEqual(logger.error.mock.callCount(), 1);
		});
		it('should throw if required fields aren`t set', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {});
			ctx.mock.method(client.notifyClient, 'sendEmail', () => {
				throw new Error('Notify API error');
			});
			await assert.rejects(
				async () => {
					await client.sendEmail('templateId', 'emailAddress', { personalisation: {} }, ['name']);
				},
				{
					message: 'name is required for templateId email'
				}
			);
		});
		it('should not throw if all required fields are present', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {});
			ctx.mock.method(client.notifyClient, 'sendEmail', () => {});
			await assert.doesNotReject(async () => {
				await client.sendEmail('templateId', 'emailAddress', { personalisation: { name: 'Jeremy' } }, ['name']);
			});
		});
	});

	describe('emailMethods', () => {
		const templateIds = {
			assignedCase: 'assigned-case-template-id',
			assignedCaseProgrammeOfficer: 'assigned-case-programme-officer-template-id',
			selfAssignedCase: 'self-assigned-case-template-id',
			selfAssignedCaseProgrammeOfficer: 'self-assigned-case-programme-officer-template-id'
		};
		const emails = {
			assignedCase: {
				method: 'sendAssignedCaseEmail',
				personalisation: {
					inspectorName: 'Inspector Name',
					cbosLink: 'https://example.com/cbos',
					assignmentDate: '1 Jan 2025',
					selectedCases: 'CASE-123, CASE-456'
				}
			},
			assignedCaseProgrammeOfficer: {
				method: 'sendAssignedCaseProgrammeOfficerEmail',
				personalisation: {
					inspectorName: 'Inspector Name',
					programmeOfficerName: 'Programme Officer Name',
					cbosLink: 'https://example.com/cbos',
					assignmentDate: '1 Jan 2025',
					selectedCases: 'CASE-123, CASE-456'
				}
			},
			selfAssignedCase: {
				method: 'sendSelfAssignedCaseEmail',
				personalisation: {
					inspectorName: 'Inspector Name',
					assignmentDate: '1 Jan 2025',
					selectedCases: 'CASE-123, CASE-456'
				}
			},
			selfAssignedCaseProgrammeOfficer: {
				method: 'sendSelfAssignedCaseProgrammeOfficerEmail',
				personalisation: {
					inspectorName: 'Inspector Name',
					programmeOfficerName: 'Programme Officer Name',
					assignmentDate: '1 Jan 2025',
					selectedCases: 'CASE-123, CASE-456'
				}
			}
		};

		for (const [k, v] of Object.entries(emails)) {
			describe(v.method, () => {
				it(`should call sendEmail with personalisation`, async (ctx) => {
					const logger = mockLogger();
					const client = new GovNotifyClient(logger, 'key', templateIds);
					ctx.mock.method(client.notifyClient, 'sendEmail', () => {});
					await client[v.method]('email', v.personalisation);
					assert.strictEqual(client.notifyClient.sendEmail.mock.callCount(), 1);
					const args = client.notifyClient.sendEmail.mock.calls[0].arguments;
					assert.deepStrictEqual(args, [templateIds[k], 'email', { personalisation: v.personalisation }]);
				});
				it('should throw an error if personalisation is missing', async (ctx) => {
					const logger = mockLogger();
					const client = new GovNotifyClient(logger, 'key', templateIds);
					ctx.mock.method(client.notifyClient, 'sendEmail', () => {});
					await assert.rejects(
						client[v.method]('email', { ...v.personalisation, inspectorName: undefined }),
						/inspectorName is required/
					);
				});
			});
		}
	});

	describe('getNotificationById', () => {
		it('should call notifyClient.getNotificationById with correct ID', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {});
			ctx.mock.method(client.notifyClient, 'getNotificationById', () => {
				return { data: { id: 'notification-id' } };
			});
			const notification = await client.getNotificationById('notification-id');
			assert.strictEqual(client.notifyClient.getNotificationById.mock.callCount(), 1);
			assert.strictEqual(notification.data.id, 'notification-id');
			const args = client.notifyClient.getNotificationById.mock.calls[0].arguments;
			assert.deepStrictEqual(args, ['notification-id']);
		});
		it('should throw an error if notifyClient.getNotificationById fails', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {});
			ctx.mock.method(client.notifyClient, 'getNotificationById', () => {
				throw new Error('Notify API error');
			});
			await assert.rejects(
				async () => {
					await client.getNotificationById('notification-id');
				},
				{
					message: 'failed to fetch notification: Notify API error'
				}
			);
		});
	});
});
