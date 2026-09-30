/**
 * Client for managing Inspector to Programmer (Programme Officer) assignments held in
 * the Prisma database. Only the programmer's Entra ID is stored; name and email are
 * resolved from Entra ID when the assignments page is rendered.
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
	 * Fetches all inspector/programmer assignments.
	 * @returns {Promise<InspectorProgrammerAssignment[]>}
	 */
	async getAllAssignments() {
		const inspectors = await this.#client.inspector.findMany({
			where: { programmerId: { not: null } },
			select: { id: true, programmerId: true, programmerAssignedAt: true }
		});
		return inspectors.map(toAssignment);
	}

	/**
	 * Fetches a single assignment for the given inspector, if one exists.
	 * @param {string} inspectorId
	 * @returns {Promise<InspectorProgrammerAssignment|null>}
	 */
	async getAssignmentByInspectorId(inspectorId) {
		if (!inspectorId) {
			return null;
		}

		const inspector = await this.#client.inspector.findUnique({
			where: { id: inspectorId },
			select: { id: true, programmerId: true, programmerAssignedAt: true }
		});
		return inspector?.programmerId ? toAssignment(inspector) : null;
	}

	/**
	 * Fetches all assignments for a given programmer (Entra ID).
	 * @param {string} programmerId
	 * @returns {Promise<InspectorProgrammerAssignment[]>}
	 */
	async getAssignmentsByProgrammerId(programmerId) {
		if (!programmerId) {
			return [];
		}

		const inspectors = await this.#client.inspector.findMany({
			where: { programmerId },
			select: { id: true, programmerId: true, programmerAssignedAt: true }
		});
		return inspectors.map(toAssignment);
	}

	/**
	 * Assigns a programmer to an inspector, or changes the existing assignment.
	 *
	 * @param {Object} params
	 * @param {string} params.inspectorId
	 * @param {string} params.programmerId
	 * @returns {Promise<InspectorProgrammerAssignment>}
	 */
	async upsertAssignment({ inspectorId, programmerId }) {
		const inspector = await this.#client.inspector.update({
			where: { id: inspectorId },
			data: { programmerId, programmerAssignedAt: new Date() },
			select: { id: true, programmerId: true, programmerAssignedAt: true }
		});
		return toAssignment(inspector);
	}

	/**
	 * Removes an existing assignment for the given inspector, if one exists.
	 * @param {string} inspectorId
	 * @returns {Promise<{inspectorId: string}|null>}
	 */
	async removeAssignment(inspectorId) {
		if (!inspectorId) {
			return null;
		}

		const result = await this.#client.inspector.updateMany({
			where: { id: inspectorId, programmerId: { not: null } },
			data: { programmerId: null, programmerAssignedAt: null }
		});
		return result.count ? { inspectorId } : null;
	}
}

/**
 * @typedef {Object} InspectorProgrammerAssignment
 * @property {string} inspectorId
 * @property {string} programmerId
 * @property {Date|null} updatedAt
 */

/**
 * @param {{id: string, programmerId: string|null, programmerAssignedAt: Date|null}} inspector
 * @returns {InspectorProgrammerAssignment}
 */
function toAssignment(inspector) {
	if (!inspector.programmerId) {
		throw new Error(`Inspector ${inspector.id} has no programmer assignment`);
	}

	return {
		inspectorId: inspector.id,
		programmerId: inspector.programmerId,
		updatedAt: inspector.programmerAssignedAt
	};
}
