import { canManageAssignments } from '#util/account.js';
/**
 * Programmer (Programme Officer) list fetching from Microsoft Entra ID.
 *
 * Programmers, unlike inspectors, are not stored in the local database - the Entra
 * group membership is the source of truth for who is available to be assigned to.
 *
 * @module Programmer
 */

/**
 * Fetch a sorted list of programmers from Entra ID.
 *
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} authSession
 * @returns {Promise<import("../views/assignments/types.js").AssignmentPersonViewModel[]>}
 */
export async function getProgrammerList(service, authSession) {
	// Only team leads and national team members can view programmers.
	if (!canManageAssignments(authSession, service.entraGroupIds)) {
		return [];
	}

	/**
	 * The Entra group IDs for the programmer groups to fetch members from.
	 * @type {string[]}
	 */
	const programmerGroupIds = [service.entraGroupIds.teamLeads, service.entraGroupIds.nationalTeam];

	// Create an Entra client using the authenticated session. If the client cannot be created, log a warning and return an empty list.
	const client = service.entraClient(authSession);
	if (!client) {
		service.logger.warn('Skipping programmers list, no Entra Client');
		return [];
	}

	// Fetch all group members for the specified programmer groups in parallel, handling any errors.
	const results = await Promise.allSettled(programmerGroupIds.map((groupId) => client.listAllGroupMembers(groupId)));

	// Flatten the results and map to programmer view models, logging any errors encountered.
	const programmers = results.flatMap((result, index) => {
		if (result.status === 'rejected') {
			service.logger.warn(
				{ err: result.reason, groupId: programmerGroupIds[index] },
				'Failed to fetch programmers for Entra group, skipping'
			);
			return [];
		}
		return result.value.map(mapToProgrammer);
	});
	const uniqueProgrammers = new Map(programmers.map((programmer) => [programmer.id, programmer])).values();
	return sortProgrammerList(Array.from(uniqueProgrammers));
}

/**
 * Fetch a person (inspector or programmer) by user ID from Entra ID.
 *
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} authSession
 * @param {string} userId
 * @returns {Promise<import("../views/assignments/types.js").AssignmentPersonViewModel | null>}
 */
export async function getAssignmentPersonByEntraUserId(service, authSession, userId) {
	// Only team leads and national team members can get inspectors or programmers by user ID.
	if (!canManageAssignments(authSession, service.entraGroupIds)) {
		return null;
	}

	// Create an Entra client using the authenticated session. If the client cannot be created, log a warning and return null.
	const client = service.entraClient(authSession);
	if (!client) {
		service.logger.warn('Skipping user fetch, no Entra Client');
		return null;
	}

	try {
		const user = await client.getUserById(userId);
		if (!user) {
			return null;
		}
		// Map the Entra user to a programmer view model and return it.
		return mapToProgrammer(user);
	} catch (err) {
		service.logger.warn({ err, userId }, 'Failed to fetch user from Entra ID');
		return null;
	}
}

/**
 * @param {import("../views/assignments/types.js").AssignmentPersonViewModel[]} programmerList
 */
function sortProgrammerList(programmerList) {
	return programmerList.toSorted((a, b) => {
		const nameOrder = a.name.localeCompare(b.name);
		return nameOrder !== 0 ? nameOrder : a.id.localeCompare(b.id);
	});
}

/**
 * @param {import("@pins/inspector-programming-lib/graph/types").GroupMember} groupMember
 * @returns {import("../views/assignments/types.js").AssignmentPersonViewModel}
 */
function mapToProgrammer(groupMember) {
	return {
		id: groupMember.id,
		name: groupMember.displayName || '',
		email: groupMember.mail || ''
	};
}
