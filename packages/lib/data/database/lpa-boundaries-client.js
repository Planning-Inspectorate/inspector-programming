/**
 * Client for reading and writing LPA boundary geometries to/from the Prisma database.
 *
 * @module LpaBoundariesDatabaseClient
 */
export class LpaBoundariesDatabaseClient {
	/** @type {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} */
	#client;
	/** @type {import('../../util/map-cache.js').MapCache|undefined} */
	#cache;
	/** @type {import('pino').Logger|undefined} */
	#logger;

	/**
	 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
	 * @param {import('../../util/map-cache.js').MapCache} [cache] - optional in-memory cache for reads
	 * @param {import('pino').Logger} [logger] - optional logger for reporting geometry parse failures
	 */
	constructor(dbClient, cache, logger) {
		this.#client = dbClient;
		this.#cache = cache;
		this.#logger = logger;
	}

	/**
	 * Fetch all stored LPA boundaries as a GeoJSON FeatureCollection.
	 * @returns {Promise<{lpaName: string, geometry: []}[]>}
	 */
	async getLpaBoundaries() {
		const cached = this.#cache?.get(CACHE_KEY);
		if (cached) {
			return cached;
		}

		const allLpas = await this.#client.lpa.findMany({
			where: { geometry: { not: null } },
			select: { lpaName: true, geometry: true }
		});

		const failedLpaNames = [];

		const parsedLpas = allLpas
			.map((lpa) => {
				const geometry = parseGeometry(lpa.geometry);
				if (geometry === null) {
					failedLpaNames.push(lpa.lpaName);
				}
				return {
					...lpa,
					geometry
				};
			})
			.filter((lpa) => lpa.geometry !== null);

		if (failedLpaNames.length > 0) {
			this.#logger?.warn(
				{ lpaNames: failedLpaNames },
				`${failedLpaNames.length} lpas failed to parseGeometry json data`
			);
		}

		this.#cache?.set(CACHE_KEY, parsedLpas);
		return parsedLpas;
	}
}

const CACHE_KEY = 'lpa-boundaries';

/**
 * Safely parse a stored geometry JSON string.
 * @param {string|null} geometry
 * @returns {any}
 */
function parseGeometry(geometry) {
	if (!geometry) {
		return null;
	}
	try {
		return JSON.parse(geometry);
	} catch {
		return null;
	}
}
