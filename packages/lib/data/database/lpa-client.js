/**
 * Client for fetching lpa data from the Prisma database.
 *
 * @module LpaClient
 */
export class LpaClient {
	/** @type {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} */
	#client;

	/**
	 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
	 */
	constructor(dbClient) {
		this.#client = dbClient;
	}

	/**
	 * Returns the full list of Local Planning Authorities (LPAs) held in
	 * the database, sorted alphabetically by name.
	 *
	 * @returns {Promise<import('@pins/inspector-programming-lib/data/types.js').Lpa[]>}
	 */
	async getLpaList() {
		const lpas = await this.#client.lpa.findMany({
			select: { lpaCode: true, lpaName: true },
			orderBy: { lpaName: 'asc' }
		});

		return lpas;
	}
}
