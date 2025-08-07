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
	 *
	 * @returns {Promise<import('../types').InspectorViewModel[]>}
	 */
	async getAllInspectors() {
		const inspectors = await this.#client.inspector.findMany();
		return inspectors.map((i) => this.inspectorToViewModel(i));
	}

	/**
	 * Maps an inspector object to a view model for UI consumption.
	 * @param {import('@pins/inspector-programming-database/src/client').Inspector} i
	 * @returns {import('../types').InspectorViewModel}
	 */
	inspectorToViewModel(i) {
		return {
			id: i.id,
			firstName: i.firstName,
			lastName: i.lastName,
			emailAddress: i.email,
			postcode: i.postcode
		};
	}
}
