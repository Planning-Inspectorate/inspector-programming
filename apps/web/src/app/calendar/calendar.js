import { addDays, addHours, addWeeks, format, setHours, subDays, subWeeks } from 'date-fns';
import { tz } from '@date-fns/tz';
import { EXTENSION_ID } from '@pins/inspector-programming-lib/graph/entra.js';
import { fromZonedTime } from 'date-fns-tz';

const timeZoneName = 'Europe/London';
const timeZone = tz(timeZoneName);

//values are the strings used for eventType on submitted calendar events
export const CALENDAR_EVENT_STAGES = {
	PREP: 'prep',
	SITE_VISIT: 'siteVisit',
	REPORT: 'report',
	COSTS: 'costs'
};

/**
 *
 * @param {import('@pins/inspector-programming-lib/graph/types.js').InitEntraClient} initEntraClient
 * @param {import('@pins/inspector-programming-lib/data/types.js').InspectorViewModel} selectedInspector
 * @param {import('src/app/auth/session.service.js').SessionWithAuth} authSession
 * @param {import('pino').Logger} logger
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<import("./types").Event[]>}
 */

export async function getSimplifiedEvents(initEntraClient, selectedInspector, authSession, logger, startDate, endDate) {
	const client = initEntraClient(authSession);
	if (!client) {
		logger.warn('Skipping calendar, no Entra Client');
		return [];
	}

	const eventsResponse = await client.getUserCalendarEvents(selectedInspector.id, false, startDate, endDate);
	const events = Array.isArray(eventsResponse.value) ? eventsResponse.value : [];

	return events.map((event) => {
		const startDateTime = new Date(event.start.dateTime);
		const endDateTime = new Date(event.end.dateTime);

		if (startDateTime.getHours() < 8) {
			startDateTime.setHours(8, 0);
		} else {
			const roundedStartMinutes = Math.floor(startDateTime.getMinutes() / 30) * 30;
			startDateTime.setMinutes(roundedStartMinutes);
		}

		if (endDateTime.getHours() >= 18 || event.isAllDay) {
			endDateTime.setHours(18, 0);
		} else {
			const roundedEndMinutes = Math.ceil(endDateTime.getMinutes() / 30) * 30;
			endDateTime.setMinutes(roundedEndMinutes);
		}

		const minuteDifference = (endDateTime.getTime() - startDateTime.getTime()) / 1000 / 60;

		let address = '';
		if (event.location.address && minuteDifference > 30) {
			if (event.location.address.street) address = address.concat(`${event.location.address.street} `);
			if (event.location.address.city) address = address.concat(`${event.location.address.city} `);
			if (event.location.address.state) address = address.concat(`${event.location.address.state} `);
			if (event.location.address.countyOrRegion) address = address.concat(`${event.location.address.countyOrRegion} `);
			if (event.location.address.postalCode) address = address.concat(`${event.location.address.postalCode}`);
		}

		return {
			subject: event.subject,
			startDateTime: startDateTime.toISOString(),
			endDateTime: endDateTime.toISOString(),
			status: event.showAs ? event.showAs : '',
			location: address == '' ? event.location.displayName : '',
			address: address.trim()
		};
	});
}

/**
 * @param {Date} date
 * @returns {Date}
 */
export function getWeekStartDate(date) {
	let startDate = new Date(date);
	startDate.setHours(0, 0, 0, 0);
	while (startDate.getDay() !== 1) {
		startDate = subDays(startDate, 1, { in: timeZone });
	}

	return startDate;
}

/**
 *
 * @param {Date} startDate
 * @return {string}
 */
export function generateWeekTitle(startDate) {
	const weekEndDate = addDays(startDate, 6, { in: timeZone });
	weekEndDate.setHours(23, 59, 59, 999);
	if (startDate.getFullYear() != weekEndDate.getFullYear()) {
		return `${('0' + startDate.getDate()).slice(-2)} ${startDate.toLocaleString('en-US', { month: 'long' })}, ${startDate.getFullYear()} - ${('0' + weekEndDate.getDate()).slice(-2)} ${weekEndDate.toLocaleString('en-US', { month: 'long' })}, ${weekEndDate.getFullYear()}`;
	} else if (startDate.getMonth() != weekEndDate.getMonth()) {
		return `${('0' + startDate.getDate()).slice(-2)} ${startDate.toLocaleString('en-US', { month: 'long' })} - ${('0' + weekEndDate.getDate()).slice(-2)} ${weekEndDate.toLocaleString('en-US', { month: 'long' })}, ${weekEndDate.getFullYear()}`;
	}
	return `${('0' + startDate.getDate()).slice(-2)} - ${('0' + weekEndDate.getDate()).slice(-2)} ${weekEndDate.toLocaleString('en-US', { month: 'long' })}, ${weekEndDate.getFullYear()}`;
}

