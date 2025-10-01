import { addDays, addWeeks, format, subDays, subWeeks } from 'date-fns';
import { tz } from '@date-fns/tz';

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
 * @returns {Promise<import("./types").Event[]>}
 */

export async function getSimplifiedEvents(initEntraClient, selectedInspector, authSession, logger) {
	const client = initEntraClient(authSession);

	if (!client) {
		logger.warn('Skipping calendar, no Entra Client');
		return [];
	}

	const eventsResponse = await client.getUserCalendarEvents(selectedInspector.id);
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
 * @returns {Promise<import('./types').CalendarEventInput[]>}
 */
export async function generateCaseCalendarEvents(service, assignmentDate, caseIds) {
	/** @type {import('./types').CalendarEventInput[]} */
	const allEvents = [];
	const timingRules = await service.calendarClient.getAllCalendarEventTimingRules();
	for (let caseId of caseIds) {
		const fullCase = await service.casesClient.getCaseById(caseId);
		if (!fullCase) throw new Error('Case details could not be fetched for case: ' + caseId);

		const rule = matchTimingRuleToCase(timingRules, fullCase);
		if (!rule) throw new Error('No timing rules matching case: ' + caseId);

		const events = generateEvents(rule.CalendarEventTiming, fullCase, assignmentDate);
		allEvents.push(...events);
	}
	return allEvents;
}

/**
 * matches a timing rule to a given case
 * @param {import('@pins/inspector-programming-database/src/client').Prisma.CalendarEventTimingRuleGetPayload<{ include: { CalendarEventTiming: true} }>[]} timingRules
 * @param {import('@pins/inspector-programming-lib/data/types').CaseViewModel} fullCase
 * @returns {import('@pins/inspector-programming-database/src/client').Prisma.CalendarEventTimingRuleGetPayload<{ include: { CalendarEventTiming: true} }> | undefined}
 */
function matchTimingRuleToCase(timingRules, fullCase) {
	const found = fullCase
		? timingRules.find(
				(r) =>
					r.caseProcedure === fullCase.caseProcedure &&
					r.allocationLevel === fullCase.caseLevel &&
					r.caseType === fullCase.caseType
			)
		: undefined;
	return found;
}

/**
 * generates calendar event json objects for all stages of the case programming process
 * @param {import('@pins/inspector-programming-database/src/client').CalendarEventTiming} timingRule
 * @param {import('@pins/inspector-programming-lib/data/types').CaseViewModel} fullCase
 * @param {string} assignmentDate
 * @returns {import('./types').CalendarEventInput[]}
 */
function generateEvents(timingRule, fullCase, assignmentDate) {
	/** @type {import('./types').CalendarEventInput[]} */
	const events = [];

	for (let stage of Object.values(CALENDAR_EVENT_STAGES)) {
		//if timing rule doesn't include current stage then skip
		const stageTime = stageLookup(stage, timingRule);
		if (stageTime === null)
			throw new Error('Invalid appeals stage while generating calendar events. Ensure app is correctly configured.');
		if (!(+stageTime > 0)) continue;

		const startDate = getCalendarEventStartDate(stage, assignmentDate);
		const event = buildEventJson(
			{
				subject: `${fullCase.caseReference} - ${fullCase.caseType} - ${fullCase.lpaName} - ${stage} - ${String(stageTime)}`,
				startTime: startDate.toISOString(), //placeholder
				endTime: startDate.toISOString(), //placeholder
				streetAddress: '1 smith way',
				postcode: 'pe24 4ff'
			},
			{
				caseReference: fullCase.caseReference ?? undefined,
				eventType: stage
			}
		);
		events.push(event);
	}
	return events;
}

/**
 * fetches the correct date to schedule the given stage of the casework process for
 * @param {string} stage
 * @param {string} assignment
 * @returns
 */
function getCalendarEventStartDate(stage, assignment) {
	//TODO	-	handling time zones to come in ppb-157
	const assignmentDate = new Date(assignment);
	if (stage === CALENDAR_EVENT_STAGES.PREP) assignmentDate.setDate(assignmentDate.getDate() - 1);
	else if (stage === CALENDAR_EVENT_STAGES.REPORT) assignmentDate.setDate(assignmentDate.getDate() + 1);
	else if (stage === CALENDAR_EVENT_STAGES.COSTS) assignmentDate.setDate(assignmentDate.getDate() + 2);
	return assignmentDate;
}

/**
 * stops jsdoc complaining about using a string to index the timingRule object
 * @param {string} stageString
 * @param {import('@pins/inspector-programming-database/src/client').CalendarEventTiming} timingRule
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
 * @param {{subject: string, startTime: string, endTime: string, streetAddress: string, postcode: string}} event
 * @param {{caseReference?: string, eventType?: string}} extensionProps - extensions have no fixed schema - extension properties are optional and are omitted if not provided
 * @returns {import('./types').CalendarEventInput}
 */
function buildEventJson(event, extensionProps) {
	return {
		subject: event.subject,
		start: {
			dateTime: event.startTime, //toIsoString
			timeZone: 'UTC'
		},
		end: {
			dateTime: event.endTime,
			timeZone: 'UTC'
		},
		location: {
			address: {
				street: event.streetAddress,
				postalCode: event.postcode
			}
		},
		extensions: [
			{
				'@odata.type': 'microsoft.graph.openTypeExtension',
				extensionName: 'uk.gov.planninginspectorate.programming',
				...extensionProps
			}
		]
	};
}
