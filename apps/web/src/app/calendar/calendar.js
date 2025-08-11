/**
 *
 * @param {import('@pins/inspector-programming-lib/graph/types.js').InitEntraClient} initEntraClient
 * @param {import('src/app/inspector/types.js').Inspector} selectedInspector
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

	const eventsResponse = await client.getEvents(selectedInspector.id);
	const events = Array.isArray(eventsResponse.value) ? eventsResponse.value : [];

	return events.map((event) => {
		const startDateTime = new Date(event.start.dateTime);
		const endDateTime = new Date(event.end.dateTime);
		const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
		const roundedDurationMinutes = Math.ceil(durationMinutes / 30) * 30;
		const adjustedEndDateTime = new Date(startDateTime.getTime() + roundedDurationMinutes * 60 * 1000);

		return {
			subject: event.subject,
			startDateTime: startDateTime.toISOString(),
			endDateTime: adjustedEndDateTime.toISOString()
		};
	});
}

/**
 *
 * @returns {Date}
 */
export function getCurrentWeekStartDate() {
	const startDate = new Date();
	startDate.setHours(0, 0, 0, 0);
	while (startDate.getDay() !== 1) {
		startDate.setDate(startDate.getDate() - 1);
	}

	return startDate;
}

/**
 *
 * @param {Date} startDate
 * @return {string}
 */
export function generateWeekTitle(startDate) {
	const weekEndDate = new Date(startDate);
	weekEndDate.setDate(weekEndDate.getDate() + 6);
	weekEndDate.setHours(23, 59, 59, 999);
	if (startDate.getFullYear() != weekEndDate.getFullYear()) {
		return `${('0' + startDate.getDate()).slice(-2)} ${startDate.toLocaleString('en-US', { month: 'long' })}, ${startDate.getFullYear()}-${('0' + weekEndDate.getDate()).slice(-2)} ${weekEndDate.toLocaleString('en-US', { month: 'long' })}, ${weekEndDate.getFullYear()}`;
	} else if (startDate.getMonth() != weekEndDate.getMonth()) {
		return `${('0' + startDate.getDate()).slice(-2)} ${startDate.toLocaleString('en-US', { month: 'long' })}-${('0' + weekEndDate.getDate()).slice(-2)} ${weekEndDate.toLocaleString('en-US', { month: 'long' })}, ${weekEndDate.getFullYear()}`;
	}
	return `${('0' + startDate.getDate()).slice(-2)}-${('0' + weekEndDate.getDate()).slice(-2)} ${weekEndDate.toLocaleString('en-US', { month: 'long' })}, ${weekEndDate.getFullYear()}`;
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
			isToday: false
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
		const dayIndex = today.getDay() - 1 != -1 ? today.getDay() - 1 : 6; // Monday = 0, Sunday = 6

		for (let i = 0; i < calendarGrid.length; i++) {
			calendarGrid[i][dayIndex].isToday = true;
		}
	}

	if (events) {
		events.forEach((event) => {
			const start = new Date(event.startDateTime);
			const end = new Date(event.endDateTime);

			if (start.getTime() >= startDate.getTime() && start.getTime() <= weekEndDate.getTime()) {
				const dayIndex = start.getDay() - 1 != -1 ? start.getDay() - 1 : 6; // Monday = 0, Sunday = 6
				const startHour = start.getHours();
				const startMinutes = start.getMinutes();
				const endHour = end.getHours();
				const endMinutes = end.getMinutes();

				const startRow = (startHour - 8) * 2 + (startMinutes === 30 ? 1 : 0);
				const endRow = (endHour - 8) * 2 + (endMinutes === 30 ? 1 : 0);

				const validStartRow = Math.max(0, startRow);
				for (let i = validStartRow; i <= endRow && i < calendarGrid.length; i++) {
					calendarGrid[i][dayIndex].text = i == startRow ? event.subject : '';
					calendarGrid[i][dayIndex].isEvent = true;
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
	const newStartDate = new Date(currentStartDate);
	newStartDate.setDate(newStartDate.getDate() - 7);
	return newStartDate;
}

/**
 *
 * @param {Date} currentStartDate
 * @return {Date}
 */
export function getNextWeekStartDate(currentStartDate) {
	const newStartDate = new Date(currentStartDate);
	newStartDate.setDate(newStartDate.getDate() + 7);
	return newStartDate;
}
