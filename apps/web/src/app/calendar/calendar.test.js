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
import { EXTENSION_ID } from '@pins/inspector-programming-lib/graph/entra.js';

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
				casesClient: mockCasesClient,
				calendarClient: mockCalendarClient
			};
		};
		const mockCasesClient = {
			getCaseById: mock.fn()
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
		mockCasesClient.getCaseById.mock.mockImplementation(() => appeal);

		//testing vars
		const requiredProps = (/** @type {any} */ row) => {
			['subject', 'start', 'end', 'location'].forEach((prop) => {
				assert.ok(Object.prototype.hasOwnProperty.call(row, prop));
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

		it('should generate a list of calendar event json objects for a case', async () => {
			const service = mockService();
			const res = await generateCaseCalendarEvents(service, '2025-10-08', [1]);

			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			//expect call count to be num cases * 4 (one per stage)
			assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 4);
			assert.strictEqual(res.length, 4);

			requiredProps(res[0]);
			requiredStages(res[0], res[1], res[2], res[3]);

			//check correct time allocation
			assert.strictEqual(res[0].start.dateTime, '2025-10-07T09:00:00.000Z'); //prep
			assert.strictEqual(res[0].end.dateTime, '2025-10-07T11:00:00.000Z');
			assert.strictEqual(res[1].start.dateTime, '2025-10-08T09:00:00.000Z'); //siteVisit
			assert.strictEqual(res[1].end.dateTime, '2025-10-08T12:00:00.000Z');
			assert.strictEqual(res[2].start.dateTime, '2025-10-09T09:00:00.000Z'); //report
			assert.strictEqual(res[2].end.dateTime, '2025-10-09T11:00:00.000Z');
			assert.strictEqual(res[3].start.dateTime, '2025-10-10T09:00:00.000Z'); //costs
			assert.strictEqual(res[3].end.dateTime, '2025-10-10T10:00:00.000Z');
		});
		it('multiple cases should yield multiple sets of json objects', async () => {
			const service = mockService();
			const res = await generateCaseCalendarEvents(service, '2025-10-08', [1, 2, 3]);
			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 12); //3 cases * 4 stages
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
			const res = await generateCaseCalendarEvents(service, '2025-10-10', [1]);
			assert.strictEqual(res.length, 4);
			assert.strictEqual(res[0].singleValueExtendedProperties[0].id, EXTENSION_ID);
			assert.ok(Object.prototype.hasOwnProperty.call(res[0].singleValueExtendedProperties[0], 'value'));
		});
		describe('error cases', () => {
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
		});
		describe('handling events over weekends or bank holidays', () => {
			it('setting the assignment date to a Monday will generate the prep event on the prior Friday', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-22', [1]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 4);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assert.strictEqual(res[0].start.dateTime, '2025-09-19T09:00:00.000Z'); //prep
				assert.strictEqual(res[0].end.dateTime, '2025-09-19T11:00:00.000Z');
				assert.strictEqual(res[1].start.dateTime, '2025-09-22T09:00:00.000Z'); //siteVisit
				assert.strictEqual(res[1].end.dateTime, '2025-09-22T12:00:00.000Z');
				assert.strictEqual(res[2].start.dateTime, '2025-09-23T09:00:00.000Z'); //report
				assert.strictEqual(res[2].end.dateTime, '2025-09-23T11:00:00.000Z');
				assert.strictEqual(res[3].start.dateTime, '2025-09-24T09:00:00.000Z'); //costs
				assert.strictEqual(res[3].end.dateTime, '2025-09-24T10:00:00.000Z');
			});
			it('setting the assignment date to a Sunday will generate the prep event on the prior Friday and increment all other days by 1', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-21', [1]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 4);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assert.strictEqual(res[0].start.dateTime, '2025-09-19T09:00:00.000Z'); //prep
				assert.strictEqual(res[0].end.dateTime, '2025-09-19T11:00:00.000Z');
				assert.strictEqual(res[1].start.dateTime, '2025-09-22T09:00:00.000Z'); //siteVisit
				assert.strictEqual(res[1].end.dateTime, '2025-09-22T12:00:00.000Z');
				assert.strictEqual(res[2].start.dateTime, '2025-09-23T09:00:00.000Z'); //report
				assert.strictEqual(res[2].end.dateTime, '2025-09-23T11:00:00.000Z');
				assert.strictEqual(res[3].start.dateTime, '2025-09-24T09:00:00.000Z'); //costs
				assert.strictEqual(res[3].end.dateTime, '2025-09-24T10:00:00.000Z');
			});
			it('setting the assignment date to a Saturday will generate the prep event on the prior Friday and increment all other days by 2', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-20', [1]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 4);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assert.strictEqual(res[0].start.dateTime, '2025-09-19T09:00:00.000Z'); //prep
				assert.strictEqual(res[0].end.dateTime, '2025-09-19T11:00:00.000Z');
				assert.strictEqual(res[1].start.dateTime, '2025-09-22T09:00:00.000Z'); //siteVisit
				assert.strictEqual(res[1].end.dateTime, '2025-09-22T12:00:00.000Z');
				assert.strictEqual(res[2].start.dateTime, '2025-09-23T09:00:00.000Z'); //report
				assert.strictEqual(res[2].end.dateTime, '2025-09-23T11:00:00.000Z');
				assert.strictEqual(res[3].start.dateTime, '2025-09-24T09:00:00.000Z'); //costs
				assert.strictEqual(res[3].end.dateTime, '2025-09-24T10:00:00.000Z');
			});
			it('setting the assignment date to a Friday will offload report and costs stages onto the next week', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-19', [1]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 4);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assert.strictEqual(res[0].start.dateTime, '2025-09-18T09:00:00.000Z'); //prep
				assert.strictEqual(res[0].end.dateTime, '2025-09-18T11:00:00.000Z');
				assert.strictEqual(res[1].start.dateTime, '2025-09-19T09:00:00.000Z'); //siteVisit
				assert.strictEqual(res[1].end.dateTime, '2025-09-19T12:00:00.000Z');
				assert.strictEqual(res[2].start.dateTime, '2025-09-22T09:00:00.000Z'); //report
				assert.strictEqual(res[2].end.dateTime, '2025-09-22T11:00:00.000Z');
				assert.strictEqual(res[3].start.dateTime, '2025-09-23T09:00:00.000Z'); //costs
				assert.strictEqual(res[3].end.dateTime, '2025-09-23T10:00:00.000Z');
			});
			it('setting the assignment date to a Thursday will offload costs stage onto the next week', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-18', [1]);
				assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
				assert.strictEqual(mockCasesClient.getCaseById.mock.callCount(), 4);
				assert.strictEqual(res.length, 4);

				requiredProps(res[0]);
				requiredStages(res[0], res[1], res[2], res[3]);

				//check correct time allocation
				assert.strictEqual(res[0].start.dateTime, '2025-09-17T09:00:00.000Z'); //prep
				assert.strictEqual(res[0].end.dateTime, '2025-09-17T11:00:00.000Z');
				assert.strictEqual(res[1].start.dateTime, '2025-09-18T09:00:00.000Z'); //siteVisit
				assert.strictEqual(res[1].end.dateTime, '2025-09-18T12:00:00.000Z');
				assert.strictEqual(res[2].start.dateTime, '2025-09-19T09:00:00.000Z'); //report
				assert.strictEqual(res[2].end.dateTime, '2025-09-19T11:00:00.000Z');
				assert.strictEqual(res[3].start.dateTime, '2025-09-22T09:00:00.000Z'); //costs
				assert.strictEqual(res[3].end.dateTime, '2025-09-22T10:00:00.000Z');
			});
			it('bank holidays should be accounted for when allocating events', async () => {
				mockCalendarClient.getEnglandWalesBankHolidays.mock.mockImplementationOnce(() => ['2025-09-29']);

				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-25', [1]);
				assert.strictEqual(mockCalendarClient.getEnglandWalesBankHolidays.mock.callCount(), 1);
				assert.strictEqual(res.length, 4);

				const case1 = { prep: res[0], siteVisit: res[1], report: res[2], costs: res[3] };

				requiredProps(case1.report);
				requiredStages(case1.prep, case1.siteVisit, case1.report, case1.costs);

				assert.strictEqual(case1.prep.start.dateTime, '2025-09-24T09:00:00.000Z');
				assert.strictEqual(case1.prep.end.dateTime, '2025-09-24T11:00:00.000Z');
				assert.strictEqual(case1.siteVisit.start.dateTime, '2025-09-25T09:00:00.000Z');
				assert.strictEqual(case1.siteVisit.end.dateTime, '2025-09-25T12:00:00.000Z');
				assert.strictEqual(case1.report.start.dateTime, '2025-09-26T09:00:00.000Z');
				assert.strictEqual(case1.report.end.dateTime, '2025-09-26T11:00:00.000Z');
				assert.strictEqual(case1.costs.start.dateTime, '2025-09-30T09:00:00.000Z');
				assert.strictEqual(case1.costs.end.dateTime, '2025-09-30T10:00:00.000Z');
			});
			it('bank holidays should be accounted for when allocating events for multiple cases', async () => {
				mockCalendarClient.getEnglandWalesBankHolidays.mock.mockImplementationOnce(() => ['2025-09-29']);

				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-26', [1, 2, 3]);
				assert.strictEqual(mockCalendarClient.getEnglandWalesBankHolidays.mock.callCount(), 1);
				assert.strictEqual(res.length, 12);

				const [case1, case2, case3] = [
					{ prep: res[0], siteVisit: res[3], report: res[6], costs: res[9] },
					{ prep: res[1], siteVisit: res[4], report: res[7], costs: res[10] },
					{ prep: res[2], siteVisit: res[5], report: res[8], costs: res[11] }
				];

				assert.strictEqual(case1.prep.start.dateTime, '2025-09-25T09:00:00.000Z');
				assert.strictEqual(case1.prep.end.dateTime, '2025-09-25T11:00:00.000Z');
				assert.strictEqual(case2.prep.start.dateTime, '2025-09-25T11:00:00.000Z');
				assert.strictEqual(case2.prep.end.dateTime, '2025-09-25T13:00:00.000Z');
				assert.strictEqual(case3.prep.start.dateTime, '2025-09-25T13:00:00.000Z');
				assert.strictEqual(case3.prep.end.dateTime, '2025-09-25T15:00:00.000Z');
				assert.strictEqual(case1.siteVisit.start.dateTime, '2025-09-26T09:00:00.000Z');
				assert.strictEqual(case1.siteVisit.end.dateTime, '2025-09-26T12:00:00.000Z');
				assert.strictEqual(case2.siteVisit.start.dateTime, '2025-09-26T12:00:00.000Z');
				assert.strictEqual(case2.siteVisit.end.dateTime, '2025-09-26T15:00:00.000Z');
				assert.strictEqual(case3.siteVisit.start.dateTime, '2025-09-30T09:00:00.000Z');
				assert.strictEqual(case3.siteVisit.end.dateTime, '2025-09-30T12:00:00.000Z');
				assert.strictEqual(case1.report.start.dateTime, '2025-10-01T09:00:00.000Z');
				assert.strictEqual(case1.report.end.dateTime, '2025-10-01T11:00:00.000Z');
				assert.strictEqual(case2.report.start.dateTime, '2025-10-01T11:00:00.000Z');
				assert.strictEqual(case2.report.end.dateTime, '2025-10-01T13:00:00.000Z');
				assert.strictEqual(case3.report.start.dateTime, '2025-10-01T13:00:00.000Z');
				assert.strictEqual(case3.report.end.dateTime, '2025-10-01T15:00:00.000Z');
				assert.strictEqual(case1.costs.start.dateTime, '2025-10-02T09:00:00.000Z');
				assert.strictEqual(case1.costs.end.dateTime, '2025-10-02T10:00:00.000Z');
				assert.strictEqual(case2.costs.start.dateTime, '2025-10-02T10:00:00.000Z');
				assert.strictEqual(case2.costs.end.dateTime, '2025-10-02T11:00:00.000Z');
				assert.strictEqual(case3.costs.start.dateTime, '2025-10-02T11:00:00.000Z');
				assert.strictEqual(case3.costs.end.dateTime, '2025-10-02T12:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [1, 2, 3]);
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
				assert.strictEqual(case1.prep.start.dateTime, '2025-09-23T09:00:00.000Z'); //prep
				assert.strictEqual(case1.prep.end.dateTime, '2025-09-23T11:00:00.000Z');
				assert.strictEqual(case1.siteVisit.start.dateTime, '2025-09-24T09:00:00.000Z'); //siteVisit
				assert.strictEqual(case1.siteVisit.end.dateTime, '2025-09-24T11:00:00.000Z');
				assert.strictEqual(case1.report.start.dateTime, '2025-09-25T09:00:00.000Z'); //report
				assert.strictEqual(case1.report.end.dateTime, '2025-09-25T10:00:00.000Z');
				assert.strictEqual(case1.costs.start.dateTime, '2025-09-26T09:00:00.000Z'); //costs
				assert.strictEqual(case1.costs.end.dateTime, '2025-09-26T10:00:00.000Z');

				//case2 should come straight after case1
				assert.strictEqual(case2.prep.start.dateTime, '2025-09-23T11:00:00.000Z'); //prep
				assert.strictEqual(case2.prep.end.dateTime, '2025-09-23T13:00:00.000Z');
				assert.strictEqual(case2.siteVisit.start.dateTime, '2025-09-24T11:00:00.000Z'); //siteVisit
				assert.strictEqual(case2.siteVisit.end.dateTime, '2025-09-24T13:00:00.000Z');
				assert.strictEqual(case2.report.start.dateTime, '2025-09-25T10:00:00.000Z'); //report
				assert.strictEqual(case2.report.end.dateTime, '2025-09-25T11:00:00.000Z');
				assert.strictEqual(case2.costs.start.dateTime, '2025-09-26T10:00:00.000Z'); //costs
				assert.strictEqual(case2.costs.end.dateTime, '2025-09-26T11:00:00.000Z');

				//case3 should come straight after case2
				assert.strictEqual(case3.prep.start.dateTime, '2025-09-23T13:00:00.000Z'); //prep
				assert.strictEqual(case3.prep.end.dateTime, '2025-09-23T15:00:00.000Z');
				assert.strictEqual(case3.siteVisit.start.dateTime, '2025-09-24T13:00:00.000Z'); //siteVisit
				assert.strictEqual(case3.siteVisit.end.dateTime, '2025-09-24T15:00:00.000Z');
				assert.strictEqual(case3.report.start.dateTime, '2025-09-25T11:00:00.000Z'); //report
				assert.strictEqual(case3.report.end.dateTime, '2025-09-25T12:00:00.000Z');
				assert.strictEqual(case3.costs.start.dateTime, '2025-09-26T11:00:00.000Z'); //costs
				assert.strictEqual(case3.costs.end.dateTime, '2025-09-26T12:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [1]);
				const caseEvents = { prep: res[0], siteVisit1: res[1], siteVisit2: res[2], report: res[3], costs: res[4] };

				requiredProps(caseEvents.prep);
				requiredStages(caseEvents.prep, caseEvents.siteVisit1, caseEvents.report, caseEvents.costs);
				assert.ok(caseEvents.siteVisit1.subject.includes('siteVisit - 8'));
				assert.ok(caseEvents.siteVisit2.subject.includes('siteVisit - 4'));

				assert.strictEqual(res.length, 5);

				assert.strictEqual(caseEvents.prep.start.dateTime, '2025-09-23T09:00:00.000Z');
				assert.strictEqual(caseEvents.prep.end.dateTime, '2025-09-23T13:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit1.start.dateTime, '2025-09-24T09:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit1.end.dateTime, '2025-09-24T17:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit2.start.dateTime, '2025-09-25T09:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit2.end.dateTime, '2025-09-25T13:00:00.000Z');
				assert.strictEqual(caseEvents.report.start.dateTime, '2025-09-26T09:00:00.000Z');
				assert.strictEqual(caseEvents.report.end.dateTime, '2025-09-26T12:00:00.000Z');
				assert.strictEqual(caseEvents.costs.start.dateTime, '2025-09-29T09:00:00.000Z');
				assert.strictEqual(caseEvents.costs.end.dateTime, '2025-09-29T11:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [1]);
				const caseEvents = { prep: res[0], siteVisit: res[1], report1: res[2], report2: res[3], costs: res[4] };

				requiredProps(caseEvents.prep);
				requiredStages(caseEvents.prep, caseEvents.siteVisit, caseEvents.report1, caseEvents.costs);
				assert.ok(caseEvents.report1.subject.includes('report - 8'));
				assert.ok(caseEvents.report2.subject.includes('report - 6'));

				assert.strictEqual(res.length, 5);

				assert.strictEqual(caseEvents.prep.start.dateTime, '2025-09-23T09:00:00.000Z');
				assert.strictEqual(caseEvents.prep.end.dateTime, '2025-09-23T13:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit.start.dateTime, '2025-09-24T09:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit.end.dateTime, '2025-09-24T15:00:00.000Z');
				assert.strictEqual(caseEvents.report1.start.dateTime, '2025-09-25T09:00:00.000Z');
				assert.strictEqual(caseEvents.report1.end.dateTime, '2025-09-25T17:00:00.000Z');
				assert.strictEqual(caseEvents.report2.start.dateTime, '2025-09-26T09:00:00.000Z');
				assert.strictEqual(caseEvents.report2.end.dateTime, '2025-09-26T15:00:00.000Z');
				assert.strictEqual(caseEvents.costs.start.dateTime, '2025-09-29T09:00:00.000Z');
				assert.strictEqual(caseEvents.costs.end.dateTime, '2025-09-29T11:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [1]);
				const caseEvents = { prep1: res[0], prep2: res[1], siteVisit: res[2], report: res[3], costs: res[4] };

				requiredProps(caseEvents.prep1);
				requiredStages(caseEvents.prep1, caseEvents.siteVisit, caseEvents.report, caseEvents.costs);
				assert.ok(caseEvents.prep1.subject.includes('prep - 8'));
				assert.ok(caseEvents.prep2.subject.includes('prep - 2'));

				assert.strictEqual(res.length, 5);

				assert.strictEqual(caseEvents.prep1.start.dateTime, '2025-09-23T09:00:00.000Z');
				assert.strictEqual(caseEvents.prep1.end.dateTime, '2025-09-23T17:00:00.000Z');
				assert.strictEqual(caseEvents.prep2.start.dateTime, '2025-09-22T09:00:00.000Z');
				assert.strictEqual(caseEvents.prep2.end.dateTime, '2025-09-22T11:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit.start.dateTime, '2025-09-24T09:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit.end.dateTime, '2025-09-24T12:00:00.000Z');
				assert.strictEqual(caseEvents.report.start.dateTime, '2025-09-25T09:00:00.000Z');
				assert.strictEqual(caseEvents.report.end.dateTime, '2025-09-25T11:00:00.000Z');
				assert.strictEqual(caseEvents.costs.start.dateTime, '2025-09-26T09:00:00.000Z');
				assert.strictEqual(caseEvents.costs.end.dateTime, '2025-09-26T11:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [1]);
				const caseEvents = { prep: res[0], siteVisit: res[1], report: res[2], costs1: res[3], costs2: res[4] };

				requiredProps(caseEvents.prep);
				requiredStages(caseEvents.prep, caseEvents.siteVisit, caseEvents.report, caseEvents.costs1);
				assert.ok(caseEvents.costs1.subject.includes('costs - 8'));
				assert.ok(caseEvents.costs2.subject.includes('costs - 8'));

				assert.strictEqual(res.length, 5);

				assert.strictEqual(caseEvents.prep.start.dateTime, '2025-09-23T09:00:00.000Z');
				assert.strictEqual(caseEvents.prep.end.dateTime, '2025-09-23T11:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit.start.dateTime, '2025-09-24T09:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit.end.dateTime, '2025-09-24T12:00:00.000Z');
				assert.strictEqual(caseEvents.report.start.dateTime, '2025-09-25T09:00:00.000Z');
				assert.strictEqual(caseEvents.report.end.dateTime, '2025-09-25T11:00:00.000Z');
				assert.strictEqual(caseEvents.costs1.start.dateTime, '2025-09-26T09:00:00.000Z');
				assert.strictEqual(caseEvents.costs1.end.dateTime, '2025-09-26T17:00:00.000Z');
				assert.strictEqual(caseEvents.costs2.start.dateTime, '2025-09-29T09:00:00.000Z');
				assert.strictEqual(caseEvents.costs2.end.dateTime, '2025-09-29T17:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [1]);
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

				assert.strictEqual(caseEvents.prep1.start.dateTime, '2025-09-23T09:00:00.000Z');
				assert.strictEqual(caseEvents.prep1.end.dateTime, '2025-09-23T17:00:00.000Z');
				assert.strictEqual(caseEvents.prep2.start.dateTime, '2025-09-22T09:00:00.000Z');
				assert.strictEqual(caseEvents.prep2.end.dateTime, '2025-09-22T13:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit1.start.dateTime, '2025-09-24T09:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit1.end.dateTime, '2025-09-24T17:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit2.start.dateTime, '2025-09-25T09:00:00.000Z');
				assert.strictEqual(caseEvents.siteVisit2.end.dateTime, '2025-09-25T13:00:00.000Z');
				assert.strictEqual(caseEvents.report1.start.dateTime, '2025-09-26T09:00:00.000Z');
				assert.strictEqual(caseEvents.report1.end.dateTime, '2025-09-26T17:00:00.000Z');
				assert.strictEqual(caseEvents.report2.start.dateTime, '2025-09-29T09:00:00.000Z');
				assert.strictEqual(caseEvents.report2.end.dateTime, '2025-09-29T11:00:00.000Z');
				assert.strictEqual(caseEvents.costs.start.dateTime, '2025-09-30T09:00:00.000Z');
				assert.strictEqual(caseEvents.costs.end.dateTime, '2025-09-30T11:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-10', [1, 2, 3]);
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

				assert.strictEqual(case1.prep.start.dateTime, '2025-09-09T09:00:00.000Z');
				assert.strictEqual(case1.prep.end.dateTime, '2025-09-09T13:00:00.000Z');
				assert.strictEqual(case2.prep.start.dateTime, '2025-09-09T13:00:00.000Z');
				assert.strictEqual(case2.prep.end.dateTime, '2025-09-09T17:00:00.000Z');
				assert.strictEqual(case3.prep.start.dateTime, '2025-09-08T09:00:00.000Z');
				assert.strictEqual(case3.prep.end.dateTime, '2025-09-08T13:00:00.000Z');
				assert.strictEqual(case1.siteVisit1.start.dateTime, '2025-09-10T09:00:00.000Z');
				assert.strictEqual(case1.siteVisit1.end.dateTime, '2025-09-10T17:00:00.000Z');
				assert.strictEqual(case1.siteVisit2.start.dateTime, '2025-09-11T09:00:00.000Z');
				assert.strictEqual(case1.siteVisit2.end.dateTime, '2025-09-11T13:00:00.000Z');
				assert.strictEqual(case2.siteVisit1.start.dateTime, '2025-09-12T09:00:00.000Z');
				assert.strictEqual(case2.siteVisit1.end.dateTime, '2025-09-12T17:00:00.000Z');
				assert.strictEqual(case2.siteVisit2.start.dateTime, '2025-09-15T09:00:00.000Z'); // technically could be put on 11th but much safer to not look backwards when assigning split cases
				assert.strictEqual(case2.siteVisit2.end.dateTime, '2025-09-15T13:00:00.000Z');
				assert.strictEqual(case3.siteVisit1.start.dateTime, '2025-09-16T09:00:00.000Z');
				assert.strictEqual(case3.siteVisit1.end.dateTime, '2025-09-16T17:00:00.000Z');
				assert.strictEqual(case3.siteVisit2.start.dateTime, '2025-09-17T09:00:00.000Z');
				assert.strictEqual(case3.siteVisit2.end.dateTime, '2025-09-17T13:00:00.000Z');
				assert.strictEqual(case1.report.start.dateTime, '2025-09-18T09:00:00.000Z');
				assert.strictEqual(case1.report.end.dateTime, '2025-09-18T13:00:00.000Z');
				assert.strictEqual(case2.report.start.dateTime, '2025-09-18T13:00:00.000Z');
				assert.strictEqual(case2.report.end.dateTime, '2025-09-18T17:00:00.000Z');
				assert.strictEqual(case3.report.start.dateTime, '2025-09-19T09:00:00.000Z');
				assert.strictEqual(case3.report.end.dateTime, '2025-09-19T13:00:00.000Z');
				assert.strictEqual(case1.costs.start.dateTime, '2025-09-22T09:00:00.000Z');
				assert.strictEqual(case1.costs.end.dateTime, '2025-09-22T11:00:00.000Z');
				assert.strictEqual(case2.costs.start.dateTime, '2025-09-22T11:00:00.000Z');
				assert.strictEqual(case2.costs.end.dateTime, '2025-09-22T13:00:00.000Z');
				assert.strictEqual(case3.costs.start.dateTime, '2025-09-22T13:00:00.000Z');
				assert.strictEqual(case3.costs.end.dateTime, '2025-09-22T15:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-10', [1, 2, 3]);
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

				assert.strictEqual(case1.prep1.start.dateTime, '2025-09-09T09:00:00.000Z'); //prep events go backwards because case1 assigned first, then case2
				assert.strictEqual(case1.prep1.end.dateTime, '2025-09-09T17:00:00.000Z');
				assert.strictEqual(case1.prep2.start.dateTime, '2025-09-08T09:00:00.000Z');
				assert.strictEqual(case1.prep2.end.dateTime, '2025-09-08T13:00:00.000Z');
				assert.strictEqual(case2.prep1.start.dateTime, '2025-09-05T09:00:00.000Z');
				assert.strictEqual(case2.prep1.end.dateTime, '2025-09-05T17:00:00.000Z');
				assert.strictEqual(case2.prep2.start.dateTime, '2025-09-04T09:00:00.000Z');
				assert.strictEqual(case2.prep2.end.dateTime, '2025-09-04T13:00:00.000Z');
				assert.strictEqual(case3.prep1.start.dateTime, '2025-09-03T09:00:00.000Z');
				assert.strictEqual(case3.prep1.end.dateTime, '2025-09-03T17:00:00.000Z');
				assert.strictEqual(case3.prep2.start.dateTime, '2025-09-02T09:00:00.000Z');
				assert.strictEqual(case3.prep2.end.dateTime, '2025-09-02T13:00:00.000Z');
				assert.strictEqual(case1.siteVisit.start.dateTime, '2025-09-10T09:00:00.000Z');
				assert.strictEqual(case1.siteVisit.end.dateTime, '2025-09-10T13:00:00.000Z');
				assert.strictEqual(case2.siteVisit.start.dateTime, '2025-09-10T13:00:00.000Z');
				assert.strictEqual(case2.siteVisit.end.dateTime, '2025-09-10T17:00:00.000Z');
				assert.strictEqual(case3.siteVisit.start.dateTime, '2025-09-11T09:00:00.000Z');
				assert.strictEqual(case3.siteVisit.end.dateTime, '2025-09-11T13:00:00.000Z');
				assert.strictEqual(case1.report.start.dateTime, '2025-09-12T09:00:00.000Z');
				assert.strictEqual(case1.report.end.dateTime, '2025-09-12T13:00:00.000Z');
				assert.strictEqual(case2.report.start.dateTime, '2025-09-12T13:00:00.000Z');
				assert.strictEqual(case2.report.end.dateTime, '2025-09-12T17:00:00.000Z');
				assert.strictEqual(case3.report.start.dateTime, '2025-09-15T09:00:00.000Z');
				assert.strictEqual(case3.report.end.dateTime, '2025-09-15T13:00:00.000Z');
				assert.strictEqual(case1.costs.start.dateTime, '2025-09-16T09:00:00.000Z');
				assert.strictEqual(case1.costs.end.dateTime, '2025-09-16T11:00:00.000Z');
				assert.strictEqual(case2.costs.start.dateTime, '2025-09-16T11:00:00.000Z');
				assert.strictEqual(case2.costs.end.dateTime, '2025-09-16T13:00:00.000Z');
				assert.strictEqual(case3.costs.start.dateTime, '2025-09-16T13:00:00.000Z');
				assert.strictEqual(case3.costs.end.dateTime, '2025-09-16T15:00:00.000Z');
			});
			it('handle multiple events that overrun the 8 hour daily limit and straddle the weekend', async () => {
				const service = mockService();
				const res = await generateCaseCalendarEvents(service, '2025-09-10', [1, 2, 3, 4, 5]);
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

				assert.strictEqual(case1.prep.start.dateTime, '2025-09-09T09:00:00.000Z');
				assert.strictEqual(case1.prep.end.dateTime, '2025-09-09T11:00:00.000Z');
				assert.strictEqual(case2.prep.start.dateTime, '2025-09-09T11:00:00.000Z');
				assert.strictEqual(case2.prep.end.dateTime, '2025-09-09T13:00:00.000Z');
				assert.strictEqual(case3.prep.start.dateTime, '2025-09-09T13:00:00.000Z');
				assert.strictEqual(case3.prep.end.dateTime, '2025-09-09T15:00:00.000Z');
				assert.strictEqual(case4.prep.start.dateTime, '2025-09-09T15:00:00.000Z');
				assert.strictEqual(case4.prep.end.dateTime, '2025-09-09T17:00:00.000Z');
				assert.strictEqual(case5.prep.start.dateTime, '2025-09-08T09:00:00.000Z');
				assert.strictEqual(case5.prep.end.dateTime, '2025-09-08T11:00:00.000Z');
				assert.strictEqual(case1.siteVisit.start.dateTime, '2025-09-10T09:00:00.000Z');
				assert.strictEqual(case1.siteVisit.end.dateTime, '2025-09-10T12:00:00.000Z');
				assert.strictEqual(case2.siteVisit.start.dateTime, '2025-09-10T12:00:00.000Z');
				assert.strictEqual(case2.siteVisit.end.dateTime, '2025-09-10T15:00:00.000Z');
				assert.strictEqual(case3.siteVisit.start.dateTime, '2025-09-11T09:00:00.000Z');
				assert.strictEqual(case3.siteVisit.end.dateTime, '2025-09-11T12:00:00.000Z');
				assert.strictEqual(case4.siteVisit.start.dateTime, '2025-09-11T12:00:00.000Z');
				assert.strictEqual(case4.siteVisit.end.dateTime, '2025-09-11T15:00:00.000Z');
				assert.strictEqual(case5.siteVisit.start.dateTime, '2025-09-12T09:00:00.000Z');
				assert.strictEqual(case5.siteVisit.end.dateTime, '2025-09-12T12:00:00.000Z');
				assert.strictEqual(case1.report.start.dateTime, '2025-09-15T09:00:00.000Z');
				assert.strictEqual(case1.report.end.dateTime, '2025-09-15T11:00:00.000Z');
				assert.strictEqual(case2.report.start.dateTime, '2025-09-15T11:00:00.000Z');
				assert.strictEqual(case2.report.end.dateTime, '2025-09-15T13:00:00.000Z');
				assert.strictEqual(case3.report.start.dateTime, '2025-09-15T13:00:00.000Z');
				assert.strictEqual(case3.report.end.dateTime, '2025-09-15T15:00:00.000Z');
				assert.strictEqual(case4.report.start.dateTime, '2025-09-15T15:00:00.000Z');
				assert.strictEqual(case4.report.end.dateTime, '2025-09-15T17:00:00.000Z');
				assert.strictEqual(case5.report.start.dateTime, '2025-09-16T09:00:00.000Z');
				assert.strictEqual(case5.report.end.dateTime, '2025-09-16T11:00:00.000Z');
				assert.strictEqual(case1.costs.start.dateTime, '2025-09-17T09:00:00.000Z');
				assert.strictEqual(case1.costs.end.dateTime, '2025-09-17T10:00:00.000Z');
				assert.strictEqual(case2.costs.start.dateTime, '2025-09-17T10:00:00.000Z');
				assert.strictEqual(case2.costs.end.dateTime, '2025-09-17T11:00:00.000Z');
				assert.strictEqual(case3.costs.start.dateTime, '2025-09-17T11:00:00.000Z');
				assert.strictEqual(case3.costs.end.dateTime, '2025-09-17T12:00:00.000Z');
				assert.strictEqual(case4.costs.start.dateTime, '2025-09-17T12:00:00.000Z');
				assert.strictEqual(case4.costs.end.dateTime, '2025-09-17T13:00:00.000Z');
				assert.strictEqual(case5.costs.start.dateTime, '2025-09-17T13:00:00.000Z');
				assert.strictEqual(case5.costs.end.dateTime, '2025-09-17T14:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-26', [1, 2, 3]);
				assert.strictEqual(res.length, 15);

				const [case1, case2, case3] = [
					{ prep: res[0], siteVisit1: res[3], siteVisit2: res[4], report: res[9], costs: res[12] },
					{ prep: res[1], siteVisit1: res[5], siteVisit2: res[6], report: res[10], costs: res[13] },
					{ prep: res[2], siteVisit1: res[7], siteVisit2: res[8], report: res[11], costs: res[14] }
				];

				assert.strictEqual(case1.prep.start.dateTime, '2025-09-25T09:00:00.000Z');
				assert.strictEqual(case1.prep.end.dateTime, '2025-09-25T13:00:00.000Z');
				assert.strictEqual(case2.prep.start.dateTime, '2025-09-25T13:00:00.000Z');
				assert.strictEqual(case2.prep.end.dateTime, '2025-09-25T17:00:00.000Z');
				assert.strictEqual(case3.prep.start.dateTime, '2025-09-24T09:00:00.000Z');
				assert.strictEqual(case3.prep.end.dateTime, '2025-09-24T13:00:00.000Z');
				assert.strictEqual(case1.siteVisit1.start.dateTime, '2025-09-26T09:00:00.000Z');
				assert.strictEqual(case1.siteVisit1.end.dateTime, '2025-09-26T17:00:00.000Z');
				assert.strictEqual(case1.siteVisit2.start.dateTime, '2025-09-29T09:00:00.000Z');
				assert.strictEqual(case1.siteVisit2.end.dateTime, '2025-09-29T11:00:00.000Z');
				assert.strictEqual(case2.siteVisit1.start.dateTime, '2025-09-30T09:00:00.000Z');
				assert.strictEqual(case2.siteVisit1.end.dateTime, '2025-09-30T17:00:00.000Z');
				assert.strictEqual(case2.siteVisit2.start.dateTime, '2025-10-01T09:00:00.000Z');
				assert.strictEqual(case2.siteVisit2.end.dateTime, '2025-10-01T11:00:00.000Z');
				assert.strictEqual(case3.siteVisit1.start.dateTime, '2025-10-02T09:00:00.000Z');
				assert.strictEqual(case3.siteVisit1.end.dateTime, '2025-10-02T17:00:00.000Z');
				assert.strictEqual(case3.siteVisit2.start.dateTime, '2025-10-03T09:00:00.000Z');
				assert.strictEqual(case3.siteVisit2.end.dateTime, '2025-10-03T11:00:00.000Z');
				assert.strictEqual(case1.report.start.dateTime, '2025-10-06T09:00:00.000Z');
				assert.strictEqual(case1.report.end.dateTime, '2025-10-06T14:00:00.000Z');
				assert.strictEqual(case2.report.start.dateTime, '2025-10-07T09:00:00.000Z');
				assert.strictEqual(case2.report.end.dateTime, '2025-10-07T14:00:00.000Z');
				assert.strictEqual(case3.report.start.dateTime, '2025-10-08T09:00:00.000Z');
				assert.strictEqual(case3.report.end.dateTime, '2025-10-08T14:00:00.000Z');
				assert.strictEqual(case1.costs.start.dateTime, '2025-10-09T09:00:00.000Z');
				assert.strictEqual(case1.costs.end.dateTime, '2025-10-09T10:00:00.000Z');
				assert.strictEqual(case2.costs.start.dateTime, '2025-10-09T10:00:00.000Z');
				assert.strictEqual(case2.costs.end.dateTime, '2025-10-09T11:00:00.000Z');
				assert.strictEqual(case3.costs.start.dateTime, '2025-10-09T11:00:00.000Z');
				assert.strictEqual(case3.costs.end.dateTime, '2025-10-09T12:00:00.000Z');
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
				const res = await generateCaseCalendarEvents(service, '2025-09-24', [1]);
				const caseEvents = { prep: res[0], siteVisit: res[1], report: res[2] };

				requiredProps(caseEvents.prep);
				assert.strictEqual(res.length, 3);
			});
		});
	});
});
