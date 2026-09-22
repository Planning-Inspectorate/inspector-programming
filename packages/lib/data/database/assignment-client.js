/**
 * Client for managing Inspector to Programmer (Programme Officer) assignments held in
 * the Prisma database. Programmer data itself is sourced from Microsoft Entra ID
 * (see src/app/programmer/programmer.js in the web app) - only the assignment link and
 * a denormalized snapshot of the programmer's name/email are persisted here.
 *
 * @module AssignmentClient
 */
export class AssignmentClient {
	/** @type {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} */
	#client;

	/**
	 * @param {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient} dbClient
	 */
	constructor(dbClient) {
		this.#client = dbClient;
	}

	/**
	 * Fetches all inspector/programmer assignments, including the assigned inspector's details.
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').Prisma.InspectorProgrammerAssignmentGetPayload<{ include: { Inspector: true } }>[]>}
	 */
	async getAllAssignments() {
		return this.#client.inspectorProgrammerAssignment.findMany({
			include: { Inspector: true }
		});
	}

	/**
	 * Fetches a single assignment for the given inspector, if one exists.
	 * @param {string} inspectorId
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').InspectorProgrammerAssignment|null>}
	 */
	async getAssignmentByInspectorId(inspectorId) {
		if (!inspectorId) {
			return null;
		}
		return this.#client.inspectorProgrammerAssignment.findUnique({
			where: { inspectorId }
		});
	}

	/**
	 * Fetches all assignments for a given programmer (Entra ID).
	 * @param {string} programmerId
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').InspectorProgrammerAssignment[]>}
	 */
	async getAssignmentsByProgrammerId(programmerId) {
		if (!programmerId) {
			return [];
		}
		return this.#client.inspectorProgrammerAssignment.findMany({
			where: { programmerId }
		});
	}

	/**
	 * Creates or updates the assignment of a programmer to an inspector.
	 * As an inspector can only be assigned to a single programmer at a time, this
	 * upserts on the unique inspectorId - effectively assigning or reassigning.
	 *
	 * @param {Object} params
	 * @param {string} params.inspectorId
	 * @param {string} params.programmerId
	 * @param {string} params.programmerName
	 * @param {string} [params.programmerEmail]
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').InspectorProgrammerAssignment>}
	 */
	async upsertAssignment({ inspectorId, programmerId, programmerName, programmerEmail }) {
		return this.#client.inspectorProgrammerAssignment.upsert({
			where: { inspectorId },
			create: { inspectorId, programmerId, programmerName, programmerEmail },
			update: { programmerId, programmerName, programmerEmail }
		});
	}

	/**
	 * Removes an existing assignment for the given inspector, if one exists.
	 * @param {string} inspectorId
	 * @returns {Promise<import('@pins/inspector-programming-database/src/client/client.ts').InspectorProgrammerAssignment|null>}
	 */
	async removeAssignment(inspectorId) {
		try {
			return await this.#client.inspectorProgrammerAssignment.delete({
				where: { inspectorId }
			});
		} catch (err) {
			// prisma throws if the record to delete does not exist - treat as a no-op
			if (err?.code === 'P2025') {
				return null;
			}
			throw err;
		}
	}
}
