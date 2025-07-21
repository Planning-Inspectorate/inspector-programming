/**
 * @param {import("@pins/inspector-programming-lib/graph/types").InitEntraClient} initEntraClient
 * @param {import("@pins/inspector-programming-lib/graph/types").AuthSession} authSession
 * @param {import('pino').Logger} logger
 * @param {string} groupId
 * @returns {Promise<import("./types").Inspector[]>}
 */
export async function getInspectorList(initEntraClient, authSession, logger, groupId) {
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
 * @returns {Promise<import("./types").Inspector[]>}
 */
export async function getSortedInspectorList(initEntraClient, authSession, logger, groupId) {
	const inspectorList = await getInspectorList(initEntraClient, authSession, logger, groupId);
	return sortInspectorList(inspectorList);
}

/**
 * @param {import("@pins/inspector-programming-lib/graph/types").InitEntraClient} initEntraClient
 * @param {import("@pins/inspector-programming-lib/graph/types").AuthSession} authSession
 * @param {import('pino').Logger} logger
 * @param {string} groupId
 * @param {string} id
 * @returns {Promise<import("./types").Inspector|undefined>}
 */
export async function getInspectorById(initEntraClient, authSession, logger, groupId, id) {
	const inspectorList = await getInspectorList(initEntraClient, authSession, logger, groupId);
	return inspectorList.find((inspector) => inspector.id == id);
}

/**
 * @param {import("./types").Inspector[]} inspectorList
 */
export function sortInspectorList(inspectorList) {
	return inspectorList.toSorted((a, b) => {
		if (a.lastName !== b.lastName) {
			return a.lastName < b.lastName ? -1 : 1;
		}
		return a.firstName < b.firstName ? -1 : 1;
	});
}

/**
 * @param {import("@pins/inspector-programming-lib/graph/types").GroupMember} groupMember
 * @returns {import("./types").Inspector}
 */
function mapToInspector(groupMember) {
	return {
		id: groupMember.id,
		firstName: groupMember.givenName || '',
		lastName: groupMember.surname || '',
		emailAddress: groupMember.mail || ''
	};
}
