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
			get: mock.fn(() => ({ value: [] })),
			post: mock.fn()
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

		it('should use provided startDate and endDate', async () => {
			const client = mockClient();
			client.query = mock.fn(() => client);
			client.get.mock.mockImplementation(() => ({ value: [] }));

			const entra = new EntraClient(client);
			const startDate = new Date('2025-11-04T00:00:00.000Z');
			const endDate = new Date('2025-11-11T23:59:59.999Z');

			await entra.getUserCalendarEvents('userId', false, startDate, endDate);

			const queryParams = client.query.mock.calls[0].arguments[0];
			assert.strictEqual(queryParams.startDateTime, startDate.toISOString());
			assert.strictEqual(queryParams.endDateTime, endDate.toISOString());
		});

		it('should calculate default 7 day range when no dates provided', async (ctx) => {
			ctx.mock.timers.enable({
				apis: ['Date'],
				now: new Date('2023-10-02T12:00:00Z')
			});

			const client = mockClient();
			client.query = mock.fn(() => client);
			client.get.mock.mockImplementation(() => ({ value: [] }));
			const entra = new EntraClient(client);
			await entra.getUserCalendarEvents('userId');
			const queryParams = client.query.mock.calls[0].arguments[0];
			const start = new Date(queryParams.startDateTime);
			const end = new Date(queryParams.endDateTime);
			const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
			assert.strictEqual(start.getDay(), 1);
			assert.strictEqual(daysDiff, 6);
		});

		it('should calculate endDate when only startDate provided', async () => {
			const client = mockClient();
			client.query = mock.fn(() => client);
			client.get.mock.mockImplementation(() => ({ value: [] }));
			const entra = new EntraClient(client);
			const startDate = new Date('2025-11-04T00:00:00.000Z');
			await entra.getUserCalendarEvents('userId', false, startDate, null);
			const queryParams = client.query.mock.calls[0].arguments[0];
			assert.strictEqual(queryParams.endDateTime, '2025-11-10T23:59:59.999Z');
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
	describe('Event with extension', () => {
		it('should return events with extensions', async () => {
			const client = mockClient();
			client.get.mock.mockImplementation(() => {
				return {
					value: [
						{
							[ODATA.TYPE]: ODATA.EVENT_TYPE,
							id: 'id1',
							subject: 'System Event with Extension',
							start: { dateTime: '2025-08-13T14:00:00.0000000', timeZone: 'UTC' },
							end: { dateTime: '2025-08-15T14:00:00.0000000', timeZone: 'UTC' },
							singleValueExtendedProperties: [
								{
									id: EXTENSION_ID,
									value: JSON.stringify({
										caseReference: '6900216',
										eventType: 'HEARING'
									})
								}
							]
						},
						{
							[ODATA.TYPE]: ODATA.EVENT_TYPE,
							id: 'id2',
							subject: 'Regular Event without Extension',
							start: { dateTime: '2025-08-14T10:00:00.0000000', timeZone: 'UTC' },
							end: { dateTime: '2025-08-14T11:00:00.0000000', timeZone: 'UTC' }
						}
					]
				};
			});
			const entra = new EntraClient(client);
			const events = await entra.listAllUserCalendarEvents('testGroup', {
				calendarEventsDayRange: 3,
				calendarEventsFromDateOffset: 0
			});
			assert.strictEqual(client.get.mock.callCount(), 1);
			assert.strictEqual(events.length, 2);

			// Check event with extension
			const systemEvent = events.find((e) => e.id === 'id1');
			assert.ok(systemEvent);
			assert.ok(Array.isArray(systemEvent.singleValueExtendedProperties));
			assert.strictEqual(systemEvent.singleValueExtendedProperties.length, 1);
			assert.match(systemEvent.singleValueExtendedProperties[0].value, /6900216/);
			assert.match(systemEvent.singleValueExtendedProperties[0].value, /HEARING/);

			// Check event without extension
			const regularEvent = events.find((e) => e.id === 'id2');
			assert.ok(regularEvent);
			assert.strictEqual(regularEvent.singleValueExtendedProperties, undefined);
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

	describe('createCalendarEvent', () => {
		it('should create events via api', async () => {
			const client = mockClient();
			const entra = new EntraClient(client);

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

			await entra.createCalendarEvent(event1, 'userId');
			assert.deepStrictEqual(client.post.mock.calls[0].arguments[0], event1);
		});
	});
});
