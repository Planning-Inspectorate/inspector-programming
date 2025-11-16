import { InspectorClient } from './inspector-client.js';

const CACHE_PREFIX = 'inspectors_';

/**
 * @typedef {import('../../util/map-cache.js').MapCache} MapCache
 */

/**
 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
 * @param {MapCache} cache
 * @returns {CachedInspectorClient}
 */
export function buildInitInspectorClient(dbClient, cache) {
	const inspectorClient = new InspectorClient(dbClient);
	return new CachedInspectorClient(inspectorClient, cache);
}

/**
 * Wraps the CasesClient with a cache
 */
export class CachedInspectorClient {
	/** @type {InspectorClient} */
	#client;
	/** @type {MapCache} */
	#cache;

	/**
	 *
	 * @param {InspectorClient} client
	 * @param {MapCache} cache
	 */
	constructor(client, cache) {
		this.#client = client;
		this.#cache = cache;
	}

	/**
	 *
	 * @param {string|undefined} entraId
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').Inspector|null>}
	 */
	async getInspectorDetails(entraId) {
		return this.#client.getInspectorDetails(entraId);
	}

	/**
	 *
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').Inspector[]>}
	 */
	async getAllInspectors() {
		const key = CACHE_PREFIX + 'getAllInspectors';
		let inspectors = this.#cache.get(key);
		if (inspectors) {
			return inspectors;
		}
		inspectors = await this.#client.getAllInspectors();
		this.#cache.set(key, inspectors);
		return inspectors;
	}

	/**
	 * Fetch inspector case specialisms from the database.
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').InspectorCaseSpecialism[]>}
	 */
	async getInspectorCaseSpecialism() {
		const key = CACHE_PREFIX + 'getInspectorCaseSpecialism';
		let inspectorCaseSpecialisms = this.#cache.get(key);
		if (inspectorCaseSpecialisms) {
			return inspectorCaseSpecialisms;
		}
		inspectorCaseSpecialisms = await this.#client.getInspectorCaseSpecialism();
		this.#cache.set(key, inspectorCaseSpecialisms);
		return inspectorCaseSpecialisms;
	}
}
