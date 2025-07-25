import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import { addWeeks, format, set } from 'date-fns';
import {
	generateInspectors,
	generateMockData,
	groups,
	newEvent,
	timesBetween,
	timeZone,
	weekdayDates,
	workingHours
} from './mock.js';

describe('mock', () => {
	describe('weekdayDates', () => {
		test('returns weekdays between two dates', () => {
			const startDate = new Date('2023-10-01T00:00:00.000Z'); // Sunday
			const endDate = new Date('2023-10-07T00:00:00.000Z'); // Saturday

			const result = weekdayDates(startDate, endDate).map((date) => date.toISOString());
			const expected = [
				'2023-10-02T00:00:00.000Z', // Monday
				'2023-10-03T00:00:00.000Z', // Tuesday
				'2023-10-04T00:00:00.000Z', // Wednesday
				'2023-10-05T00:00:00.000Z', // Thursday
				'2023-10-06T00:00:00.000Z' // Friday
			];

			assert.deepEqual(result, expected);
		});

		test('handles single weekday', () => {
			const startDate = new Date('2023-10-02T00:00:00.000Z'); // Monday
			const endDate = new Date('2023-10-02T00:00:00.000Z'); // Monday

			const result = weekdayDates(startDate, endDate).map((date) => date.toISOString());
			const expected = ['2023-10-02T00:00:00.000Z'];

			assert.deepEqual(result, expected);
		});

		test('returns empty array for weekend-only range', () => {
			const startDate = new Date('2023-10-07T00:00:00.000Z'); // Saturday
			const endDate = new Date('2023-10-08T00:00:00.000Z'); // Sunday

			const result = weekdayDates(startDate, endDate).map((date) => date.toISOString());
			const expected = [];

			assert.deepEqual(result, expected);
		});

		test('handles range crossing multiple weeks', () => {
			const startDate = new Date('2023-10-01T00:00:00.000Z'); // Sunday
			const endDate = new Date('2023-10-14T00:00:00.000Z'); // Saturday

			const result = weekdayDates(startDate, endDate).map((date) => date.toISOString());
			const expected = [
				'2023-10-02T00:00:00.000Z', // Monday
				'2023-10-03T00:00:00.000Z', // Tuesday
				'2023-10-04T00:00:00.000Z', // Wednesday
				'2023-10-05T00:00:00.000Z', // Thursday
				'2023-10-06T00:00:00.000Z', // Friday
				'2023-10-09T00:00:00.000Z', // Monday
				'2023-10-10T00:00:00.000Z', // Tuesday
				'2023-10-11T00:00:00.000Z', // Wednesday
				'2023-10-12T00:00:00.000Z', // Thursday
				'2023-10-13T00:00:00.000Z' // Friday
			];

			assert.deepEqual(result, expected);
		});
		test('handles dates in British Summer Time (BST)', () => {
			const startDate = new Date('2023-06-31T23:00:00.000Z'); // Saturday (BST)
			const endDate = new Date('2023-07-06T23:00:00.000Z'); // Friday (BST)

			const result = weekdayDates(startDate, endDate).map((date) => date.toISOString());
			const expected = [
				'2023-07-02T23:00:00.000Z', // Monday
				'2023-07-03T23:00:00.000Z', // Tuesday
				'2023-07-04T23:00:00.000Z', // Wednesday
				'2023-07-05T23:00:00.000Z', // Thursday
				'2023-07-06T23:00:00.000Z' // Friday
			];

			assert.deepEqual(result, expected);
		});
		test('handles dates across BST-GMT boundary', () => {
			const startDate = new Date('2023-10-26T23:00:00.000Z'); // Friday (BST)
			const endDate = new Date('2023-11-05T00:00:00.000Z'); // Sunday (GMT)

			const result = weekdayDates(startDate, endDate).map((date) => date.toISOString());
			const expected = [
				'2023-10-26T23:00:00.000Z', // Friday
				'2023-10-30T00:00:00.000Z', // Monday
				'2023-10-31T00:00:00.000Z', // Tuesday
				'2023-11-01T00:00:00.000Z', // Wednesday
				'2023-11-02T00:00:00.000Z', // Thursday
				'2023-11-03T00:00:00.000Z' // Friday
			];

			assert.deepEqual(result, expected);
		});
	});

	describe('timesBetween', () => {
		test('returns times between start and end at 30-minute intervals', () => {
			const result = timesBetween('07:00', '09:00');
			const expected = ['07:00', '07:30', '08:00', '08:30', '09:00'];
			assert.deepEqual(result, expected);
		});

		test('handles single time interval', () => {
			const result = timesBetween('07:00', '07:00');
			const expected = ['07:00'];
			assert.deepEqual(result, expected);
		});

		test('returns empty array if start is after end', () => {
			const result = timesBetween('09:00', '07:00');
			const expected = [];
			assert.deepEqual(result, expected);
		});

		test('handles edge case of full day', () => {
			const result = timesBetween('00:00', '23:30');
			const expected = [
				'00:00',
				'00:30',
				'01:00',
				'01:30',
				'02:00',
				'02:30',
				'03:00',
				'03:30',
				'04:00',
				'04:30',
				'05:00',
				'05:30',
				'06:00',
				'06:30',
				'07:00',
				'07:30',
				'08:00',
				'08:30',
				'09:00',
				'09:30',
				'10:00',
				'10:30',
				'11:00',
				'11:30',
				'12:00',
				'12:30',
				'13:00',
				'13:30',
				'14:00',
				'14:30',
				'15:00',
				'15:30',
				'16:00',
				'16:30',
				'17:00',
				'17:30',
				'18:00',
				'18:30',
				'19:00',
				'19:30',
				'20:00',
				'20:30',
				'21:00',
				'21:30',
				'22:00',
				'22:30',
				'23:00',
				'23:30'
			];
			assert.deepEqual(result, expected);
		});
	});

	describe('generateInspectors', () => {
		test('generates the specified number of inspectors', () => {
			const count = 5;
			const inspectors = generateInspectors(count);
			assert.equal(inspectors.length, count);
		});

		test('each inspector has a unique ID', () => {
			const inspectors = generateInspectors(10);
			const ids = inspectors.map((inspector) => inspector.id);
			const uniqueIds = new Set(ids);
			assert.equal(uniqueIds.size, inspectors.length);
		});

		test('each inspector has a valid email address', () => {
			const inspectors = generateInspectors(10);
			inspectors.forEach((inspector) => {
				assert.match(inspector.email, /.*@fake.pins.gov.uk/);
			});
		});

		test('each inspector belongs to a valid group', () => {
			const validGroups = groups.map((group) => group.name);
			const inspectors = generateInspectors(10);
			inspectors.forEach((inspector) => {
				assert.ok(validGroups.includes(inspector.groupId));
			});
		});

		test('each inspector has a display name in the correct format', () => {
			const inspectors = generateInspectors(10);
			inspectors.forEach((inspector) => {
				assert.match(inspector.displayName, /\(Test\)$/);
			});
		});
	});

	describe('newEvent', () => {
		test('creates an event with correct properties', () => {
			const user = { email: 'test.user@fake.pins.gov.uk' };
			const meetingStart = '09:00';
			const meetingEnd = '10:00';
			const date = new Date('2023-10-01T00:00:00.000Z'); //BST

			const event = newEvent(user, meetingStart, meetingEnd, date);

			assert.ok(event.id, 'Event should have an ID');
			assert.equal(event.userEmail, user.email);
			assert.ok(event.title, 'Event should have a title');
			assert.equal(event.startDate.toISOString(), '2023-10-01T08:00:00.000Z');
			assert.equal(event.endDate.toISOString(), '2023-10-01T09:00:00.000Z');
		});

		test('generates unique IDs for each event', () => {
			const user = { email: 'test.user@fake.pins.gov.uk' };
			const meetingStart = '09:00';
			const meetingEnd = '10:00';
			const date = new Date('2023-10-01T00:00:00.000Z');

			const event1 = newEvent(user, meetingStart, meetingEnd, date);
			const event2 = newEvent(user, meetingStart, meetingEnd, date);

			assert.notEqual(event1.id, event2.id, 'Event IDs should be unique');
		});

		test('formats the title as a random sentence', () => {
			const user = { email: 'test.user@fake.pins.gov.uk' };
			const meetingStart = '09:00';
			const meetingEnd = '10:00';
			const date = new Date('2023-10-01T00:00:00.000Z');

			const event = newEvent(user, meetingStart, meetingEnd, date);

			assert.ok(event.title.length > 0, 'Event title should not be empty');
		});
	});

	describe('generateMockData', () => {
		const config = {
			inspectorCount: 10,
			weeksFromToday: 2
		};
		const mockService = { logger: { info: () => {} } };
		test('generates mock data with inspectors and events', () => {
			const mockData = generateMockData(mockService, config);

			assert.ok(mockData.inspectors.length > 0, 'Should generate inspectors');
			assert.ok(mockData.events.length > 0, 'Should generate events');
		});

		test('all events have an associated inspector', () => {
			const mockData = generateMockData(mockService, config);

			const inspectorEmails = new Set(mockData.inspectors.map((inspector) => inspector.email));
			mockData.events.forEach((event) => {
				assert.ok(inspectorEmails.has(event.userEmail), `Event with ID ${event.id} should have a valid inspector`);
			});
		});

		test('events are within the specified date range', () => {
			const mockData = generateMockData(mockService, config);

			const startDate = new Date();
			const endDate = addWeeks(endOfDay(startDate), config.weeksFromToday, { in: timeZone });

			mockData.events.forEach((event) => {
				assert.ok(
					event.startDate >= startDate && event.endDate <= endDate,
					`Event with ID ${event.id} should be within the date range ${startDate.toISOString()} - ${endDate.toISOString()}, event start: ${event.startDate.toISOString()}, event end: ${event.endDate.toISOString()}`
				);
			});
		});

		test('events respect working hours', () => {
			const mockData = generateMockData(mockService, config);

			const workingHoursSet = new Set(workingHours);
			mockData.events.forEach((event) => {
				const startTime = format(event.startDate, 'HH:mm', { in: timeZone });
				const endTime = format(event.endDate, 'HH:mm', { in: timeZone });
				assert.ok(
					workingHoursSet.has(startTime) && workingHoursSet.has(endTime),
					`Event with ID ${event.id} should respect working hours`
				);
			});
		});
	});
});

/**
 *
 * @returns {import('@date-fns/tz').TZDate}
 */
function endOfDay(date) {
	return set(date, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 }, { in: timeZone });
}
