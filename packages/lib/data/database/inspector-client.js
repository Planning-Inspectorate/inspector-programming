/**
 * Client for fetching inspector data from the Prisma database for the application,
 *
 * @module InspectorClient
 */
export class InspectorClient {
	/** @type {import('@pins/inspector-programming-database/src/client').PrismaClient} */
	#client;

	/**
	 *
	 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
	 */
	constructor(dbClient) {
		this.#client = dbClient;
	}

	/**
	 * Fetch all inspector data currently held in the database
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client').Inspector[]>}
	 */
	async getAllInspectors() {
		return this.#client.inspector.findMany();
	}
}
