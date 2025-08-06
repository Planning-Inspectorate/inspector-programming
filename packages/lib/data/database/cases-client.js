/**
 * Client for fetching case data from the Prisma database for the application,
 *
 * @module CasesClient
 */
export class CasesClient {
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
	 * Fetch all appeals cases currently held in the database
	 *
	 * @returns {Promise<import('../types').dbCase[]>}
	 */
	async getAllCases() {
		return this.#client.appealCase.findMany();
	}
}
