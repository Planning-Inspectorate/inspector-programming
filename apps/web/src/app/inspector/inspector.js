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
	const dbInspectorIds = ((await service.inspectorClient.getAllInspectors()) || []).map((i) => i.id);
	inspectors = inspectors.filter((i) => dbInspectorIds.includes(i.id));

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

/**
 * Formats inspector full name
 * @param {Object} inspector
 * @param {string} inspector.firstName
 * @param {string} [inspector.lastName]
 * @returns {string}
 */
function formatInspectorName(inspector) {
	return `${inspector.firstName} ${inspector?.lastName || ''}`.trim();
}

/**
 * sends an email using GovUK Notify client to the inspector that the cases have been assigned to
 * @param {import('#service').WebService} service
 * @param {string} inspectorId
 * @param {string} assignmentDate
 * @param {number[]} caseIds
 * @returns {Promise<void>}
 */
export async function notifyInspectorOfAssignedCases(service, inspectorId, assignmentDate, caseIds) {
	const inspector = await service.inspectorClient.getInspectorDetails(inspectorId);
	if (!(inspector?.email && inspector?.firstName)) throw new Error('Could not retrieve inspector email and name');

	const options = {
		inspectorName: formatInspectorName(inspector),
		assignmentDate: assignmentDate,
		selectedCases: caseIds.join(', '),
		cbosLink: service.notifyConfig.cbosLink
	};
	if (!service.notifyClient) throw new Error('Notify client not configured');
	await service.notifyClient.sendAssignedCaseEmail(inspector.email, options);
}

/**
 * sends an email using GovUK Notify client to the programme officer that assigned the cases
 * @param {import('#service').WebService} service
 * @param {Object} sessionAccount
 * @param {string} sessionAccount.username
 * @param {string} sessionAccount.name
 * @param {string} inspectorId
 * @param {string} assignmentDate
 * @param {string[]} caseReferences
 * @returns {Promise<void>}
 */
export async function notifyProgrammeOfficerOfAssignedCases(
	service,
	sessionAccount,
	inspectorId,
	assignmentDate,
	caseReferences
) {
	if (!service.notifyClient) throw new Error('Notify client not configured');

	// Get programme officer details from session account
	const programmeOfficerEmail = sessionAccount?.username;
	const programmeOfficerName = sessionAccount?.name;

	if (!programmeOfficerEmail) throw new Error('Could not retrieve programme officer email from session');
	if (!programmeOfficerName) throw new Error('Could not retrieve programme officer name from session');

	// Get inspector details
	const inspector = await service.inspectorClient.getInspectorDetails(inspectorId);
	if (!inspector?.firstName) throw new Error('Could not retrieve inspector name');

	const options = {
		programmeOfficerName: programmeOfficerName,
		inspectorName: formatInspectorName(inspector),
		assignmentDate: assignmentDate,
		selectedCases: caseReferences.join(', '),
		cbosLink: service.notifyConfig.cbosLink
	};
	await service.notifyClient.sendAssignedCaseProgrammeOfficerEmail(programmeOfficerEmail, options);
}