/**
 * @param {Date} startDate
 * @returns {string[]}
 */
export function generateDatesList(startDate) {
	let datesList = [];

	for (let i = 0; i < 7; i++) {
		const day = new Date(startDate);
		day.setDate(day.getDate() + i);
		datesList.push(`${('0' + day.getDate()).slice(-2)} ${day.toLocaleString('en-US', { weekday: 'short' })}`);
	}

	return datesList;
}

/**
 *
 * @param {number} minHour
 * @param {number} maxHour
 * @returns  {string[]}
 */
export function generateTimeList(minHour, maxHour) {
	let timeList = [];
	for (let hour = minHour; hour < maxHour; hour++) {
		timeList.push(`${hour}:00`);
	}

	return timeList;
}

/**
 *
 * @param {number} rows
 * @param {number} columns
 * @returns {import('./types').CalendarEntry[][]}
 */
export function generateCalendarGrid(rows, columns) {
	return Array.from({ length: columns }, () =>
		Array.from({ length: rows }, () => ({
			text: '',
			isEvent: false,
			isToday: false,
			status: '',
			location: '',
			address: ''
		}))
	);
}

/**
 *
 * @param {Date} startDate
 * @param {import("./types").Event[]} events
 * @returns {import('./types').CalendarEntry[][]}
 */
export function generateCalendar(startDate, events) {
	let calendarGrid = generateCalendarGrid(7, 20);
	const today = new Date();
	const weekEndDate = new Date(startDate);
	weekEndDate.setDate(weekEndDate.getDate() + 6);
	weekEndDate.setHours(23, 59, 59, 999);

	if (today.getTime() >= startDate.getTime() && today.getTime() <= weekEndDate.getTime()) {
		const dayIndex = parseInt(format(today, 'i', { in: timeZone })) - 1; // Monday = 0, Sunday = 6

		for (let i = 0; i < calendarGrid.length; i++) {
			calendarGrid[i][dayIndex].isToday = true;
		}
	}

	if (events) {
		events.forEach((event) => {
			const start = new Date(event.startDateTime);
			const end = new Date(event.endDateTime);

			if (start.getTime() >= startDate.getTime() && start.getTime() <= weekEndDate.getTime()) {
				const dayIndex = parseInt(format(start, 'i', { in: timeZone })) - 1; // Monday = 0, Sunday = 6
				const startHour = start.getHours();
				const startMinutes = start.getMinutes();
				const endHour = end.getHours();
				const endMinutes = end.getMinutes();

				const startRow = (startHour - 8) * 2 + (startMinutes === 30 ? 1 : 0);
				const endRow = (endHour - 8) * 2 + (endMinutes === 30 ? 0 : -1);

				const validStartRow = Math.max(0, startRow);
				for (let i = validStartRow; i <= endRow && i < calendarGrid.length; i++) {
					calendarGrid[i][dayIndex].text = i == startRow ? event.subject : '';
					calendarGrid[i][dayIndex].location = i == startRow ? event.location : '';
					calendarGrid[i][dayIndex].address = i == startRow + 1 ? event.address : '';
					calendarGrid[i][dayIndex].isEvent = true;
					calendarGrid[i][dayIndex].status = event.status;
				}
			}
		});
	}

	return calendarGrid;
}

/**
 *
 * @param {Date} currentStartDate
 * @return {Date}
 */
export function getPreviousWeekStartDate(currentStartDate) {
	return subWeeks(currentStartDate, 1, { in: timeZone });
}

/**
 *
 * @param {Date} currentStartDate
 * @return {Date}
 */
export function getNextWeekStartDate(currentStartDate) {
	return addWeeks(currentStartDate, 1, { in: timeZone });
}

