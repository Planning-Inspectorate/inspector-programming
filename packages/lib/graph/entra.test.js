import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { EntraClient, ODATA } from './entra.js';
import { EXTENSION_ID } from './entra.js';

describe('EntraClient', () => {
	const mockClient = () => {
		return {
			api() {
				return this;
			},
			select() {
				return this;
			},
			expand() {
				return this;
			},
			query() {
				return this;
			},
			top() {
				return this;
			},
			header() {
				return this;
			},
			skipToken: mock.fn(() => this),
			get: mock.fn(() => ({ value: [] }))
		};
	};

	describe('listAllGroupMembers', () => {
		it('should call get and return members', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => {
				return {
					value: [{ id: '1', displayName: 'Name', [ODATA.TYPE]: ODATA.USER_TYPE }]
				};
			});
			const entra = new EntraClient(client);
			const members = await entra.listAllGroupMembers('group-1');
			assert.strictEqual(client.get.mock.callCount(), 1);
			assert.strictEqual(members.length, 1);
		});

		it('should return only users not groups', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => {
				return {
					value: [
						{ id: '1', displayName: 'Name 1', [ODATA.TYPE]: ODATA.USER_TYPE },
						{ id: '2', displayName: 'Name 2', [ODATA.TYPE]: ODATA.GROUP_TYPE },
						{ id: '3', displayName: 'Name 3', [ODATA.TYPE]: ODATA.GROUP_TYPE }
					]
				};
			});
			const entra = new EntraClient(client);
			const members = await entra.listAllGroupMembers('group-1');
			assert.strictEqual(client.get.mock.callCount(), 1);
			assert.strictEqual(members.length, 1);
		});

		it('should call get until all members are fetched', async () => {
			const client = mockClient();
			const membersList = Array.from({ length: 20 }, (v, i) => {
				return { id: i, displayName: `Name ${i + 1}`, [ODATA.TYPE]: ODATA.USER_TYPE };
			});
			let index = 0;
			const perPage = 2;

			client.get.mock.mockImplementation(() => {
				const end = (index + 1) * perPage >= membersList.length;
				const value = membersList.slice(index, index + perPage);
				index++;
				return {
					[ODATA.NEXT_LINK]: end ? undefined : `https://example.com?$skipToken=token-${index}`,
					[ODATA.TYPE]: ODATA.USER_TYPE,
					value
				};
			});
			const entra = new EntraClient(client);
			const members = await entra.listAllGroupMembers('group-1');
			assert.strictEqual(client.get.mock.callCount(), 10);
			assert.strictEqual(client.skipToken.mock.callCount(), 9);
			assert.strictEqual(members.length, 20);
		});

		it('should call get a maximum of 10 times', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => {
				return {
					[ODATA.NEXT_LINK]: 'https://example.com?$skipToken=token-1',
					value: [{ id: '1', displayName: 'Name', [ODATA.TYPE]: ODATA.USER_TYPE }]
				};
			});
			const entra = new EntraClient(client);
			await entra.listAllGroupMembers('group-1');
			assert.strictEqual(client.get.mock.callCount(), 10);
		});

		it('should call and return calendar events for user', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => {
				return {
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
			});

			const entra = new EntraClient(client);
			const calendarEvents = await entra.getUserCalendarEvents('userId');
			assert.strictEqual(client.get.mock.callCount(), 1);
			assert.strictEqual(calendarEvents.value.length, 1);
		});
	});
	describe('listAllUserCalendarEvents', () => {
		it('should return a list of events', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => {
				return {
					value: [
						{
							[ODATA.TYPE]: ODATA.EVENT_TYPE,
							id: 'id1',
							subject: 'test event',
							start: { dateTime: '2025-08-13T14:00:00.0000000', timeZone: 'UTC' },
							end: { dateTime: '2025-08-15T14:00:00.0000000', timeZone: 'UTC' }
						}
					]
				};
			});
			const entra = new EntraClient(client);
			const members = await entra.listAllUserCalendarEvents('testGroup', {
				calendarEventsDayRange: 3,
				calendarEventsFromDateOffset: 0
			});
			assert.strictEqual(client.get.mock.callCount(), 1);
			assert.strictEqual(members.length, 1);
		});
		it('should call get until all events are fetched', async () => {
			const client = mockClient();
			const eventsList = Array.from({ length: 20 }, (v, i) => {
				return {
					[ODATA.TYPE]: ODATA.EVENT_TYPE,
					id: i,
					subject: `Event ${i + 1}`,
					start: { dateTime: '2025-08-13T14:00:00.0000000', timeZone: 'UTC' },
					end: { dateTime: '2025-08-15T14:00:00.0000000', timeZone: 'UTC' }
				};
			});
			let index = 0;
			const perPage = 2;

			client.get.mock.mockImplementation(() => {
				const end = (index + 1) * perPage >= eventsList.length;
				const value = eventsList.slice(index, index + perPage);
				index++;
				return {
					[ODATA.NEXT_LINK]: end ? undefined : `https://example.com?$skipToken=token-${index}`,
					[ODATA.TYPE]: ODATA.EVENT_TYPE,
					value
				};
			});
			const entra = new EntraClient(client);
			const events = await entra.listAllUserCalendarEvents('testGroup', {
				calendarEventsDayRange: 3,
				calendarEventsFromDateOffset: 0
			});
			assert.strictEqual(client.get.mock.callCount(), 10);
			assert.strictEqual(client.skipToken.mock.callCount(), 9);
			assert.strictEqual(events.length, 20);
		});
		it('should call get a maximum of 10 times', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => {
				return {
					[ODATA.NEXT_LINK]: 'https://example.com?$skipToken=token-1',
					value: [
						{
							[ODATA.TYPE]: ODATA.EVENT_TYPE,
							id: 'id1',
							subject: 'test event',
							start: { dateTime: '2025-08-13T14:00:00.0000000', timeZone: 'UTC' },
							end: { dateTime: '2025-08-15T14:00:00.0000000', timeZone: 'UTC' }
						}
					]
				};
			});
			const entra = new EntraClient(client);
			await entra.listAllUserCalendarEvents('testGroup', {
				calendarEventsDayRange: 3,
				calendarEventsFromDateOffset: 0
			});

			assert.strictEqual(client.get.mock.callCount(), 10);
		});
	});
	describe('listAllUserCalendarEvents', () => {
		it('should return a list of events', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => {
				return {
					value: [
						{
							[ODATA.TYPE]: ODATA.EVENT_TYPE,
							id: 'id1',
							subject: 'test event',
							start: { dateTime: '2025-08-13T14:00:00.0000000', timeZone: 'UTC' },
							end: { dateTime: '2025-08-15T14:00:00.0000000', timeZone: 'UTC' }
						}
					]
				};
			});
			const entra = new EntraClient(client);
			const members = await entra.listAllUserCalendarEvents('testGroup', {
				calendarEventsDayRange: 3,
				calendarEventsFromDateOffset: 0
			});
			assert.strictEqual(client.get.mock.callCount(), 1);
			assert.strictEqual(members.length, 1);
		});
		it('should call get until all events are fetched', async () => {
			const client = mockClient();
			const eventsList = Array.from({ length: 20 }, (v, i) => {
				return {
					[ODATA.TYPE]: ODATA.EVENT_TYPE,
					id: i,
					subject: `Event ${i + 1}`,
					start: { dateTime: '2025-08-13T14:00:00.0000000', timeZone: 'UTC' },
					end: { dateTime: '2025-08-15T14:00:00.0000000', timeZone: 'UTC' }
				};
			});
			let index = 0;
			const perPage = 2;

			client.get.mock.mockImplementation(() => {
				const end = (index + 1) * perPage >= eventsList.length;
				const value = eventsList.slice(index, index + perPage);
				index++;
				return {
					[ODATA.NEXT_LINK]: end ? undefined : `https://example.com?$skipToken=token-${index}`,
					[ODATA.TYPE]: ODATA.EVENT_TYPE,
					value
				};
			});
			const entra = new EntraClient(client);
			const events = await entra.listAllUserCalendarEvents('testGroup', {
				calendarEventsDayRange: 3,
				calendarEventsFromDateOffset: 0
			});
			assert.strictEqual(client.get.mock.callCount(), 10);
			assert.strictEqual(client.skipToken.mock.callCount(), 9);
			assert.strictEqual(events.length, 20);
		});
		it('should call get a maximum of 10 times', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => {
				return {
					[ODATA.NEXT_LINK]: 'https://example.com?$skipToken=token-1',
					value: [
						{
							[ODATA.TYPE]: ODATA.EVENT_TYPE,
							id: 'id1',
							subject: 'test event',
							start: { dateTime: '2025-08-13T14:00:00.0000000', timeZone: 'UTC' },
							end: { dateTime: '2025-08-15T14:00:00.0000000', timeZone: 'UTC' }
						}
					]
				};
			});
			const entra = new EntraClient(client);
			await entra.listAllUserCalendarEvents('testGroup', {
				calendarEventsDayRange: 3,
				calendarEventsFromDateOffset: 0
			});

			assert.strictEqual(client.get.mock.callCount(), 10);
		});
	});

	// New tests for extension metadata mapping
	describe('extension metadata mapping', () => {
		it('getUserCalendarEvents applies extension metadata when present', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => ({
				value: [
					{
						id: 'evt-1',
						subject: 'Event With Extension',
						start: { dateTime: '2025-09-10T09:00:00.000Z', timeZone: 'UTC' },
						end: { dateTime: '2025-09-10T10:00:00.000Z', timeZone: 'UTC' },
						extensions: [{ id: EXTENSION_ID, extensionName: 'pinsExt', caseReference: '6900216', eventType: 'Hearing' }]
					}
				]
			}));
			const entra = new EntraClient(client);
			const res = await entra.getUserCalendarEvents('user-1');
			assert.strictEqual(res.value[0].systemEvent, true);
			assert.strictEqual(res.value[0].caseReference, '6900216');
			assert.strictEqual(res.value[0].eventType, 'Hearing');
		});

		it('getUserCalendarEvents leaves event unchanged when no extension', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => ({
				value: [
					{
						id: 'evt-2',
						subject: 'Event Without Extension',
						start: { dateTime: '2025-09-10T11:00:00.000Z', timeZone: 'UTC' },
						end: { dateTime: '2025-09-10T12:00:00.000Z', timeZone: 'UTC' },
						extensions: [{ id: 'some-other-extension', extensionName: 'other' }]
					}
				]
			}));
			const entra = new EntraClient(client);
			const res = await entra.getUserCalendarEvents('user-1');
			assert.strictEqual(res.value[0].systemEvent, undefined);
			assert.strictEqual(res.value[0].caseReference, undefined);
			assert.strictEqual(res.value[0].eventType, undefined);
		});

		it('listAllUserCalendarEvents applies extension metadata across events', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => ({
				value: [
					{
						[ODATA.TYPE]: ODATA.EVENT_TYPE,
						id: 'evt-3',
						subject: 'Paged Event 1',
						start: { dateTime: '2025-09-11T09:00:00.000Z', timeZone: 'UTC' },
						end: { dateTime: '2025-09-11T10:00:00.000Z', timeZone: 'UTC' },
						extensions: [{ id: EXTENSION_ID, extensionName: 'pinsExt', caseReference: '6900216', eventType: 'Inquiry' }]
					},
					{
						[ODATA.TYPE]: ODATA.EVENT_TYPE,
						id: 'evt-4',
						subject: 'Paged Event 2 - No CaseRef',
						start: { dateTime: '2025-09-11T11:00:00.000Z', timeZone: 'UTC' },
						end: { dateTime: '2025-09-11T12:00:00.000Z', timeZone: 'UTC' },
						extensions: [{ id: EXTENSION_ID, extensionName: 'pinsExt', eventType: 'SiteVisit' }]
					},
					{
						[ODATA.TYPE]: ODATA.EVENT_TYPE,
						id: 'evt-5',
						subject: 'Paged Event 3 - No Extension',
						start: { dateTime: '2025-09-11T13:00:00.000Z', timeZone: 'UTC' },
						end: { dateTime: '2025-09-11T14:00:00.000Z', timeZone: 'UTC' }
					}
				]
			}));
			const entra = new EntraClient(client);
			const events = await entra.listAllUserCalendarEvents('user-1', {
				calendarEventsDayRange: 1,
				calendarEventsFromDateOffset: 0
			});
			const evt3 = events.find((e) => e.id === 'evt-3');
			const evt4 = events.find((e) => e.id === 'evt-4');
			const evt5 = events.find((e) => e.id === 'evt-5');
			assert.ok(evt3 && evt4 && evt5);
			assert.strictEqual(evt3.systemEvent, true);
			assert.strictEqual(evt3.caseReference, '6900216');
			assert.strictEqual(evt3.eventType, 'Inquiry');
			assert.strictEqual(evt4.systemEvent, true);
			assert.strictEqual(evt4.caseReference, undefined);
			assert.strictEqual(evt4.eventType, 'SiteVisit');
			assert.strictEqual(evt5.systemEvent, undefined);
		});
	});

	describe('extractSkipToken', () => {
		const tests = [
			{
				name: 'empty',
				link: '',
				token: undefined
			},
			{
				name: 'no params',
				link: 'https://example.com',
				token: undefined
			},
			{
				name: 'lowercase',
				link: 'https://example.com/?$skiptoken=some-token-here',
				token: 'some-token-here'
			},
			{
				name: 'title case',
				link: 'https://example.com/?$skipToken=some-token-here',
				token: 'some-token-here'
			}
		];

		for (const test of tests) {
			it(`should handle ${test.name}`, () => {
				const token = EntraClient.extractSkipToken(test.link);
				assert.strictEqual(token, test.token);
			});
		}
	});
});
