/**
 * Client for fetching calendar-related data from the Prisma database.
 * Used for fetching things like timing allocation rules
 *
 * @module CalendarClient
 */
export class CalendarClient {
	/** @type {import('@pins/inspector-programming-database/src/client').PrismaClient} */
	#client;

	/**
	 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
	 */
	constructor(dbClient) {
		this.#client = dbClient;
	}

	/**
	 * Fetches a list of all calendar event timing allocation rules in database
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client').Prisma.CalendarEventTimingRuleGetPayload<{ include: { CalendarEventTiming: true} }>[]>}
	 */
	async getAllCalendarEventTimingRules() {
		return this.#client.calendarEventTimingRule.findMany({
			include: {
				CalendarEventTiming: true
			}
		});
	}
}