/**
 * generates the calendar events after assigning a set of cases to an inspector
 * @param {import('#service').WebService} service
 * @param {string} assignmentDate
 * @param {number[]} caseIds
 * @returns {Promise<import('@pins/inspector-programming-lib/graph/types.js').CalendarEventInput[]>}
 */
export async function generateCaseCalendarEvents(service, assignmentDate, caseIds) {
	/** @type {import('@pins/inspector-programming-lib/graph/types.js').CalendarEventInput[]} */
	const allEvents = [];
	/** @type {import('./types').BookedEventTimeslot[]} */
	const inspectorEvents = [];
	const assignment = new Date(assignmentDate);

	//fetch info from calendar client
	const timingRules = await service.calendarClient.getAllCalendarEventTimingRules();
	let bankHolidays = await service.calendarClient.getEnglandWalesBankHolidays();

	//filter down the number of bank holiday dates if we dont expect to have to check them when allocating times for our events
	bankHolidays = bankHolidays?.length
		? bankHolidays.filter((holiday) => {
				let [holidayDate, pastLimit, futureLimit] = [
					new Date(holiday),
					new Date(assignmentDate),
					new Date(assignmentDate)
				];
				pastLimit = subDays(pastLimit, 10, { in: timeZone });
				futureLimit = addDays(futureLimit, 60, { in: timeZone });
				return holidayDate > pastLimit && holidayDate < futureLimit;
			})
		: [];

	const bankHolidayEvents = compileBankHolidays(bankHolidays);

	//we want to iterate stages FIRST - go through a stage for all cases before moving onto the next
	//then they can be grouped by stage in the calendar
	for (let stage of Object.values(CALENDAR_EVENT_STAGES)) {
		//get the date to start from based on current stage
		const stageStartDate = getStageStartDate(stage, assignment, inspectorEvents);

		for (let caseId of caseIds) {
			//will be cached
			const fullCase = await service.casesClient.getCaseById(caseId);
			if (!fullCase) throw new Error('Case details could not be fetched for case: ' + caseId);

			const rule = matchTimingRuleToCase(timingRules, fullCase);
			if (!rule) throw new Error('No timing rules matching case: ' + caseId);

			//if timing rule doesn't include current stage then skip
			const stageTime = stageLookup(stage, rule.CalendarEventTiming);
			if (stageTime === null)
				throw new Error('Invalid appeals stage while generating calendar events. Ensure app is correctly configured.');
			if (!(+stageTime > 0)) continue;

			const events = generateEvents(stage, stageTime, fullCase, stageStartDate, inspectorEvents, bankHolidayEvents);
			allEvents.push(...events);
		}
	}
	return allEvents;
}

/**
 * Map bank holiday dates into a BookedEventTimeslot
 *
 * @param {string[]} bankHolidays
 * @returns {import('./types').BookedEventTimeslot[]}
 */
function compileBankHolidays(bankHolidays) {
	return bankHolidays.map((holidayString) => {
		return {
			startTime: setHours(new Date(holidayString), 0, { in: timeZone }),
			endTime: setHours(new Date(holidayString), 23, { in: timeZone })
		};
	});
}

/**
 *
 * @param {string} stage
 * @param {Date} assignment
 * @param {import('./types').BookedEventTimeslot[]} inspectorEvents
 */
function getStageStartDate(stage, assignment, inspectorEvents) {
	let startDate = new Date(assignment);
	if (stage === CALENDAR_EVENT_STAGES.PREP) {
		return subDays(startDate, 1, { in: timeZone });
	}

	if (!inspectorEvents || inspectorEvents.length === 0) {
		return startDate;
	}

	inspectorEvents.sort((a, b) => +fromZonedTime(b.startTime, timeZoneName) - +fromZonedTime(a.startTime, timeZoneName));
	startDate = fromZonedTime(inspectorEvents[0].startTime, timeZoneName);

	return addDays(startDate, 1, { in: timeZone });
}

/**
 * matches a timing rule to a given case
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.CalendarEventTimingRuleGetPayload<{ include: { CalendarEventTiming: true} }>[]} timingRules
 * @param {import('@pins/inspector-programming-lib/data/types').CaseViewModel} fullCase
 * @returns {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.CalendarEventTimingRuleGetPayload<{ include: { CalendarEventTiming: true} }> | undefined}
 */
