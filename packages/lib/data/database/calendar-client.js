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

	/** @typedef {{division: string, events: {title: string, date: string, notes: string, bunting: true}[]}} BankHolidayJsonDivision */
	/** @typedef {{'england-and-wales': BankHolidayJsonDivision, 'scotland': BankHolidayJsonDivision, 'northern-ireland': BankHolidayJsonDivision}} BankHolidayJson */

	/**
	 * Uses a .gov api to fetch a list of uk bank holidays
	 * @returns {Promise<string[]>}
	 */
	async getEnglandWalesBankHolidays() {
		const res = await fetch('https://www.gov.uk/bank-holidays.json');
		/** @type {BankHolidayJson} */
		const bankHolidayJson = await res.json();
		return bankHolidayJson['england-and-wales'].events.map((e) => e.date);
	}
}
