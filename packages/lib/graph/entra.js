import { URL } from 'node:url';

const PER_PAGE = 500; // max 999 per page
const MAX_PAGES = 10; // max 5000 entries

// Extension id
// singleValueExtendedProperty ID for inspector programming extension data
// GUID is "PS_PUBLIC_STRINGS" - https://learn.microsoft.com/en-us/office/client-developer/outlook/mapi/commonly-used-property-sets
export const EXTENSION_ID = 'String {00020329-0000-0000-c000-000000000046} Name InspectorProgramming';

// odata reference properties and values
export const ODATA = Object.freeze({
	NEXT_LINK: '@odate.nextLink',
	TYPE: '@odata.type',
	GROUP_TYPE: '#microsoft.graph.group',
	USER_TYPE: '#microsoft.graph.user',
	EVENT_TYPE: '#microsoft.graph.event'
});

export class EntraClient {
	/** @type {import('@microsoft/microsoft-graph-client').Client} */
	#client;

	/**
	 * @param {import('@microsoft/microsoft-graph-client').Client} client
	 */
	constructor(client) {
		this.#client = client;
	}

	/**
	 * Fetch all group members - direct and indirect - of an Entra group, up to a maximum of 5000
	 *
	 * @param {string} groupId
	 * @returns {Promise<import('./types').GroupMember[]>}
	 */
	async listAllGroupMembers(groupId) {
		const listMembers = this.#client
			.api(`groups/${groupId}/transitiveMembers`)
			.select(['id', 'displayName', 'givenName', 'surname', 'mail'])
			.top(PER_PAGE);

		const members = [];
		for (let i = 0; i < MAX_PAGES; i++) {
			const res = await listMembers.get();
			members.push(...res.value.filter((v) => v[ODATA.TYPE] === ODATA.USER_TYPE));

			const nextLink = res[ODATA.NEXT_LINK];
			if (!nextLink) {
				break;
			}
			// make the next request with the skipToken value to fetch the next page
			const token = EntraClient.extractSkipToken(nextLink);
			listMembers.skipToken(token);
		}
		return members;
	}

	/**
	 * @param {string} userId
	 * @param {boolean} [fetchExtension]
	 * @returns {Promise<import('./types').CalendarEvents>}
	 * @param {Date | null} [startDate]
	 * @param {Date | null} [endDate]
	 */
	async getUserCalendarEvents(userId, fetchExtension = false, startDate = null, endDate = null) {
		if (!startDate) {
			startDate = new Date();
			startDate.setHours(0, 0, 0, 0);
			while (startDate.getDay() !== 1) {
				startDate.setDate(startDate.getDate() - 1);
			}
		}
		if (!endDate) {
			endDate = new Date(startDate);
			endDate.setDate(endDate.getDate() + 6);
			endDate.setHours(23, 59, 59, 999);
		}

		let request = this.#client
			.api(`/users/${userId}/calendarView`)
			.query({
				startDateTime: startDate.toISOString(),
				endDateTime: endDate.toISOString()
			})
			.top(999)
			.select(['id', 'subject', 'start', 'end', 'isAllDay', 'showAs', 'location'])
			.header('Prefer', 'outlook.timezone="Europe/London"');

		if (fetchExtension) {
			// we don't fetch extensions by default as it seems to fail when using delegate permissions
			request = request.expand([`singleValueExtendedProperties($filter=id eq '${EXTENSION_ID}')`]);
		}

		return request.get();
	}

	/**
	 * Fetch all calendar events for a given Entra userID
	 *
	 * @param {string} userId
	 * @param {{calendarEventsDayRange: number, calendarEventsFromDateOffset: number, fetchExtension?: boolean}} options // configuration of date range to fetch
	 * @returns {Promise<import('./types').CalendarEvent[]>}
	 */
	async listAllUserCalendarEvents(userId, options) {
		const [fromDate, toDate] = [new Date(), new Date()];
		toDate.setUTCDate(toDate.getUTCDate() - +options.calendarEventsDayRange);
		fromDate.setUTCDate(fromDate.getUTCDate() + +options.calendarEventsFromDateOffset || 0);
		toDate.setUTCHours(0, 0, 0, 0);
		fromDate.setUTCHours(23, 59, 59, 999);

		let listEvents = this.#client
			.api(`users/${userId}/calendarView`)
			.query({ startDateTime: toDate.toISOString(), endDateTime: fromDate.toISOString() })
			.select(['id', 'subject', 'start', 'end', 'isAllDay', 'showAs', 'sensitivity'])
			.top(PER_PAGE);
		if (options.fetchExtension) {
			listEvents = listEvents.expand([`singleValueExtendedProperties($filter=id eq '${EXTENSION_ID}')`]);
		}

		const events = [];
		for (let i = 0; i < MAX_PAGES; i++) {
			const res = await listEvents.get();
			if (res.value?.length) events.push(...res.value);

			const nextLink = res[ODATA.NEXT_LINK];
			if (!nextLink) {
				break;
			}
			// make the next request with the skipToken value to fetch the next page
			const token = EntraClient.extractSkipToken(nextLink);
			listEvents.skipToken(token);
		}
		return events.flat();
	}

	/**
	 * Create calendar event in outlooks
	 * @param {import('./types').CalendarEventInput} event
	 * @param {string} userId
	 */
	async createCalendarEvent(event, userId) {
		await this.#client.api(`users/${userId}/calendar/events`).post(event);
	}

	/**
	 * Get a skip token out of an '@odata.nextLink' value
	 *
	 * @param {string} link
	 * @returns {string|undefined}
	 */
	static extractSkipToken(link) {
		const url = URL.parse(link);
		if (!url) {
			return undefined;
		}
		for (const [k, v] of url.searchParams) {
			if (k.toLowerCase() === '$skiptoken') {
				return v;
			}
		}
	}
}
