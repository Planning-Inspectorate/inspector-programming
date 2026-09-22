/**
 * Programmer (Programme Officer) list fetching from Microsoft Entra ID.
 *
 * Programmers, unlike inspectors, are not stored in the local database - the Entra
 * group membership is the source of truth for who is available to be assigned to.
 *
 * @module Programmer
 */

/**
 * Fetch the full list of programmers from the configured Entra ID group.
 *
 * @param {import("@pins/inspector-programming-lib/graph/types").InitEntraClient} initEntraClient
 * @param {import("@pins/inspector-programming-lib/graph/types").AuthSession} authSession
 * @param {import('pino').Logger} logger
 * @param {string} groupId
 * @returns {Promise<import("../views/assignments/types.js").ProgrammerViewModel[]>}
 */
export async function fetchProgrammerList(initEntraClient, authSession, logger, groupId) {
	const client = initEntraClient(authSession);

	if (!client) {
		logger.warn('Skipping programmers list, no Entra Client');
		return [];
	}

	if (!groupId) {
		logger.warn('Skipping programmers list, no Entra group configured for programmers');
		return [];
	}

	const programmerList = await client.listAllGroupMembers(groupId);
	return programmerList.map(mapToProgrammer);
}

/**
 * Fetch a sorted (by last name, then first name) list of programmers from Entra ID.
 *
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} authSession
 * @returns {Promise<import("../views/assignments/types.js").ProgrammerViewModel[]>}
 */
export async function getProgrammerList(service, authSession) {
	const programmers = await fetchProgrammerList(
		service.entraClient,
		authSession,
		service.logger,
		service.entraGroupIds.programmers
	);
	return sortProgrammerList(programmers);
}

/**
 * @param {import("../views/assignments/types.js").ProgrammerViewModel[]} programmerList
 */
function sortProgrammerList(programmerList) {
	return programmerList.toSorted((a, b) => {
		if (a.lastName !== b.lastName) {
			return a.lastName < b.lastName ? -1 : 1;
		}
		return a.firstName < b.firstName ? -1 : 1;
	});
}

/**
 * @param {import("@pins/inspector-programming-lib/graph/types").GroupMember} groupMember
 * @returns {import("../views/assignments/types.js").ProgrammerViewModel}
 */
function mapToProgrammer(groupMember) {
	return {
		id: groupMember.id,
		firstName: groupMember.givenName || '',
		lastName: groupMember.surname || '',
		emailAddress: groupMember.mail || ''
	};
}

/**
 * Formats a programmer's full name for display.
 * @param {{firstName?: string, lastName?: string}} programmer
 * @returns {string}
 */
export function formatProgrammerName(programmer) {
	return `${programmer?.firstName || ''} ${programmer?.lastName || ''}`.trim();
}
