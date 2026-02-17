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
	generateCaseCalendarEvents,
	submitCalendarEvents
} from './calendar.js';
import { EXTENSION_ID } from '@pins/inspector-programming-lib/graph/entra.js';
import { fromZonedTime } from 'date-fns-tz';

const timeZoneName = 'Europe/London';

const mockSession = {};

const mockLogger = {
	warn: mock.fn(),
	error: mock.fn()
};

const mockEntraClient = {
	getUserCalendarEvents: mock.fn(),
	createCalendarEvents: mock.fn()
};

const mockInitEntraClient = mock.fn();
mockInitEntraClient.mock.mockImplementation(() => mockEntraClient);

beforeEach(() => {
	mockLogger.error.mock.resetCalls();
	mockEntraClient.createCalendarEvents.mock.resetCalls();
});

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
					},
					location: {
						displayName: 'display name 1',
						address: {
							street: 'street 1',
							city: 'city 1',
							state: 'state 1',
							countyOrRegion: 'country 1',
							postalCode: 'post code 1'
						}
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
					},
					location: {
						displayName: 'display name 2',
						address: {
							street: undefined,
							city: undefined,
							state: undefined,
							countyOrRegion: undefined,
							postalCode: undefined
						}
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
					},
					location: {
						displayName: ''
					}
				}
			]
		};

		const expectedEvents = [
			{
				subject: 'Test 1',
				startDateTime: '2025-08-20T15:00:00.000Z',
				endDateTime: '2025-08-20T16:00:00.000Z',
				status: '',
				location: '',
				address: 'street 1 city 1 state 1 country 1 post code 1'
			},
			{
				subject: 'Test 2',
				startDateTime: '2025-08-20T15:00:00.000Z',
				endDateTime: '2025-08-20T16:00:00.000Z',
				status: '',
				location: 'display name 2',
				address: ''
			},
			{
				subject: 'Test 3',
				startDateTime: '2025-08-20T15:30:00.000Z',
				endDateTime: '2025-08-20T16:30:00.000Z',
				status: '',
				location: '',
				address: ''
			}
		];
		const selectedInspector = 'inspector';

		mockEntraClient.getUserCalendarEvents.mock.mockImplementationOnce(() => entraEvents);
		const events = await getSimplifiedEvents(mockInitEntraClient, selectedInspector, mockSession, mockLogger);
		assert.deepStrictEqual(events, expectedEvents);
	});

	it('should confine all day event to work hours', async () => {
		const startDate = new Date(2025, 7, 4, 7, 0, 0, 0).toUTCString();
		const endDate = new Date(2025, 7, 4, 23, 0, 0, 0).toUTCString();
		const expectedStartDate = new Date(2025, 7, 4, 8, 0, 0, 0).toISOString();
		const expectedEndDate = new Date(2025, 7, 4, 18, 0, 0, 0).toISOString();

		const entraEvents = {
			value: [
				{
					subject: 'Test 1',
					start: {
						dateTime: startDate,
						timeZone: 'Europe/London'
					},
					end: {
						dateTime: endDate,
						timeZone: 'Europe/London'
					},
					location: {
						displayName: 'display name 1',
						address: {
							street: 'street 1',
							city: 'city 1',
							state: 'state 1',
							countyOrRegion: 'country 1',
							postalCode: 'post code 1'
						}
					},
					isAllDay: true
				}
			]
		};

		const expectedEvents = [
			{
				subject: 'Test 1',
				startDateTime: expectedStartDate,
				endDateTime: expectedEndDate,
				status: '',
				location: '',
				address: 'street 1 city 1 state 1 country 1 post code 1'
			}
		];

		const selectedInspector = 'inspector';
		mockEntraClient.getUserCalendarEvents.mock.mockImplementationOnce(() => entraEvents);
		const events = await getSimplifiedEvents(mockInitEntraClient, selectedInspector, mockSession, mockLogger);
		assert.deepStrictEqual(events, expectedEvents);
	});

	it('should confine events that start before the work day to work hours', async () => {
		const startDate = new Date(2025, 7, 4, 7, 0, 0, 0).toUTCString();
		const endDate = new Date(2025, 7, 4, 9, 0, 0, 0).toUTCString();
		const expectedStartDate = new Date(2025, 7, 4, 8, 0, 0, 0).toISOString();
		const expectedEndDate = new Date(2025, 7, 4, 9, 0, 0, 0).toISOString();

		const entraEvents = {
			value: [
				{
					subject: 'Test 1',
					start: {
						dateTime: startDate,
						timeZone: 'Europe/London'
					},
					end: {
						dateTime: endDate,
						timeZone: 'Europe/London'
					},
					location: {
						displayName: 'display name 1',
						address: {
							street: 'street 1',
							city: 'city 1',
							state: 'state 1',
							countyOrRegion: 'country 1',
							postalCode: 'post code 1'
						}
					}
				}
			]
		};

		const expectedEvents = [
			{
				subject: 'Test 1',
				startDateTime: expectedStartDate,
				endDateTime: expectedEndDate,
				status: '',
				location: '',
				address: 'street 1 city 1 state 1 country 1 post code 1'
			}
		];

		const selectedInspector = 'inspector';
		mockEntraClient.getUserCalendarEvents.mock.mockImplementationOnce(() => entraEvents);
		const events = await getSimplifiedEvents(mockInitEntraClient, selectedInspector, mockSession, mockLogger);
		assert.deepStrictEqual(events, expectedEvents);
	});

	it('should confine events that end after the work day to work hours', async () => {
		const startDate = new Date(2025, 7, 4, 15, 0, 0, 0).toUTCString();
		const endDate = new Date(2025, 7, 4, 23, 0, 0, 0).toUTCString();
		const expectedStartDate = new Date(2025, 7, 4, 15, 0, 0, 0).toISOString();
		const expectedEndDate = new Date(2025, 7, 4, 18, 0, 0, 0).toISOString();

		const entraEvents = {
			value: [
				{
					subject: 'Test 1',
					start: {
						dateTime: startDate,
						timeZone: 'Europe/London'
					},
					end: {
						dateTime: endDate,
						timeZone: 'Europe/London'
					},
					location: {
						displayName: 'display name 1',
						address: {
							street: 'street 1',
							city: 'city 1',
							state: 'state 1',
							countyOrRegion: 'country 1',
							postalCode: 'post code 1'
						}
					}
				}
			]
		};

		const expectedEvents = [
			{
				subject: 'Test 1',
				startDateTime: expectedStartDate,
				endDateTime: expectedEndDate,
				status: '',
				location: '',
				address: 'street 1 city 1 state 1 country 1 post code 1'
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
				{ text: '', isEvent: false, isToday: false, status: '', location: '', address: '' },
				{ text: '', isEvent: false, isToday: false, status: '', location: '', address: '' },
				{ text: '', isEvent: false, isToday: false, status: '', location: '', address: '' }
			],
			[
				{ text: '', isEvent: false, isToday: false, status: '', location: '', address: '' },
				{ text: '', isEvent: false, isToday: false, status: '', location: '', address: '' },
				{ text: '', isEvent: false, isToday: false, status: '', location: '', address: '' }
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
			assert.deepStrictEqual(calendar[i][dayIndex], {
				text: '',
				isEvent: false,
				isToday: true,
				status: '',
				location: '',
				address: ''
			});
		}
	});

	it('should generate celendar with cells that are marked as events', () => {
		const events = [
			{
				subject: 'Test 1',
				startDateTime: '2025-08-04T09:00:00.000Z',
				endDateTime: '2025-08-04T09:30:00.000Z',
				status: 'free',
				location: 'location 1'
			},
			{
				subject: 'Test 2',
				startDateTime: '2025-08-05T10:30:00.000Z',
				endDateTime: '2025-08-05T11:00:00.000Z',
				status: 'oof'
			},
			{
				subject: 'Test 3',
				startDateTime: '2025-08-06T12:00:00.000Z',
				endDateTime: '2025-08-06T13:00:00.000Z',
				status: 'busy',
				address: 'address 3'
			},
			{
				subject: 'Test 4',
				startDateTime: '2025-08-07T13:30:00.000Z',
				endDateTime: '2025-08-07T14:30:00.000Z',
				status: 'tentative',
				location: 'location 4'
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
				event: { text: 'Test 1', isEvent: true, isToday: false, status: 'free', location: 'location 1', address: '' }
			},
			{
				row: 5,
				day: 1,
				event: { text: 'Test 2', isEvent: true, isToday: false, status: 'oof', location: undefined, address: '' }
			},
			{
				row: 8,
				day: 2,
				event: { text: 'Test 3', isEvent: true, isToday: false, status: 'busy', location: undefined, address: '' }
			},
			{
				row: 9,
				day: 2,
				event: { text: '', isEvent: true, isToday: false, status: 'busy', location: '', address: 'address 3' }
			},
			{
				row: 11,
				day: 3,
				event: {
					text: 'Test 4',
					isEvent: true,
					isToday: false,
					status: 'tentative',
					location: 'location 4',
					address: ''
				}
			},
			{
				row: 12,
				day: 3,
				event: { text: '', isEvent: true, isToday: false, status: 'tentative', location: '', address: undefined }
			},
			{
				row: 14,
				day: 4,
				event: { text: 'Test 5', isEvent: true, isToday: false, status: undefined, location: undefined, address: '' }
			},
			{
				row: 15,
				day: 4,
				event: { text: '', isEvent: true, isToday: false, status: undefined, location: '', address: undefined }
			},
			{
				row: 16,
				day: 4,
				event: { text: '', isEvent: true, isToday: false, status: undefined, location: '', address: '' }
			}
		];

		const startDate = new Date(2025, 7, 4, 0, 0, 0, 0);
		const calendar = generateCalendar(startDate, events);

		const timezoneOffset = -Math.floor(startDate.getTimezoneOffset() / 30);

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
			mockCalendarClient.getAllCalendarEventTimingRules.mock.resetCalls();
			mockCalendarClient.getEnglandWalesBankHolidays.mock.resetCalls();
		});
		//setup mock clients
		const mockCalendarClient = {
			getAllCalendarEventTimingRules: mock.fn(),
			getEnglandWalesBankHolidays: mock.fn()
		};
		const mockService = () => {
			return {
				logger: mockLogger,
				calendarClient: mockCalendarClient
			};
		};

		//mock data responses
		const mockTimingRules = [
			{
				id: 1,
				caseType: 'H',
				caseProcedure: 'W',
				allocationLevel: 'B',
				CalendarEventTiming: { prepTime: 2, siteVisitTime: 3, reportTime: 2, costsTime: 1 }
			},
			{
				id: 2,
				caseType: 'D',
				caseProcedure: 'W',
				allocationLevel: 'C',
				CalendarEventTiming: { prepTime: 3, siteVisitTime: 4, reportTime: 3, costsTime: 1 }
			}
		];
		//one case fetched (unless overridden in test)
		const appeal = {
			caseId: 'caseId',
			caseReference: 'ref1',
			lpaName: 'test-lpa',
			caseType: 'H',
			caseProcedure: 'W',
			caseLevel: 'B'
		};

		//mock implementations
		mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementation(() => mockTimingRules);
		mockCalendarClient.getEnglandWalesBankHolidays.mock.mockImplementation(() => []);

		//testing vars
		const requiredProps = (/** @type {any} */ row) => {
			['subject', 'start', 'end', 'location'].forEach((prop) => {
				assert.ok(Object.hasOwn(row, prop));
			});
		};

		/**
		 *
		 * @param {any} row1
		 * @param {any} row2
		 * @param {any} row3
		 * @param {any} row4
		 */
		const requiredStages = (row1, row2, row3, row4) => {
			assert.ok(row1.subject.includes('prep'));
			assert.ok(row2.subject.includes('siteVisit'));
			assert.ok(row3.subject.includes('report'));
			assert.ok(row4.subject.includes('costs'));
		};

		/**
		 * Values given will be interpreted in Europe/London
		 *
		 * @param {import('@pins/inspector-programming-lib/graph/types.js').CalendarEventInput} event
		 * @param {number} monthIndex - 0-indexed month
		 * @param {number} date
		 * @param {number} start
		 * @param {number} end
		 */
		function assertEventDates(event, monthIndex, date, start, end) {
			assertEventDate(event.start.dateTime, 2025, monthIndex, date, start);
			assertEventDate(event.end.dateTime, 2025, monthIndex, date, end);
		}

		/**
		 * @param {string} dateTime
		 * @param {number} year
		 * @param {number} monthIndex
		 * @param {number} date
		 * @param {number} hours
		 */
		function assertEventDate(dateTime, year, monthIndex, date, hours) {
			const expected = fromZonedTime(new Date(year, monthIndex, date, hours), timeZoneName).toISOString();
			assert.strictEqual(new Date(dateTime).toISOString(), expected);
		}

		it('should generate a list of calendar event json objects for a case', async () => {
			const service = mockService();
			const res = await generateCaseCalendarEvents(service, '2025-10-08', [appeal]);

			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			assert.strictEqual(res.length, 4);

			requiredProps(res[0]);
			requiredStages(res[0], res[1], res[2], res[3]);

			//check correct time allocation
			assertEventDates(res[0], 9, 7, 9, 11);
			assertEventDates(res[1], 9, 8, 9, 12);
			assertEventDates(res[2], 9, 9, 9, 11);
			assertEventDates(res[3], 9, 10, 9, 10);
		});
		it('multiple cases should yield multiple sets of json objects', async () => {
			const service = mockService();
			const res = await generateCaseCalendarEvents(service, '2025-10-08', [appeal, appeal, appeal]);
			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			assert.strictEqual(res.length, 12);

			const [case1, case2, case3] = [
				{ prep: res[0], siteVisit: res[3], report: res[6], costs: res[9] },
				{ prep: res[1], siteVisit: res[4], report: res[7], costs: res[10] },
				{ prep: res[2], siteVisit: res[5], report: res[8], costs: res[11] }
			];

			requiredProps(case1.prep);
			//ensure multiple instances of each stage in correct order
			requiredStages(case1.prep, case1.siteVisit, case1.report, case1.costs);
			requiredStages(case2.prep, case2.siteVisit, case2.report, case2.costs);
			requiredStages(case3.prep, case3.siteVisit, case3.report, case3.costs);

			assert.ok(Object.prototype.hasOwnProperty.call(res[0], 'singleValueExtendedProperties'));
		});
		it('calendar event extensions should only submit those that are provided', async () => {
			const service = mockService();
			const res = await generateCaseCalendarEvents(service, '2025-10-10', [appeal]);
			assert.strictEqual(res.length, 4);
			assert.strictEqual(res[0].singleValueExtendedProperties[0].id, EXTENSION_ID);
			assert.ok(Object.hasOwn(res[0].singleValueExtendedProperties[0], 'value'));
		});
		describe('error cases', () => {
			it('no timing rule matching case details should error', async () => {
				const appeal = { caseId: '1', caseType: 'A', caseProcedure: 'P', caseLevel: 'B' };
				const service = mockService();
				await assert.rejects(generateCaseCalendarEvents(service, '2025-10-10', [appeal]), {
					message: 'No timing rules matching case: 1'
				});
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			});
		});
		describe('handling events over weekends or bank holidays', () => {
			it('setting the assignment date to a Monday will generate the prep event on the prior Friday', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-22', [appeal]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assertEventDates(res[0], 8, 19, 9, 11);
				// 20th and 21st skipped - weekend
				assertEventDates(res[1], 8, 22, 9, 12);
				assertEventDates(res[2], 8, 23, 9, 11);
				assertEventDates(res[3], 8, 24, 9, 10);
			});
			it('setting the assignment date to a Sunday will generate the prep event on the prior Friday and increment all other days by 1', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-21', [appeal]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assertEventDates(res[0], 8, 19, 9, 11);
				// 20th and 21st skipped - weekend
				assertEventDates(res[1], 8, 22, 9, 12);
				assertEventDates(res[2], 8, 23, 9, 11);
				assertEventDates(res[3], 8, 24, 9, 10);
			});
			it('setting the assignment date to a Saturday will generate the prep event on the prior Friday and increment all other days by 2', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-20', [appeal]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assertEventDates(res[0], 8, 19, 9, 11);
				// 20th and 21st skipped - weekend
				assertEventDates(res[1], 8, 22, 9, 12);
				assertEventDates(res[2], 8, 23, 9, 11);
				assertEventDates(res[3], 8, 24, 9, 10);
			});
			it('setting the assignment date to a Friday will offload report and costs stages onto the next week', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-19', [appeal]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assertEventDates(res[0], 8, 18, 9, 11);
				assertEventDates(res[1], 8, 19, 9, 12);
				// 20th and 21st skipped - weekend
				assertEventDates(res[2], 8, 22, 9, 11);
				assertEventDates(res[3], 8, 23, 9, 10);
			});
			it('setting the assignment date to a Thursday will offload costs stage onto the next week', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-18', [appeal]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assertEventDates(res[0], 8, 17, 9, 11);
				assertEventDates(res[1], 8, 18, 9, 12);
				assertEventDates(res[2], 8, 19, 9, 11);
				// 20th and 21st skipped - weekend
				assertEventDates(res[3], 8, 22, 9, 10);
			});
			it('bank holidays should be accounted for when allocating events', async () => {
				mockCalendarClient.getEnglandWalesBankHolidays.mock.mockImplementationOnce(() => ['2025-09-29']);

				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-25', [appeal]);
				assert.strictEqual(mockCalendarClient.getEnglandWalesBankHolidays.mock.callCount(), 1);
				assert.strictEqual(res.length, 4);

				const case1 = { prep: res[0], siteVisit: res[1], report: res[2], costs: res[3] };

				requiredProps(case1.report);
				requiredStages(case1.prep, case1.siteVisit, case1.report, case1.costs);

				assertEventDates(case1.prep, 8, 24, 9, 11);
				assertEventDates(case1.siteVisit, 8, 25, 9, 12);
				assertEventDates(case1.report, 8, 26, 9, 11);
				// 27th and 28th skipped - weekend
				// 29th skipped - mocked bank holiday
				assertEventDates(case1.costs, 8, 30, 9, 10);
			});
			it('bank holidays should be accounted for when allocating events for multiple cases', async () => {
				mockCalendarClient.getEnglandWalesBankHolidays.mock.mockImplementationOnce(() => ['2025-09-29']);

				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-26', [appeal, appeal, appeal]);
				assert.strictEqual(mockCalendarClient.getEnglandWalesBankHolidays.mock.callCount(), 1);
				assert.strictEqual(res.length, 12);

				const [case1, case2, case3] = [
					{ prep: res[0], siteVisit: res[3], report: res[6], costs: res[9] },
					{ prep: res[1], siteVisit: res[4], report: res[7], costs: res[10] },
					{ prep: res[2], siteVisit: res[5], report: res[8], costs: res[11] }
				];

				assertEventDates(case1.prep, 8, 25, 9, 11);
				assertEventDates(case2.prep, 8, 25, 11, 13);
				assertEventDates(case3.prep, 8, 25, 13, 15);
				assertEventDates(case1.siteVisit, 8, 26, 9, 12);
				assertEventDates(case2.siteVisit, 8, 26, 12, 15);
				// 27th and 28th skipped - weekend
				// 29th skipped - mocked bank holiday
				assertEventDates(case3.siteVisit, 8, 30, 9, 12);
				assertEventDates(case1.report, 9, 1, 9, 11);
				assertEventDates(case2.report, 9, 1, 11, 13);
				assertEventDates(case3.report, 9, 1, 13, 15);
				assertEventDates(case1.costs, 9, 2, 9, 10);
				assertEventDates(case2.costs, 9, 2, 10, 11);
				assertEventDates(case3.costs, 9, 2, 11, 12);
			});
		});
		describe('allocating events with respect to existing events', () => {
			it("multiple cases' events should be allocated around one another, back to back on the correct days", async () => {
				//three 3h events back to back exceeds 8 hour limit
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 2, siteVisitTime: 2, reportTime: 1, costsTime: 1 }
						}
					];
				});
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [appeal, appeal, appeal]);
				const [case1, case2, case3] = [
					{ prep: res[0], siteVisit: res[3], report: res[6], costs: res[9] },
					{ prep: res[1], siteVisit: res[4], report: res[7], costs: res[10] },
					{ prep: res[2], siteVisit: res[5], report: res[8], costs: res[11] }
				];

				requiredProps(case1.prep);
				requiredStages(case1.prep, case1.siteVisit, case1.report, case1.costs);
				requiredStages(case2.prep, case2.siteVisit, case2.report, case2.costs);
				requiredStages(case3.prep, case3.siteVisit, case3.report, case3.costs);

				//case1
				assertEventDates(case1.prep, 8, 23, 9, 11);
				assertEventDates(case1.siteVisit, 8, 24, 9, 11);
				assertEventDates(case1.report, 8, 25, 9, 10);
				assertEventDates(case1.costs, 8, 26, 9, 10);

				//case2 should come straight after case1
				assertEventDates(case2.prep, 8, 23, 11, 13);
				assertEventDates(case2.siteVisit, 8, 24, 11, 13);
				assertEventDates(case2.report, 8, 25, 10, 11);
				assertEventDates(case2.costs, 8, 26, 10, 11);

				//case3 should come straight after case2
				assertEventDates(case3.prep, 8, 23, 13, 15);
				assertEventDates(case3.siteVisit, 8, 24, 13, 15);
				assertEventDates(case3.report, 8, 25, 11, 12);
				assertEventDates(case3.costs, 8, 26, 11, 12);
			});
		});
		describe('manipulating larger event allocations', () => {
			it('site visit timing rules over 8 hours will be split into chunks of 8 hours and logged individually, wrapping onto next week in required', async () => {
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 4, siteVisitTime: 12, reportTime: 3, costsTime: 2 }
						}
					];
				});
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [appeal]);
				const caseEvents = { prep: res[0], siteVisit1: res[1], siteVisit2: res[2], report: res[3], costs: res[4] };

				requiredProps(caseEvents.prep);
				requiredStages(caseEvents.prep, caseEvents.siteVisit1, caseEvents.report, caseEvents.costs);
				assert.ok(caseEvents.siteVisit1.subject.includes('siteVisit - 8'));
				assert.ok(caseEvents.siteVisit2.subject.includes('siteVisit - 4'));

				assert.strictEqual(res.length, 5);

				assertEventDates(caseEvents.prep, 8, 23, 9, 13);
				assertEventDates(caseEvents.siteVisit1, 8, 24, 9, 17);
				assertEventDates(caseEvents.siteVisit2, 8, 25, 9, 13);
				assertEventDates(caseEvents.report, 8, 26, 9, 12);
				assertEventDates(caseEvents.costs, 8, 29, 9, 11);
			});
			it('report timing rules over 8 hours will be split into chunks of 8 hours and logged individually', async () => {
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 4, siteVisitTime: 6, reportTime: 14, costsTime: 2 }
						}
					];
				});
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [appeal]);
				const caseEvents = { prep: res[0], siteVisit: res[1], report1: res[2], report2: res[3], costs: res[4] };

				requiredProps(caseEvents.prep);
				requiredStages(caseEvents.prep, caseEvents.siteVisit, caseEvents.report1, caseEvents.costs);
				assert.ok(caseEvents.report1.subject.includes('report - 8'));
				assert.ok(caseEvents.report2.subject.includes('report - 6'));

				assert.strictEqual(res.length, 5);

				assertEventDates(caseEvents.prep, 8, 23, 9, 13);
				assertEventDates(caseEvents.siteVisit, 8, 24, 9, 15);
				assertEventDates(caseEvents.report1, 8, 25, 9, 17);
				assertEventDates(caseEvents.report2, 8, 26, 9, 15);
				assertEventDates(caseEvents.costs, 8, 29, 9, 11);
			});
			it('prep timing rules over 8 hours will be split into chunks of 8 hours and logged individually, moving backwards from assignment date as required', async () => {
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 10, siteVisitTime: 3, reportTime: 2, costsTime: 2 }
						}
					];
				});
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [appeal]);
				const caseEvents = { prep1: res[0], prep2: res[1], siteVisit: res[2], report: res[3], costs: res[4] };

				requiredProps(caseEvents.prep1);
				requiredStages(caseEvents.prep1, caseEvents.siteVisit, caseEvents.report, caseEvents.costs);
				assert.ok(caseEvents.prep1.subject.includes('prep - 8'));
				assert.ok(caseEvents.prep2.subject.includes('prep - 2'));

				assert.strictEqual(res.length, 5);

				assertEventDates(caseEvents.prep1, 8, 23, 9, 17);
				assertEventDates(caseEvents.prep2, 8, 22, 9, 11);
				assertEventDates(caseEvents.siteVisit, 8, 24, 9, 12);
				assertEventDates(caseEvents.report, 8, 25, 9, 11);
				assertEventDates(caseEvents.costs, 8, 26, 9, 11);
			});
			it('costs timing rules over 8 hours will be split into chunks of 8 hours. Split events also respect weekends', async () => {
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 2, siteVisitTime: 3, reportTime: 2, costsTime: 16 }
						}
					];
				});
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [appeal]);
				const caseEvents = { prep: res[0], siteVisit: res[1], report: res[2], costs1: res[3], costs2: res[4] };

				requiredProps(caseEvents.prep);
				requiredStages(caseEvents.prep, caseEvents.siteVisit, caseEvents.report, caseEvents.costs1);
				assert.ok(caseEvents.costs1.subject.includes('costs - 8'));
				assert.ok(caseEvents.costs2.subject.includes('costs - 8'));

				assert.strictEqual(res.length, 5);

				assertEventDates(caseEvents.prep, 8, 23, 9, 11);
				assertEventDates(caseEvents.siteVisit, 8, 24, 9, 12);
				assertEventDates(caseEvents.report, 8, 25, 9, 11);
				assertEventDates(caseEvents.costs1, 8, 26, 9, 17);
				assertEventDates(caseEvents.costs2, 8, 29, 9, 17);
			});
			it('handle multiple split events going in both directions, respecting weekends', async () => {
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 12, siteVisitTime: 12, reportTime: 10, costsTime: 2 }
						}
					];
				});
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [appeal]);
				const caseEvents = {
					prep1: res[0],
					prep2: res[1],
					siteVisit1: res[2],
					siteVisit2: res[3],
					report1: res[4],
					report2: res[5],
					costs: res[6]
				};

				requiredProps(caseEvents.prep1);
				requiredStages(caseEvents.prep1, caseEvents.siteVisit1, caseEvents.report1, caseEvents.costs);
				assert.ok(caseEvents.prep1.subject.includes('prep - 8'));
				assert.ok(caseEvents.prep2.subject.includes('prep - 4'));
				assert.ok(caseEvents.siteVisit1.subject.includes('siteVisit - 8'));
				assert.ok(caseEvents.siteVisit2.subject.includes('siteVisit - 4'));
				assert.ok(caseEvents.report1.subject.includes('report - 8'));
				assert.ok(caseEvents.report2.subject.includes('report - 2'));

				assert.strictEqual(res.length, 7);

				assertEventDates(caseEvents.prep1, 8, 23, 9, 17);
				assertEventDates(caseEvents.prep2, 8, 22, 9, 13);
				assertEventDates(caseEvents.siteVisit1, 8, 24, 9, 17);
				assertEventDates(caseEvents.siteVisit2, 8, 25, 9, 13);
				assertEventDates(caseEvents.report1, 8, 26, 9, 17);
				assertEventDates(caseEvents.report2, 8, 29, 9, 11);
				assertEventDates(caseEvents.costs, 8, 30, 9, 11);
			});
			it('handle multiple cases with split events', async () => {
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 4, siteVisitTime: 12, reportTime: 4, costsTime: 2 }
						}
					];
				});
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-10', [appeal, appeal, appeal]);
				const [case1, case2, case3] = [
					{ prep: res[0], siteVisit1: res[3], siteVisit2: res[4], report: res[9], costs: res[12] },
					{ prep: res[1], siteVisit1: res[5], siteVisit2: res[6], report: res[10], costs: res[13] },
					{ prep: res[2], siteVisit1: res[7], siteVisit2: res[8], report: res[11], costs: res[14] }
				];

				requiredProps(case1.siteVisit1);
				requiredProps(case2.report);
				requiredProps(case3.costs);

				assert.ok(case1.siteVisit1.subject.includes('siteVisit - 8'));
				assert.ok(case1.siteVisit2.subject.includes('siteVisit - 4'));
				assert.ok(case2.siteVisit1.subject.includes('siteVisit - 8'));
				assert.ok(case2.siteVisit2.subject.includes('siteVisit - 4'));
				assert.ok(case3.siteVisit1.subject.includes('siteVisit - 8'));
				assert.ok(case3.siteVisit2.subject.includes('siteVisit - 4'));

				assert.strictEqual(res.length, 15);

				assertEventDates(case1.prep, 8, 9, 9, 13);
				assertEventDates(case2.prep, 8, 9, 13, 17);
				assertEventDates(case3.prep, 8, 8, 9, 13);
				assertEventDates(case1.siteVisit1, 8, 10, 9, 17);
				assertEventDates(case1.siteVisit2, 8, 11, 9, 13);
				assertEventDates(case2.siteVisit1, 8, 12, 9, 17);
				assertEventDates(case2.siteVisit2, 8, 15, 9, 13);
				assertEventDates(case3.siteVisit1, 8, 16, 9, 17);
				assertEventDates(case3.siteVisit2, 8, 17, 9, 13);
				assertEventDates(case1.report, 8, 18, 9, 13);
				assertEventDates(case2.report, 8, 18, 13, 17);
				assertEventDates(case3.report, 8, 19, 9, 13);
				assertEventDates(case1.costs, 8, 22, 9, 11);
				assertEventDates(case2.costs, 8, 22, 11, 13);
				assertEventDates(case3.costs, 8, 22, 13, 15);
			});
			it('handle multiple cases with split prep events', async () => {
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 12, siteVisitTime: 4, reportTime: 4, costsTime: 2 }
						}
					];
				});
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-10', [appeal, appeal, appeal]);
				console.info(res);
				const [case1, case2, case3] = [
					{ prep1: res[0], prep2: res[1], siteVisit: res[6], report: res[9], costs: res[12] },
					{ prep1: res[2], prep2: res[3], siteVisit: res[7], report: res[10], costs: res[13] },
					{ prep1: res[4], prep2: res[5], siteVisit: res[8], report: res[11], costs: res[14] }
				];

				requiredProps(case1.prep1);
				requiredProps(case2.prep2);
				requiredProps(case3.costs);

				assert.ok(case1.prep1.subject.includes('prep - 8'));
				assert.ok(case1.prep2.subject.includes('prep - 4'));
				assert.ok(case2.prep1.subject.includes('prep - 8'));
				assert.ok(case2.prep2.subject.includes('prep - 4'));
				assert.ok(case3.prep1.subject.includes('prep - 8'));
				assert.ok(case3.prep2.subject.includes('prep - 4'));

				assert.strictEqual(res.length, 15);

				assertEventDates(case1.prep1, 8, 9, 9, 17);
				assertEventDates(case1.prep2, 8, 8, 9, 13);
				assertEventDates(case2.prep1, 8, 5, 9, 17);
				assertEventDates(case2.prep2, 8, 4, 9, 13);
				assertEventDates(case3.prep1, 8, 3, 9, 17);
				assertEventDates(case3.prep2, 8, 2, 9, 13);
				assertEventDates(case1.siteVisit, 8, 10, 9, 13);
				assertEventDates(case2.siteVisit, 8, 10, 13, 17);
				assertEventDates(case3.siteVisit, 8, 11, 9, 13);
				assertEventDates(case1.report, 8, 12, 9, 13);
				assertEventDates(case2.report, 8, 12, 13, 17);
				assertEventDates(case3.report, 8, 15, 9, 13);
				assertEventDates(case1.costs, 8, 16, 9, 11);
				assertEventDates(case2.costs, 8, 16, 11, 13);
				assertEventDates(case3.costs, 8, 16, 13, 15);
			});
			it('handle multiple events that overrun the 8 hour daily limit and straddle the weekend', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-10', [appeal, appeal, appeal, appeal, appeal]);
				const [case1, case2, case3, case4, case5] = [
					{ prep: res[0], siteVisit: res[5], report: res[10], costs: res[15] },
					{ prep: res[1], siteVisit: res[6], report: res[11], costs: res[16] },
					{ prep: res[2], siteVisit: res[7], report: res[12], costs: res[17] },
					{ prep: res[3], siteVisit: res[8], report: res[13], costs: res[18] },
					{ prep: res[4], siteVisit: res[9], report: res[14], costs: res[19] }
				];

				requiredStages(case1.prep, case1.siteVisit, case1.report, case1.costs);
				requiredProps(case1.siteVisit);
				requiredProps(case2.report);
				requiredProps(case3.costs);

				assert.strictEqual(res.length, 20);

				assertEventDates(case1.prep, 8, 9, 9, 11);
				assertEventDates(case2.prep, 8, 9, 11, 13);
				assertEventDates(case3.prep, 8, 9, 13, 15);
				assertEventDates(case4.prep, 8, 9, 15, 17);
				assertEventDates(case5.prep, 8, 8, 9, 11);
				assertEventDates(case1.siteVisit, 8, 10, 9, 12);
				assertEventDates(case2.siteVisit, 8, 10, 12, 15);
				assertEventDates(case3.siteVisit, 8, 11, 9, 12);
				assertEventDates(case4.siteVisit, 8, 11, 12, 15);
				assertEventDates(case5.siteVisit, 8, 12, 9, 12);
				assertEventDates(case1.report, 8, 15, 9, 11);
				assertEventDates(case2.report, 8, 15, 11, 13);
				assertEventDates(case3.report, 8, 15, 13, 15);
				assertEventDates(case4.report, 8, 15, 15, 17);
				assertEventDates(case5.report, 8, 16, 9, 11);
				assertEventDates(case1.costs, 8, 17, 9, 10);
				assertEventDates(case2.costs, 8, 17, 10, 11);
				assertEventDates(case3.costs, 8, 17, 11, 12);
				assertEventDates(case4.costs, 8, 17, 12, 13);
				assertEventDates(case5.costs, 8, 17, 13, 14);
			});
			it('assignments should wrap onto the next month elegantly', async () => {
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 4, siteVisitTime: 10, reportTime: 5, costsTime: 1 }
						}
					];
				});

				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-26', [appeal, appeal, appeal]);
				assert.strictEqual(res.length, 15);

				const [case1, case2, case3] = [
					{ prep: res[0], siteVisit1: res[3], siteVisit2: res[4], report: res[9], costs: res[12] },
					{ prep: res[1], siteVisit1: res[5], siteVisit2: res[6], report: res[10], costs: res[13] },
					{ prep: res[2], siteVisit1: res[7], siteVisit2: res[8], report: res[11], costs: res[14] }
				];

				assertEventDates(case1.prep, 8, 25, 9, 13);
				assertEventDates(case2.prep, 8, 25, 13, 17);
				assertEventDates(case3.prep, 8, 24, 9, 13);
				assertEventDates(case1.siteVisit1, 8, 26, 9, 17);
				assertEventDates(case1.siteVisit2, 8, 29, 9, 11);
				assertEventDates(case2.siteVisit1, 8, 30, 9, 17);
				assertEventDates(case2.siteVisit2, 9, 1, 9, 11);
				assertEventDates(case3.siteVisit1, 9, 2, 9, 17);
				assertEventDates(case3.siteVisit2, 9, 3, 9, 11);
				assertEventDates(case1.report, 9, 6, 9, 14);
				assertEventDates(case2.report, 9, 7, 9, 14);
				assertEventDates(case3.report, 9, 8, 9, 14);
				assertEventDates(case1.costs, 9, 9, 9, 10);
				assertEventDates(case2.costs, 9, 9, 10, 11);
				assertEventDates(case3.costs, 9, 9, 11, 12);
			});
		});
		describe('missing stages', () => {
			it('should be able to elegantly handle timing rules with zero time for a stage', async () => {
				mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementationOnce(() => {
					return [
						{
							id: 1,
							caseType: 'H',
							caseProcedure: 'W',
							allocationLevel: 'B',
							CalendarEventTiming: { prepTime: 3, siteVisitTime: 6, reportTime: 4, costsTime: 0 }
						}
					];
				});
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [appeal]);
				const caseEvents = { prep: res[0], siteVisit: res[1], report: res[2] };

				requiredProps(caseEvents.prep);
				assert.strictEqual(res.length, 3);
			});
		});
	});

	describe('submitCalendarEvents', () => {
		it('should be able to create calendar events without error', async () => {
			await submitCalendarEvents(mockInitEntraClient, ['event'], mockSession, 'inspectorId', mockLogger);
			assert.strictEqual(mockLogger.error.mock.callCount(), 0);
			assert.strictEqual(mockEntraClient.createCalendarEvents.mock.callCount(), 1);
			assert.deepStrictEqual(mockEntraClient.createCalendarEvents.mock.calls[0].arguments[0], ['event']);
			assert.strictEqual(mockEntraClient.createCalendarEvents.mock.calls[0].arguments[1], 'inspectorId');
		});

		it('should error if unable to initialise entra client', async () => {
			mockInitEntraClient.mock.mockImplementationOnce(() => null);
			await assert.rejects(submitCalendarEvents(mockInitEntraClient, [], mockSession, 'inspectorId', mockLogger));

			const expectedErrorMessage =
				'Error creating adding calendar events to outlook: Error: No entra client initialised';
			assert.strictEqual(mockEntraClient.createCalendarEvents.mock.callCount(), 0);
			assert.strictEqual(mockLogger.error.mock.callCount(), 1);
			assert.strictEqual(mockLogger.error.mock.calls[0].arguments[0], expectedErrorMessage);
		});

		it('should error if unable to create calendar events', async () => {
			mockEntraClient.createCalendarEvents.mock.mockImplementationOnce(() => {
				throw new Error('Entra error');
			});
			await assert.rejects(submitCalendarEvents(mockInitEntraClient, [], mockSession, 'inspectorId', mockLogger));

			const expectedErrorMessage = 'Error creating adding calendar events to outlook: Error: Entra error';
			assert.strictEqual(mockEntraClient.createCalendarEvents.mock.callCount(), 1);
			assert.strictEqual(mockLogger.error.mock.callCount(), 1);
			assert.strictEqual(mockLogger.error.mock.calls[0].arguments[0], expectedErrorMessage);
		});
	});
});
