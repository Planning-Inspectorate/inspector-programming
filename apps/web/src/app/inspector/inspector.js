import { checkAccountGroupAccess, getAccountId } from '#util/account.js';

/**
 * @param {import("@pins/inspector-programming-lib/graph/types").InitEntraClient} initEntraClient
 * @param {import("@pins/inspector-programming-lib/graph/types").AuthSession} authSession
 * @param {import('pino').Logger} logger
 * @param {string} groupId
 * @returns {Promise<import("@pins/inspector-programming-lib/data/types").InspectorViewModel[]>}
 */
export async function fetchInspectorList(initEntraClient, authSession, logger, groupId) {
	const client = initEntraClient(authSession);

	if (!client) {
		logger.warn('Skipping inspectors list, no Entra Client');
		return [];
	}

	const inspectorList = await client.listAllGroupMembers(groupId);
	return inspectorList.map(mapToInspector);
}

/**
 * @param {import("@pins/inspector-programming-lib/graph/types").InitEntraClient} initEntraClient
 * @param {import("@pins/inspector-programming-lib/graph/types").AuthSession} authSession
 * @param {import('pino').Logger} logger
 * @param {string} groupId
 * @returns {Promise<import("@pins/inspector-programming-lib/data/types").InspectorViewModel[]>}
 */
export async function getSortedInspectorList(initEntraClient, authSession, logger, groupId) {
	const inspectorList = await fetchInspectorList(initEntraClient, authSession, logger, groupId);
	return sortInspectorList(inspectorList);
}

/**
 * @param {import("@pins/inspector-programming-lib/graph/types").InitEntraClient} initEntraClient
 * @param {import("@pins/inspector-programming-lib/graph/types").AuthSession} authSession
 * @param {import('pino').Logger} logger
 * @param {string} groupId
 * @param {string} id
 * @returns {Promise<import("@pins/inspector-programming-lib/data/types").InspectorViewModel|undefined>}
 */
export async function getInspectorById(initEntraClient, authSession, logger, groupId, id) {
	const inspectorList = await fetchInspectorList(initEntraClient, authSession, logger, groupId);
	return inspectorList.find((inspector) => inspector.id === id);
}

/**
 * Frontend-facing
 * Fetches formatted and sorted list of inspectors from Entra - validated that they also exist in our local db too
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} authSession
 * @returns {Promise<import("@pins/inspector-programming-lib/data/types").InspectorViewModel[]>}
 */
export async function getInspectorList(service, authSession) {
	/**
	 * @type {(import("@pins/inspector-programming-lib/data/types").InspectorViewModel)[]}
	 */
	let inspectors = [];

	if (
		checkAccountGroupAccess(authSession, service.entraGroupIds.teamLeads) ||
		checkAccountGroupAccess(authSession, service.entraGroupIds.nationalTeam)
	) {
		inspectors = await getSortedInspectorList(
			service.entraClient,
			authSession,
			service.logger,
			service.entraGroupIds.inspectors
		);
	} else if (checkAccountGroupAccess(authSession, service.entraGroupIds.inspectors)) {
		let inspector = await getInspectorById(
			service.entraClient,
			authSession,
			service.logger,
			service.entraGroupIds.inspectors,
			getAccountId(authSession)
		);
		if (inspector) {
			inspectors.push(inspector);
		}
	}

	//validate retrieved inspectors also exist in Entra group
	//const dbInspectors = await service.inspectorClient.getAllInspectors();
	//console.info(dbInspectors[0]);
	//console.info(inspectors[0]);
	//inspectors.filter((i) => )

	return inspectors;
}

/**
 * @param {import("@pins/inspector-programming-lib/data/types").InspectorViewModel[]} inspectorList
 */
function sortInspectorList(inspectorList) {
	return inspectorList.toSorted((a, b) => {
		if (a.lastName !== b.lastName) {
			return a.lastName < b.lastName ? -1 : 1;
		}
		return a.firstName < b.firstName ? -1 : 1;
	});
}

/**
 * @param {import("@pins/inspector-programming-lib/graph/types").GroupMember} groupMember
 * @returns {import("@pins/inspector-programming-lib/data/types").InspectorViewModel}
 */
function mapToInspector(groupMember) {
	return {
		id: groupMember.id,
		firstName: groupMember.givenName || '',
		lastName: groupMember.surname || '',
		emailAddress: groupMember.mail || ''
	};
}
