/**
 * Client for fetching inspector data from the Prisma database.
 * Inspector data from Entra is fetched via src/app/inspector/inspector.js
 *
 * @module InspectorClient
 */
export class InspectorClient {
	/** @type {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} */
	#client;

	/**
	 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
	 */
	constructor(dbClient) {
		this.#client = dbClient;
	}

	/**
	 *
	 * @param {string|undefined} entraId
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').Inspector|null>}
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

	/**
	 * Fetches a list of all inspectors in database
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').Inspector[]>}
	 */
	async getAllInspectors() {
		return this.#client.inspector.findMany({ include: { Specialisms: true } });
	}

	/**
	 * Fetch inspector case specialisms from the database.
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').InspectorCaseSpecialism[]>}
	 */
	async getInspectorCaseSpecialism() {
		return this.#client.inspectorCaseSpecialism.findMany({
			select: {
				inspectorSpecialismNormalized: true,
				caseSpecialism: true
			}
		});
	}
}
