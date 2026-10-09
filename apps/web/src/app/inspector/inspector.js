import { checkAccountGroupAccess, getAccountId } from '#util/account.js';
import { normalizeString } from '@pins/inspector-programming-lib/util/normalize.js';

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
 * @param {string[]} caseReferences
 * @returns {Promise<void>}
 */
export async function notifyInspectorOfAssignedCases(service, inspectorId, assignmentDate, caseReferences) {
	await sendInspectorAssignmentEmail(service, inspectorId, assignmentDate, caseReferences, 'sendAssignedCaseEmail');
}

/**
 * sends an email using GovUK Notify client to an inspector that assigned the cases to themselves
 * @param {import('#service').WebService} service
 * @param {string} inspectorId
 * @param {string} assignmentDate
 * @param {string[]} caseReferences
 * @returns {Promise<void>}
 */
export async function notifyInspectorOfSelfAssignedCases(service, inspectorId, assignmentDate, caseReferences) {
	await sendInspectorAssignmentEmail(service, inspectorId, assignmentDate, caseReferences, 'sendSelfAssignedCaseEmail');
}

/**
 * @param {import('#service').WebService} service
 * @param {string} inspectorId
 * @param {string} assignmentDate
 * @param {string[]} caseReferences
 * @param {'sendAssignedCaseEmail'|'sendSelfAssignedCaseEmail'} sendMethod - Notify client method to send the email with
 * @returns {Promise<void>}
 */
async function sendInspectorAssignmentEmail(service, inspectorId, assignmentDate, caseReferences, sendMethod) {
	const inspector = await service.inspectorClient.getInspectorDetails(inspectorId);
	if (!(inspector?.email && inspector?.firstName)) throw new Error('Could not retrieve inspector email and name');

	const options = {
		inspectorName: formatInspectorName(inspector),
		assignmentDate: assignmentDate,
		selectedCases: caseReferences.join(', '),
		cbosLink: service.notifyConfig.cbosLink
	};
	if (!service.notifyClient) throw new Error('Notify client not configured');
	await service.notifyClient[sendMethod](inspector.email, options);
}

/**
 * sends an email using GovUK Notify client to the programme officer that assigned the cases
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} session - the programme officer is the account in session
 * @param {string} inspectorId
 * @param {string} assignmentDate
 * @param {string[]} caseReferences
 * @returns {Promise<boolean>} whether the notification was sent
 */
export async function notifyProgrammeOfficerOfAssignedCases(
	service,
	session,
	inspectorId,
	assignmentDate,
	caseReferences
) {
	if (!service.notifyClient) throw new Error('Notify client not configured');

	// Get programme officer details from session account
	const programmeOfficerEmail = session?.account?.username;
	const programmeOfficerName = session?.account?.name;

	if (!programmeOfficerEmail) throw new Error('Could not retrieve programme officer email from session');
	if (!programmeOfficerName) throw new Error('Could not retrieve programme officer name from session');

	// Get inspector details
	const inspector = await service.inspectorClient.getInspectorDetails(inspectorId);
	if (!inspector?.firstName) throw new Error('Could not retrieve inspector name');

	const options = {
		programmeOfficerName: programmeOfficerName,
		inspectorName: formatInspectorName(inspector),
		assignmentDate: assignmentDate,
		selectedCases: caseReferences.join(', ')
	};
	await service.notifyClient.sendAssignedCaseProgrammeOfficerEmail(programmeOfficerEmail, options);

	service.logger.info(
		{
			programmeOfficerEmail,
			caseCount: caseReferences.length
		},
		'Email notification sent successfully to programme officer'
	);

	return true;
}

/**
 * Sends an email using GovUK Notify client to the case programme officer assigned to a self-selecting inspector
 *
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} session
 * @param {string} inspectorId
 * @param {string} assignmentDate
 * @param {string[]} caseReferences
 * @returns {Promise<boolean>} whether the notification was sent
 */
export async function notifyProgrammeOfficerOfSelfAssignedCases(
	service,
	session,
	inspectorId,
	assignmentDate,
	caseReferences
) {
	if (!service.notifyClient) throw new Error('Notify client not configured');

	const programmer = await getAssignedProgrammer(service, session, inspectorId);
	const notificationSent = Boolean(programmer);

	if (programmer) {
		const inspector = await service.inspectorClient.getInspectorDetails(inspectorId);
		if (!inspector?.firstName) throw new Error('Could not retrieve inspector name');

		await service.notifyClient.sendSelfAssignedCaseProgrammeOfficerEmail(programmer.email, {
			inspectorName: formatInspectorName(inspector),
			assignmentDate,
			selectedCases: caseReferences.join(', '),
			programmeOfficerName: programmer.name
		});
	}

	service.logger.info(
		{ inspectorId, caseCount: caseReferences.length, notificationSent },
		'Self-selection notification processed for programmer'
	);
	return notificationSent;
}

