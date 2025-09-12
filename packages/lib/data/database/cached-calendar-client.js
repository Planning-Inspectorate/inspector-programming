import { CalendarClient } from './calendar-client.js';

const CACHE_PREFIX = 'calendar_';

/**
 * @typedef {import('../../util/map-cache.js').MapCache} MapCache
 */

/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
 * @param {MapCache} cache
 * @returns {CachedCalendarClient}
 */
export function buildInitCalendarClient(dbClient, cache) {
	const calendarClient = new CalendarClient(dbClient);
	return new CachedCalendarClient(calendarClient, cache);
}

/**
 * Wraps the CalendarClient with a cache
 */
export class CachedCalendarClient {
	/** @type {CalendarClient} */
	#client;
	/** @type {MapCache} */
	#cache;

	/**
	 *
	 * @param {CalendarClient} client
	 * @param {MapCache} cache
	 */
	constructor(client, cache) {
		this.#client = client;
		this.#cache = cache;
	}

	/**
	 *
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client').CalendarEventTimingRule[]>}
	 */
	async getAllCalendarEventTimingRules() {
		const key = CACHE_PREFIX + 'getAllCalendarEventTimingRules';
		let timingRules = this.#cache.get(key);
		if (timingRules) {
			return timingRules;
		}
		timingRules = await this.#client.getAllCalendarEventTimingRules();
		this.#cache.set(key, timingRules);
		return timingRules;
	}
}
