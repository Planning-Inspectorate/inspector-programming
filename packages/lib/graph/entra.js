import { URL } from 'node:url';

const PER_PAGE = 500; // max 999 per page
const MAX_PAGES = 10; // max 5000 entries

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
	 * Fetch all group members - direct and indirect - of an Entra group, up to a maximum of 500 per page
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
	 * Fetch all group members - direct and indirect - of an Entra group, up to a maximum of 5000
	 *
	 * @param {string} userId
	 * @param {number} calendarEventsDayRange
	 * @returns {Promise<import('./types').CalendarEvent[]>}
	 */
	async listAllUserCalendarEvents(userId, calendarEventsDayRange) {
		const startDate = new Date();
		startDate.setUTCHours(0, 0, 0, 0);
		startDate.setDate(startDate.getDate() - calendarEventsDayRange);

		const listEvents = this.#client
			.api(`users/${userId}/calendarView`)
			.query({ startDateTime: startDate.toISOString(), endDateTime: new Date().toISOString() })
			.select(['id', 'subject', 'start', 'end'])
			.top(PER_PAGE);

		const events = [];
		for (let i = 0; i < MAX_PAGES; i++) {
			const res = await listEvents.get();
			if (res.value?.length) events.push(res.value);

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