/**
 * Resolves the programmer assigned to an inspector, or null (with a warning) if they can't be notified
 *
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} session
 * @param {string} inspectorId
 * @returns {Promise<{ email: string, name: string } | null>}
 */
async function getAssignedProgrammer(service, session, inspectorId) {
	const assignment = await service.assignmentClient.getAssignmentByInspectorId(inspectorId);
	if (!assignment?.programmerId) {
		service.logger.warn(
			{ inspectorId },
			'No programmer assigned to the self-selecting inspector, skipping notification'
		);
		return null;
	}

	const entraClient = service.entraClient(session);
	if (!entraClient) throw new Error('Could not initialise Entra client');

	const programmer = await entraClient.getUserById(assignment.programmerId);
	if (!programmer?.mail) {
		service.logger.warn(
			{ inspectorId, programmerId: assignment.programmerId },
			'Programmer does not have an email address in Entra, skipping notification'
		);
		return null;
	}

	return { email: programmer.mail, name: programmer.displayName ?? 'Programme Officer' };
}

/**
 * Sends an email using GovUK Notify client to the case officer that assigned the cases
 *
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} session
 * @param {string} inspectorId
 * @param {string} assignmentDate
 * @param {string[]} caseReferences
 * @param {string} caseOfficerId - Entra user ID of the case officer
 * @returns {Promise<void>}
 */
export async function notifyCaseOfficerOfAssignedCases(
	service,
	session,
	inspectorId,
	assignmentDate,
	caseReferences,
	caseOfficerId
) {
	if (!service.notifyClient) throw new Error('Notify client not configured');
	if (!caseOfficerId) throw new Error('caseOfficerId is required');

	// Resolve the case officer's email from Entra
	const entraClient = service.entraClient(session);
	if (!entraClient) throw new Error('Could not initialise Entra client');

	const caseOfficerUser = await entraClient.getUserById(caseOfficerId);
	const caseOfficerEmail = caseOfficerUser?.mail;
	const caseOfficerName = caseOfficerUser?.displayName ?? 'Case Officer';

	if (!caseOfficerEmail) {
		service.logger.warn(
			{ caseOfficerId },
			'Case officer does not have an email address in Entra, skipping notification'
		);
		return;
	}

	// Get inspector details for the email personalisation
	const inspector = await service.inspectorClient.getInspectorDetails(inspectorId);
	if (!inspector?.firstName) throw new Error('Could not retrieve inspector name');

	const options = {
		caseOfficerName,
		inspectorName: formatInspectorName(inspector),
		assignmentDate: assignmentDate,
		selectedCases: caseReferences.join(', ')
	};

	await service.notifyClient.sendAssignedCaseCaseOfficerEmail(caseOfficerEmail, options);
}

/**
 * Fetch all mappings as a normalized lookup.
 * Not much data in this instance - but note we could use select here since we only need two fields.
 * @param {import('#service').WebService} service
 * @returns {Promise<Record<string,string>>}
 */
export async function getInspectorToCaseSpecialismMap(service) {
	const mappingRows = await service.inspectorClient.getInspectorCaseSpecialism();
	/** @type {Record<string, string>} */
	const inspectorToCaseSpecialismLookup = {};
	for (const mappingEntry of mappingRows) {
		inspectorToCaseSpecialismLookup[mappingEntry.inspectorSpecialismNormalized] = mappingEntry.caseSpecialism;
	}
	return inspectorToCaseSpecialismLookup;
}

/**
 * Map inspector specialisms to unique case specialisms.
 * @param {import('#service').WebService} service
 * @param {string[]} inspectorSpecialisms
 * @returns {Promise<string[]>}
 */
export async function mapInspectorToCaseSpecialisms(service, inspectorSpecialisms) {
	if (!Array.isArray(inspectorSpecialisms)) return [];

	const inspectorToCaseMap = await getInspectorToCaseSpecialismMap(service);
	const seenCaseSpecialisms = new Set();

	for (const inspectorSpecialism of inspectorSpecialisms) {
		if (typeof inspectorSpecialism !== 'string') continue;
		const normalizedInspectorSpecialism = normalizeString(inspectorSpecialism);
		const caseSpecialism = inspectorToCaseMap[normalizedInspectorSpecialism];
		if (caseSpecialism && !seenCaseSpecialisms.has(caseSpecialism)) {
			seenCaseSpecialisms.add(caseSpecialism);
		}
	}

	return Array.from(seenCaseSpecialisms);
}

/**
 * Determines whether the cases were allocated by the inspector to themselves (self-selection).
 * The inspectorId is the inspector's Entra ID, so it can be compared directly with the logged-in user's account ID.
 * @param {import("../auth/session.service").SessionWithAuth} session
 * @param {string} inspectorId
 * @returns {boolean}
 */
export function isSelfSelectedAssignment(session, inspectorId) {
	const accountId = getAccountId(session);
	return Boolean(accountId && inspectorId && accountId === inspectorId);
}
