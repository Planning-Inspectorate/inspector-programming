import { describe, it, mock, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import {
	generateCalendar,
	generateCalendarGrid,
	generateDatesList,
	generateTimeList,
	generateWeekTitle,
	getSimplifiedEvents,
	getWeekStartDate,
	generateCaseCalendarEvents
} from './calendar.js';

const mockSession = {};

const mockLogger = {
	warn: mock.fn(),
	error: mock.fn()
};

const mockEntraClient = {
	getUserCalendarEvents: mock.fn()
};

const mockInitEntraClient = mock.fn();
mockInitEntraClient.mock.mockImplementation(() => mockEntraClient);

describe('calendar', () => {
	it('should get a list of simplified events', async () => {
		const entraEvents = {
			value: [
				{
					subject: 'Test 1',
					start: {
						dateTime: '2025-08-20T15:00:00.000Z',
						timeZone: 'Europe/London'
					},
					end: {
						dateTime: '2025-08-20T16:00:00.000Z',
						timeZone: 'Europe/London'
					}
				},
				{
					subject: 'Test 2',
					start: {
						dateTime: '2025-08-20T15:10:00.000Z',
						timeZone: 'Europe/London'
					},
					end: {
						dateTime: '2025-08-20T15:50:00.000Z',
						timeZone: 'Europe/London'
					}
				},
				{
					subject: 'Test 3',
					start: {
						dateTime: '2025-08-20T15:30:00.000Z',
						timeZone: 'Europe/London'
					},
					end: {
						dateTime: '2025-08-20T16:30:00.000Z',
						timeZone: 'Europe/London'
					}
				}
			]
		};

		const expectedEvents = [
			{
				subject: 'Test 1',
				startDateTime: '2025-08-20T15:00:00.000Z',
				endDateTime: '2025-08-20T16:00:00.000Z'
			},
			{
				subject: 'Test 2',
				startDateTime: '2025-08-20T15:00:00.000Z',
				endDateTime: '2025-08-20T16:00:00.000Z'
			},
			{
				subject: 'Test 3',
				startDateTime: '2025-08-20T15:30:00.000Z',
				endDateTime: '2025-08-20T16:30:00.000Z'
			}
		];
		const selectedInspector = 'inspector';

		mockEntraClient.getUserCalendarEvents.mock.mockImplementationOnce(() => entraEvents);
		const events = await getSimplifiedEvents(mockInitEntraClient, selectedInspector, mockSession, mockLogger);
		assert.deepStrictEqual(events, expectedEvents);
	});

	it('should get date of the first day of the current week', () => {
		const date = new Date(2025, 7, 10);
		const expectedDate = new Date(2025, 7, 4, 0, 0, 0, 0).toUTCString();
		const startDate = getWeekStartDate(date).toUTCString();

		assert.deepStrictEqual(startDate, expectedDate);
	});

	it('should generate week title when start date and end date are in the same month', () => {
		const startDate = new Date(2025, 7, 4, 0, 0, 0, 0);
		const expectedWeekTitle = '04 - 10 August, 2025';
		const weekTitle = generateWeekTitle(startDate);
		assert.strictEqual(weekTitle, expectedWeekTitle);
	});

	it('should generate week title when start date and end date are in different months', () => {
		const startDate = new Date(2025, 8, 29, 0, 0, 0, 0);
		const expectedWeekTitle = '29 September - 05 October, 2025';
		const weekTitle = generateWeekTitle(startDate);
		assert.strictEqual(weekTitle, expectedWeekTitle);
	});

	it('should generate week title when start date and end date are in different years', () => {
		const startDate = new Date(2025, 11, 29, 0, 0, 0, 0);
		const expectedWeekTitle = '29 December, 2025 - 04 January, 2026';
		const weekTitle = generateWeekTitle(startDate);
		assert.strictEqual(weekTitle, expectedWeekTitle);
	});

	it('should generate dates list of current week', () => {
		const startDate = new Date(2025, 7, 4, 0, 0, 0, 0);
		const expectedDatesList = ['04 Mon', '05 Tue', '06 Wed', '07 Thu', '08 Fri', '09 Sat', '10 Sun'];
		const dateList = generateDatesList(startDate);
		assert.deepStrictEqual(dateList, expectedDatesList);
	});

	it('should generate hourly time list between two times', () => {
		const expectedTimeList = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00'];
		const timeList = generateTimeList(7, 14);
		assert.deepStrictEqual(timeList, expectedTimeList);
	});

	it('should generate calendar grid', () => {
		const expectedCalendarGrid = [
			[
				{ text: '', isEvent: false, isToday: false },
				{ text: '', isEvent: false, isToday: false },
				{ text: '', isEvent: false, isToday: false }
			],
			[
				{ text: '', isEvent: false, isToday: false },
				{ text: '', isEvent: false, isToday: false },
				{ text: '', isEvent: false, isToday: false }
			]
		];
		const calendarGrid = generateCalendarGrid(3, 2);
		assert.deepStrictEqual(calendarGrid, expectedCalendarGrid);
	});

	it('should generate default calendar when there are no events and does not show current date', () => {
		const expectedCalendar = generateCalendarGrid(7, 20);
		const startDate = new Date(2025, 7, 4, 0, 0, 0, 0);
		const calendar = generateCalendar(startDate, null);
		assert.deepStrictEqual(calendar, expectedCalendar);
	});

	it('should generate calendar with cells that are marked today', () => {
		const startDate = new Date();
		startDate.setHours(0, 0, 0, 0);
		const dayIndex = startDate.getDay() - 1 != -1 ? startDate.getDay() - 1 : 6;

		const calendar = generateCalendar(startDate, null);
		for (let i = 0; i < 20; i++) {
			assert.deepStrictEqual(calendar[i][dayIndex], { text: '', isEvent: false, isToday: true });
		}
	});

	it('should generate celendar with cells that are marked as events', () => {
		const events = [
			{
				subject: 'Test 1',
				startDateTime: '2025-08-04T09:00:00.000Z',
				endDateTime: '2025-08-04T09:30:00.000Z'
			},
			{
				subject: 'Test 2',
				startDateTime: '2025-08-05T10:30:00.000Z',
				endDateTime: '2025-08-05T11:00:00.000Z'
			},
			{
				subject: 'Test 3',
				startDateTime: '2025-08-06T12:00:00.000Z',
				endDateTime: '2025-08-06T13:00:00.000Z'
			},
			{
				subject: 'Test 4',
				startDateTime: '2025-08-07T13:30:00.000Z',
				endDateTime: '2025-08-07T14:30:00.000Z'
			},
			{
				subject: 'Test 5',
				startDateTime: '2025-08-08T15:00:00.000Z',
				endDateTime: '2025-08-08T16:30:00.000Z'
			}
		];

		const expectedCalendarData = [
			{
				row: 2,
				day: 0,
				event: { text: 'Test 1', isEvent: true, isToday: false }
			},
			{
				row: 5,
				day: 1,
				event: { text: 'Test 2', isEvent: true, isToday: false }
			},
			{
				row: 8,
				day: 2,
				event: { text: 'Test 3', isEvent: true, isToday: false }
			},
			{
				row: 9,
				day: 2,
				event: { text: '', isEvent: true, isToday: false }
			},
			{
				row: 11,
				day: 3,
				event: { text: 'Test 4', isEvent: true, isToday: false }
			},
			{
				row: 12,
				day: 3,
				event: { text: '', isEvent: true, isToday: false }
			},
			{
				row: 14,
				day: 4,
				event: { text: 'Test 5', isEvent: true, isToday: false }
			},
			{
				row: 15,
				day: 4,
				event: { text: '', isEvent: true, isToday: false }
			},
			{
				row: 16,
				day: 4,
				event: { text: '', isEvent: true, isToday: false }
			}
		];

		const startDate = new Date(2025, 7, 4, 0, 0, 0, 0);
		const calendar = generateCalendar(startDate, events);

		const timezoneOffset = -Math.floor(new Date().getTimezoneOffset() / 30);

		expectedCalendarData.forEach((item) => {
			assert.deepStrictEqual(calendar[item.row + timezoneOffset][item.day], item.event);
		});
	});

	it('should generate default calendar when the events are not scheduled for the current week', () => {
		const events = [
			{
				subject: 'Test 1',
				startDateTime: '2025-08-04T09:00:00.000Z',
				endDateTime: '2025-08-04T09:30:00.000Z'
			},
			{
				subject: 'Test 2',
				startDateTime: '2025-08-05T10:30:00.000Z',
				endDateTime: '2025-08-05T11:00:00.000Z'
			},
			{
				subject: 'Test 3',
				startDateTime: '2025-08-06T12:00:00.000Z',
				endDateTime: '2025-08-06T13:00:00.000Z'
			},
			{
				subject: 'Test 4',
				startDateTime: '2025-08-07T13:30:00.000Z',
				endDateTime: '2025-08-07T14:30:00.000Z'
			},
			{
				subject: 'Test 5',
				startDateTime: '2025-08-08T15:00:00.000Z',
				endDateTime: '2025-08-08T16:30:00.000Z'
			}
		];

		const expectedCalendar = generateCalendarGrid(7, 20);
		const startDate = new Date(2025, 6, 28, 0, 0, 0, 0);
		const calendar = generateCalendar(startDate, events);
		assert.deepStrictEqual(calendar, expectedCalendar);
	});
	describe('generateCaseCalendarEvents', () => {
		beforeEach(() => {
			mockCasesClient.getCaseById.mock.resetCalls();
			mockCalendarClient.getAllCalendarEventTimingRules.mock.resetCalls();
		});
		const mockCalendarClient = {
			getAllCalendarEventTimingRules: mock.fn()
		};
		//two rules to choose from
		const mockTimingRules = [
			{
				id: 1,
				caseType: 'H',
				caseProcedure: 'W',
				allocationLevel: 'B',
				CalendarEventTiming: { prepTime: 2.5, siteVisitTime: 3, reportTime: 2.5, costsTime: 1 }
			},
			{
				id: 2,
				caseType: 'D',
				caseProcedure: 'W',
				allocationLevel: 'C',
				CalendarEventTiming: { prepTime: 3, siteVisitTime: 4, reportTime: 3, costsTime: 0.5 }
			}
		];
		mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementation(() => mockTimingRules);
		const mockCasesClient = {
			getCaseById: mock.fn()
		};
		//one case fetched (unless overridden in test)
		const appeal = { caseId: 'caseId', caseType: 'H', caseProcedure: 'W', caseLevel: 'B' };
		mockCasesClient.getCaseById.mock.mockImplementation(() => appeal);
		const mockService = () => {
			return {
				logger: mockLogger,
				casesClient: mockCasesClient,
				calendarClient: mockCalendarClient
			};
		};
		it('should generate a list of calendar event json objects for a case', async () => {
			const service = mockService();
			const res = await generateCaseCalendarEvents(service, '2025-10-10', [1]);
			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 1);
			assert.strictEqual(res.length, 4);
			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'subject'));
			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'start'));
			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'end'));
			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'location'));
		});
		it('multiple cases should yield multiple sets of json objects', async () => {
			const service = mockService();
			const res = await generateCaseCalendarEvents(service, '2025-10-10', [1, 2, 3]);
			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 3);
			assert.strictEqual(res.length, 12);
			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'subject'));
			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'start'));
			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'end'));
			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'location'));
			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'extensions'));
		});
		it('no case details found for caseId should error', async () => {
			mockCasesClient.getCaseById.mock.mockImplementationOnce(() => undefined);
			const service = mockService();
			await assert.rejects(generateCaseCalendarEvents(service, '2025-10-10', [1, 2, 3]), {
				message: 'Case details could not be fetched for case: 1'
			});
			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 1);
		});
		it('no timing rule matching case details should error', async () => {
			const appeal = { caseId: 'caseId', caseType: 'A', caseProcedure: 'P', caseLevel: 'B' };
			mockCasesClient.getCaseById.mock.mockImplementationOnce(() => appeal);
			const service = mockService();
			await assert.rejects(generateCaseCalendarEvents(service, '2025-10-10', [1, 2, 3]), {
				message: 'No timing rules matching case: 1'
			});
			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 1);
		});
		it('calendar event extensions should only submit those that are provided', async () => {
			const service = mockService();
			const res = await generateCaseCalendarEvents(service, '2025-10-10', [1]);
			assert.strictEqual(res.length, 4);
			assert.strictEqual(res[0].extensions[0]['@odata.type'], 'microsoft.graph.openTypeExtension');
			assert.strictEqual(res[0].extensions[0].extensionName, 'uk.gov.planninginspectorate.programming');
			assert.ok(Object.prototype.hasOwnProperty.call(res[0].extensions[0], 'eventType'));
		});
	});
});