function matchTimingRuleToCase(timingRules, fullCase) {
	return fullCase
		? timingRules.find(
				(r) =>
					r.caseProcedure.toLowerCase() === fullCase.caseProcedure?.toLowerCase() &&
					r.allocationLevel === fullCase.caseLevel &&
					r.caseType === fullCase.caseType
			)
		: undefined;
}

/**
 * generates calendar event json objects for all stages of the case programming process
 * @param {string} stage
 * @param {number} stageTime
 * @param {import('@pins/inspector-programming-lib/data/types').CaseViewModel} fullCase
 * @param {Date} assignment
 * @param {import('./types').BookedEventTimeslot[]} inspectorEvents
 * @param {import('./types').BookedEventTimeslot[]} bankHolidayEvents
 * @returns {import('@pins/inspector-programming-lib/graph/types.js').CalendarEventInput[]}
 */
function generateEvents(stage, stageTime, fullCase, assignment, inspectorEvents, bankHolidayEvents) {
	/** @type {import('@pins/inspector-programming-lib/graph/types.js').CalendarEventInput[]} */
	const events = [];

	//check if stage needs to be split into multiple events due to length
	const stageTimes = splitLongEvents(stageTime);

	for (const time of stageTimes) {
		while (
			!eventFitsIntoDay([...inspectorEvents, ...bankHolidayEvents], assignment, time) ||
			[0, 6].includes(assignment.getDay())
		) {
			assignment = offsetEventByOne(stage, assignment);
		}

		const eventTimings = allocateCalendarEventTime(assignment, inspectorEvents, time);
		const event = buildEventJson(
			{
				subject: `${fullCase.caseReference} - ${fullCase.caseType} - ${fullCase.lpaName} - ${stage} - ${String(time)}`,
				startTime: eventTimings.startTime.toISOString(),
				endTime: eventTimings.endTime.toISOString(),
				streetAddress: null, //TBC: CaseViewModel only has postcode currently
				postcode: fullCase.siteAddressPostcode
			},
			{
				caseReference: fullCase.caseReference ?? undefined,
				eventType: stage
			}
		);
		events.push(event);
		inspectorEvents.push(eventTimings);
	}
	return events;
}

/**
 * check if there is enough time in the desired date to allocate a calendar event of the desired length
 * @param {import('./types').BookedEventTimeslot[]} inspectorEvents
 * @param {Date} assignmentDate
 * @param {number} eventLength
 * @returns {boolean}
 */
function eventFitsIntoDay(inspectorEvents, assignmentDate, eventLength) {
	const clone = new Date(assignmentDate);
	const eventsThatDay = inspectorEvents.filter((e) => isSameDay(clone, e.startTime));
	let hoursThatDay = eventLength;
	eventsThatDay.forEach((e) => {
		const diffHours = (+e.endTime - +e.startTime) / (1000 * 60 * 60);
		hoursThatDay += diffHours;
	});
	return hoursThatDay <= 8;
}

/**
 *
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
function isSameDay(date1, date2) {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

/**
 * events longer than 8h must be split into chunks of maximum 8 hours
 * processes a raw eventLength and splits into chunks of 8 hours to be iterated over
 * @param {number} eventLength
 */
function splitLongEvents(eventLength) {
	const events = [];
	if (eventLength > 8) {
		let fullDayEventsCount = Math.floor(eventLength / 8);
		while (fullDayEventsCount > 0) {
			events.push(8);
			fullDayEventsCount--;
		}
		const remainingEventTime = eventLength % 8;
		if (remainingEventTime) events.push(remainingEventTime);
	} else {
		events.push(eventLength);
	}
	return events;
}

/**
 * offsets a date by one day in the appropriate direction based on the stage we are scheduling for
 * prep events move backwards, all others move forwards
 * @param {string} stage
 * @param {Date} assignment
 * @returns {Date}
 */
function offsetEventByOne(stage, assignment) {
	return stage === CALENDAR_EVENT_STAGES.PREP
		? subDays(assignment, 1, { in: timeZone })
		: addDays(assignment, 1, { in: timeZone });
}

/**
 * fetches the correct date to schedule the given stage of the casework process for
 * creates a clone of assignment so we dont change the one from generateEvents - we keep it scoped to this stage we are currently on
 * @param {Date} assignment
 * @param {import('./types').BookedEventTimeslot[]} inspectorEvents
 * @param {number} eventLength
 * @returns {import('./types').BookedEventTimeslot}
 */
