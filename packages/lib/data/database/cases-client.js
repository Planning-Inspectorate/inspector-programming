/**
 * Client for fetching case data from the Prisma database for the application,
 *
 * @module CasesClient
 */
export class CasesClient {
	/** @type {import('@prisma/client').PrismaClient} */
	#client;

	/**
	 *
	 * @param {import('@prisma/client').PrismaClient} dbClient
	 */
	constructor(dbClient) {
		this.#client = dbClient;
	}

	/**
	 * Fetch all appeals cases currently held in the database
	 *
	 * @returns {Promise<import('../types').AppealCase[]>}
	 */
	async getAllCases() {
		const cases = await this.#client.AppealCase.findMany();
		return cases;
	}
}
