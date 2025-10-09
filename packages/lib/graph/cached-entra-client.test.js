import { describe, it, mock } from 'node:test';
import { buildInitEntraClient, CachedEntraClient } from './cached-entra-client.js';
import assert from 'node:assert';

describe('cached-entra-client', () => {
	describe('buildInitEntraClient', () => {
		it('should return null if auth not enabled', () => {
			const initEntraClient = buildInitEntraClient(false, {});
			assert.strictEqual(initEntraClient({}), null);
		});
		it('should return a client if auth enabled', () => {
			const initEntraClient = buildInitEntraClient(true, {});
			let client;
			assert.doesNotThrow(() => {
				client = initEntraClient({
					account: { accessToken: 'token-1' }
				});
			});
			assert.notStrictEqual(client, null);
			assert.strictEqual(typeof client.listAllGroupMembers === 'function', true);
		});
	});
	describe('CachedEntraClient', () => {
		it('should return cached entry if present', async () => {
			const cacheMock = {
				get: mock.fn(() => [1, 2, 3])
			};
			const clientMock = {};
			const cacheClient = new CachedEntraClient(clientMock, cacheMock);
			const members = await cacheClient.listAllGroupMembers('group-1');
			assert.strictEqual(cacheMock.get.mock.callCount(), 1);
			assert.deepStrictEqual(members, [1, 2, 3]);
		});
		it('should fetch new value if no cache value', async () => {
			const cacheMock = {
				get: mock.fn(),
				set: mock.fn()
			};
			const clientMock = {
				listAllGroupMembers: mock.fn(() => [5, 6, 7])
			};
			const cacheClient = new CachedEntraClient(clientMock, cacheMock);
			const members = await cacheClient.listAllGroupMembers('group-1');
			assert.deepStrictEqual(members, [5, 6, 7]);
			assert.strictEqual(clientMock.listAllGroupMembers.mock.callCount(), 1);
			assert.strictEqual(cacheMock.get.mock.callCount(), 1);
			assert.strictEqual(cacheMock.set.mock.callCount(), 1);
		});
		it('should calendar events', async () => {
			const expectedEvents = {
				value: [
					{
						id: '1',
						subject: 'Test',
						start: {
							dateTime: '2025-08-20T15:00:00.000Z',
							timeZone: 'Europe/London'
						},
						end: {
							dateTime: '2025-08-20T16:00:00.000Z',
							timeZone: 'Europe/London'
						}
					}
				]
			};
			const cacheMock = {};
			const clientMock = {
				getUserCalendarEvents: mock.fn(() => expectedEvents)
			};

			const cacheClient = new CachedEntraClient(clientMock, cacheMock);
			const events = await cacheClient.getUserCalendarEvents('userId');
			assert.deepStrictEqual(events.value, expectedEvents.value);
		});
		it('should create multiple calendar events', async () => {
			const cacheMock = {};
			const clientMock = {
				createCalendarEvent: mock.fn()
			};
			const cacheClient = new CachedEntraClient(clientMock, cacheMock);
			const userId = 'userID';

			const event1 = {
				subject: 'subject1',
				start: {
					dateTime: 'start1',
					timeZone: 'timezone1'
				},
				end: {
					dateTime: 'end1',
					timeZone: 'timezone1'
				},
				location: {
					address: {
						street: 'street 1',
						postalCode: 'postcode 1'
					}
				}
			};

			const event2 = {
				subject: 'subject2',
				start: {
					dateTime: 'start2',
					timeZone: 'timezone2'
				},
				end: {
					dateTime: 'end2',
					timeZone: 'timezone2'
				},
				location: {
					address: {
						street: 'street 2',
						postalCode: 'postcode 2'
					}
				}
			};

			await cacheClient.createCalendarEvents([event1, event2], userId);
			assert.strictEqual(clientMock.createCalendarEvent.mock.callCount(), 2);
			assert.deepStrictEqual(clientMock.createCalendarEvent.mock.calls[0].arguments[0], event1);
			assert.deepStrictEqual(clientMock.createCalendarEvent.mock.calls[0].arguments[1], userId);
			assert.deepStrictEqual(clientMock.createCalendarEvent.mock.calls[1].arguments[0], event2);
			assert.deepStrictEqual(clientMock.createCalendarEvent.mock.calls[1].arguments[1], userId);
		});
	});
});
