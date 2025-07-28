import { fakerEN_GB as faker } from '@faker-js/faker';
import { addDays, format, set, addWeeks } from 'date-fns';
import { tz } from '@date-fns/tz';
import { fromZonedTime } from 'date-fns-tz';

export const timeZoneName = 'Europe/London';
export const timeZone = tz(timeZoneName);

export const groups = [
	{ id: 1, name: 'Group A', targetUtilisation: 0.47 },
	{ id: 2, name: 'Group B', targetUtilisation: 0.52 },
	{ id: 3, name: 'Group C', targetUtilisation: 0.15 },
	{ id: 4, name: 'Group D', targetUtilisation: 0.23 },
	{ id: 5, name: 'Group E', targetUtilisation: 0.9 }
];

export const workingHours = timesBetween('07:00', '19:00');

// meeting lengths in 30 mins units
const weightedMeetingLengths = [
	{ weight: 100, value: 1 }, // 30 mins
	{ weight: 80, value: 2 }, // 1 hr
	{ weight: 30, value: 4 }, // 2 hr
	{ weight: 5, value: 8 } // 4 hr
];

/**
 * Generate mock data for API
 * @param {import('#service').WebService} service
 * @param {{weeksFromToday: number, inspectorCount: number}} config
 * @returns {import('../../types.d.ts').MockData}
 */
export function generateMockData(service, config) {
	const { logger } = service;
	logger.info('generating mock API data');
	const startDate = startOfTomorrow();
	const endDate = addWeeks(startDate, config.weeksFromToday, { in: timeZone });

	const weekdays = weekdayDates(startDate, endDate);
	logger.info({ start: workingHours[0], end: workingHours[workingHours.length - 1] }, 'mock API data: working hours');
	logger.info({ start: weekdays[0], end: weekdays[weekdays.length - 1] }, 'mock API data: dates');

	const inspectors = generateInspectors(config.inspectorCount);
	const events = [];
	for (const inspector of inspectors) {
		const group = groups.find((g) => g.name === inspector.groupId);
		const targetUtilisation = group.targetUtilisation;
		events.push(...eventsForUser(inspector, weekdays, targetUtilisation));
	}
	logger.info({ inspectors: inspectors.length, events: events.length }, 'mock API data: generated');
	return { inspectors, events };
}

function eventsForUser(user, workingDays, targetUtilisation) {
	const events = [];
	for (let i = 0; i < workingDays.length; i++) {
		const workingDay = workingDays[i];

		for (let j = 0; j < workingHours.length; j++) {
			const hasMeeting = faker.helpers.maybe(() => true, { probability: targetUtilisation });
			if (!hasMeeting) {
				continue;
			}
			const meetingLength = faker.helpers.weightedArrayElement(weightedMeetingLengths);
			const meetingStart = workingHours[j];
			let meetingEndIndex;
			if (j + meetingLength >= workingHours.length) {
				meetingEndIndex = workingHours.length - 1;
			} else {
				meetingEndIndex = j + meetingLength;
			}
			const meetingEnd = workingHours[meetingEndIndex];

			events.push(newEvent(user, meetingStart, meetingEnd, workingDay));
			if (j < workingHours.length) {
				j = meetingEndIndex + 1;
			}
		}
	}
	return events;
}

/**
 * @param {{email: string}} user
 * @param {string} meetingStart
 * @param {string} meetingEnd
 * @param {Date} date
 * @returns {import('../../types.d.ts').CalendarEvent}
 */
export function newEvent(user, meetingStart, meetingEnd, date) {
	const ymd = format(date, 'yyyy-MM-dd', { in: timeZone });

	const startDate = fromZonedTime(`${ymd}T${meetingStart}:00`, timeZoneName);
	const endDate = fromZonedTime(`${ymd}T${meetingEnd}:00`, timeZoneName);

	return {
		id: faker.string.uuid(),
		userEmail: user.email,
		title: faker.lorem.sentence(),
		startDate,
		endDate
	};
}

/**
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Date[]}
 */
export function weekdayDates(startDate, endDate) {
	const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday (6 = Saturday, 7 = Sunday)

	let currentDate = startDate;
	const weekdayDates = [];

	while (currentDate <= endDate) {
		const dayOfWeek = parseInt(format(currentDate, 'i', { in: timeZone })); // Get day of week as ISO (1 = Monday, 7 = Sunday)
		if (weekdays.includes(dayOfWeek)) {
			weekdayDates.push(new Date(currentDate)); // Add a copy of the date to the array
		}
		currentDate = addDays(currentDate, 1, { in: timeZone }); // Move to the next day
	}

	return weekdayDates;
}

/**
 * @param {string} start
 * @param {string} end
 * @returns {string[]}
 */
export function timesBetween(start, end) {
	const times = [];
	let currentDate = new Date(`2021-01-01T${start}:00Z`);
	const endDate = new Date(`2021-01-01T${end}:00Z`);

	while (currentDate <= endDate) {
		times.push(currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
		currentDate.setMinutes(currentDate.getMinutes() + 30);
	}

	return times;
}

/**
 * @param {number} count
 * @returns {import('../../types.d.ts').Inspector[]}
 */
export function generateInspectors(count = 10) {
	/** @type {import('../../types.d.ts').Inspector[]} */
	const inspectors = [];
	for (let i = 0; i < count; i++) {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		inspectors.push({
			id: faker.string.uuid(),
			displayName: `${firstName} ${lastName} (Test)`,
			email: faker.internet.email({ firstName, lastName, provider: 'fake.pins.gov.uk' }),
			groupId: faker.helpers.arrayElement(groups).name
		});
	}
	return inspectors;
}

/**
 *
 * @returns {import('@date-fns/tz').TZDate}
 */
export function startOfTomorrow() {
	// start from tomorrow
	let date = addDays(new Date(), 1, { in: timeZone });
	// set to start of the day
	return set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }, { in: timeZone });
}
