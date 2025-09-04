/**
 * Client for fetching inspector data from the Prisma database.
 * Inspector data from Entra is fetched via src/app/inspector/inspector.js
 *
 * @module InspectorClient
 */
export class InspectorClient {
	/** @type {import('@pins/inspector-programming-database/src/client').PrismaClient} */
	#client;

	/**
	 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
	 */
	constructor(dbClient) {
		this.#client = dbClient;
		console.info('made client');
		console.info(this.#client);
	}

	/**
	 *
	 * @param {string|undefined} entraId
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client').Inspector|null>}
	 */
	async getInspectorDetails(entraId) {
		if (!entraId) {
			return null;
		}
		return this.#client.inspector.findFirst({
			where: { entraId },
			include: {
				Specialisms: true
			}
		});
	}
}