function allocateCalendarEventTime(assignment, inspectorEvents, eventLength) {
	let assignmentDate = fromZonedTime(assignment, timeZoneName);
	assignmentDate = setHours(assignmentDate, 9, { in: timeZone });
	let assignmentEnd = setHours(assignmentDate, 9 + eventLength, { in: timeZone });

	//check provisionally allocated slot against other events in inspector calendar and re-allocate as required
	while (eventOverlaps(assignmentDate, assignmentEnd, inspectorEvents)) {
		assignmentDate = addHours(assignmentDate, 1, { in: timeZone });
		assignmentEnd = addHours(assignmentEnd, 1, { in: timeZone });
	}

	return { startTime: assignmentDate, endTime: assignmentEnd };
}

/**
 * checks through the list of booked slots to see if the prospective slot has already been taken
 * this algorithm relies on checking the other date's orientation around the fixed points in time we have: start and end dates
 * As a general rule we can say: if the OTHER event wraps around our point in time (start date and end date of each) then it overlaps with our event
 * @param {Date} prospectiveStartTime
 * @param {Date} prospectiveEndTime
 * @param {import('./types').BookedEventTimeslot[]} bookedTimeslots
 */
function eventOverlaps(prospectiveStartTime, prospectiveEndTime, bookedTimeslots) {
	for (const slot of bookedTimeslots) {
		if (prospectiveStartTime <= slot.startTime && prospectiveEndTime > slot.startTime) return true; //start date of existing event
		if (slot.startTime <= prospectiveStartTime && slot.endTime > prospectiveStartTime) return true; //start date of prospective event
		if (prospectiveEndTime >= slot.endTime && prospectiveStartTime < slot.endTime) return true; //end date of existing event
		if (slot.endTime >= prospectiveEndTime && slot.startTime < prospectiveEndTime) return true; //end date of prospective event
	}
	return false;
}

/**
 * stops jsdoc complaining about using a string to index the timingRule object
 * @param {string} stageString
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').CalendarEventTiming} timingRule
 * @returns {number | null}
 */
function stageLookup(stageString, timingRule) {
	switch (stageString) {
		case CALENDAR_EVENT_STAGES.PREP:
			return timingRule.prepTime;
		case CALENDAR_EVENT_STAGES.SITE_VISIT:
			return timingRule.siteVisitTime;
		case CALENDAR_EVENT_STAGES.REPORT:
			return timingRule.reportTime;
		case CALENDAR_EVENT_STAGES.COSTS:
			return timingRule.costsTime;
		default:
			return null;
	}
}

/**
 * helper function that returns a calendar event json object from an object containing event info
 * @param {{subject: string, startTime: string, endTime: string, streetAddress: string|null, postcode: string|null}} event
 * @param {{caseReference?: string, eventType?: string}} extensionProps - extensions have no fixed schema - extension properties are optional and are omitted if not provided
 * @returns {import('@pins/inspector-programming-lib/graph/types.js').CalendarEventInput}
 */
function buildEventJson(event, extensionProps) {
	return {
		subject: event.subject,
		start: {
			dateTime: event.startTime,
			timeZone: 'GMT Standard Time'
		},
		end: {
			dateTime: event.endTime,
			timeZone: 'GMT Standard Time'
		},
		location: {
			address: {
				street: event.streetAddress,
				postalCode: event.postcode
			}
		},
		singleValueExtendedProperties: [
			{
				id: EXTENSION_ID,
				value: JSON.stringify(extensionProps)
			}
		]
	};
}

/**
 *
 * @param {import('@pins/inspector-programming-lib/graph/types.js').InitEntraClient} initEntraClient
 * @param {import('@pins/inspector-programming-lib/graph/types.js').CalendarEventInput[]} events
 * @param {import('src/app/auth/session.service.js').SessionWithAuth} authSession
 * @param {string} inspectorId
 * @param {import('pino').Logger} logger
 */
export async function submitCalendarEvents(initEntraClient, events, authSession, inspectorId, logger) {
	const client = initEntraClient(authSession);

	try {
		if (!client) {
			throw new Error(`No entra client initialised`);
		}

		await client.createCalendarEvents(events, inspectorId);
	} catch (error) {
		logger.error(`Error creating adding calendar events to outlook: ${error}`);
		throw new Error(`Error creating adding calendar events to outlook: ${error}`);
	}
}
