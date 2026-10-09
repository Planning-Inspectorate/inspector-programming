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

/** Notifiers for assignments made by a programme officer on behalf of an inspector */
const STANDARD_NOTIFIERS = {
	notifyInspector: notifyInspectorOfAssignedCases,
	notifyProgrammeOfficer: notifyProgrammeOfficerOfAssignedCases
};

/** Notifiers for assignments an inspector made to themselves */
const SELF_ASSIGNED_NOTIFIERS = {
	notifyInspector: notifyInspectorOfSelfAssignedCases,
	notifyProgrammeOfficer: notifyProgrammeOfficerOfSelfAssignedCases
};

/**
 * Sends all the notification emails for a case assignment in parallel: inspector, programme officer and case officers.
 * Self-selected assignments use the self-assigned templates and notify the inspector's assigned programme officer;
 * otherwise the standard templates are used and the user in session is notified as the programme officer.
 * Failures are logged and never thrown, so one failed email doesn't prevent the others from being sent.
 *
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} session
 * @param {Object} assignment
 * @param {string} assignment.inspectorId
 * @param {string} assignment.assignmentDate
 * @param {string[]} assignment.caseReferences
 * @param {Map<string, string[]>} [assignment.caseReferencesByCaseOfficer] - case references keyed by case officer ID
 * @returns {Promise<{ inspectorNotified: boolean, programmeOfficerNotified: boolean }>}
 */
export async function notifyAssignedCases(service, session, assignment) {
	const { inspectorId, assignmentDate, caseReferences, caseReferencesByCaseOfficer = new Map() } = assignment;
	const { notifyInspector, notifyProgrammeOfficer } = isSelfSelectedAssignment(session, inspectorId)
		? SELF_ASSIGNED_NOTIFIERS
		: STANDARD_NOTIFIERS;

	/**
	 * @param {string} caseOfficerId - Entra user ID of the case officer
	 * @param {string[]} officerCases - case references assigned to the case officer
	 */
	const notifyCaseOfficer = (caseOfficerId, officerCases) =>
		notifyCaseOfficerOfAssignedCases(service, session, inspectorId, assignmentDate, officerCases, caseOfficerId);

	const inspectorNotification = {
		promise: notifyInspector(service, inspectorId, assignmentDate, caseReferences),
		logContext: { inspectorId, caseCount: caseReferences.length },
		successMessage: 'Email notification sent successfully to inspector',
		failureMessage: 'Failed to send email notification to inspector after case assignment'
	};

	// no successMessage: success is logged by the programme officer notifiers themselves
	const programmeOfficerNotification = {
		promise: notifyProgrammeOfficer(service, session, inspectorId, assignmentDate, caseReferences),
		logContext: { programmeOfficerEmail: session?.account?.username },
		failureMessage: 'Failed to send email notification to programme officer after case assignment'
	};

	const caseOfficerNotifications = [...caseReferencesByCaseOfficer].map(([caseOfficerId, officerCases]) => ({
		promise: notifyCaseOfficer(caseOfficerId, officerCases),
		logContext: { caseOfficerId, caseCount: officerCases.length },
		successMessage: 'Email notification sent successfully to case officer',
		failureMessage: 'Failed to send email notification to case officer after case assignment'
	}));

	const notifications = [inspectorNotification, programmeOfficerNotification, ...caseOfficerNotifications];

	const results = await Promise.allSettled(notifications.map(({ promise }) => promise));
	const [inspectorNotified, programmeOfficerNotified] = results.map((result, i) =>
		logNotificationResult(service, result, notifications[i])
	);

	return { inspectorNotified, programmeOfficerNotified };
}

/**
 * Logs the outcome of a settled notification
 * @param {import('#service').WebService} service
 * @param {PromiseSettledResult<boolean|void>} result - a fulfilled value of false means the notification was skipped
 * @param {{ logContext: Object, successMessage?: string, failureMessage: string }} notification
 * @returns {boolean} whether the notification was sent
 */
function logNotificationResult(service, result, { logContext, successMessage, failureMessage }) {
	if (result.status === 'rejected') {
		service.logger.warn({ err: result.reason, ...logContext }, failureMessage);
		return false;
	}
	if (successMessage) service.logger.info(logContext, successMessage);
	return result.value !== false;
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
		...buildAssignmentEmailOptions(inspector, assignmentDate, caseReferences),
		cbosLink: service.notifyConfig.cbosLink
	};
	await getNotifyClient(service)[sendMethod](inspector.email, options);
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
	const notifyClient = getNotifyClient(service);

	// Get programme officer details from session account
	const programmeOfficerEmail = session?.account?.username;
	const programmeOfficerName = session?.account?.name;

	if (!programmeOfficerEmail) throw new Error('Could not retrieve programme officer email from session');
	if (!programmeOfficerName) throw new Error('Could not retrieve programme officer name from session');

	await notifyClient.sendAssignedCaseProgrammeOfficerEmail(programmeOfficerEmail, {
		programmeOfficerName,
		...(await getAssignmentEmailOptions(service, inspectorId, assignmentDate, caseReferences))
	});

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
	const notifyClient = getNotifyClient(service);

	const programmer = await getAssignedProgrammer(service, session, inspectorId);
	const notificationSent = Boolean(programmer);

	if (programmer) {
		await notifyClient.sendSelfAssignedCaseProgrammeOfficerEmail(programmer.email, {
			...(await getAssignmentEmailOptions(service, inspectorId, assignmentDate, caseReferences)),
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

	const programmer = await getEntraUser(service, session, assignment.programmerId);
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
	const notifyClient = getNotifyClient(service);
	if (!caseOfficerId) throw new Error('caseOfficerId is required');

	const caseOfficerUser = await getEntraUser(service, session, caseOfficerId);
	const caseOfficerEmail = caseOfficerUser?.mail;

	if (!caseOfficerEmail) {
		service.logger.warn(
			{ caseOfficerId },
			'Case officer does not have an email address in Entra, skipping notification'
		);
		return;
	}

	await notifyClient.sendAssignedCaseCaseOfficerEmail(caseOfficerEmail, {
		caseOfficerName: caseOfficerUser?.displayName ?? 'Case Officer',
		...(await getAssignmentEmailOptions(service, inspectorId, assignmentDate, caseReferences))
	});
}

/**
 * @param {import('#service').WebService} service
 * @returns {NonNullable<import('#service').WebService['notifyClient']>}
 */
function getNotifyClient(service) {
	if (!service.notifyClient) throw new Error('Notify client not configured');
	return service.notifyClient;
}

/**
 * @param {import('#service').WebService} service
 * @param {import("../auth/session.service").SessionWithAuth} session
 * @param {string} userId - Entra user ID
 */
async function getEntraUser(service, session, userId) {
	const entraClient = service.entraClient(session);
	if (!entraClient) throw new Error('Could not initialise Entra client');
	return entraClient.getUserById(userId);
}

/**
 * Fetches the inspector and builds the personalisation shared by all assignment emails
 * @param {import('#service').WebService} service
 * @param {string} inspectorId
 * @param {string} assignmentDate
 * @param {string[]} caseReferences
 */
async function getAssignmentEmailOptions(service, inspectorId, assignmentDate, caseReferences) {
	const inspector = await service.inspectorClient.getInspectorDetails(inspectorId);
	if (!inspector?.firstName) throw new Error('Could not retrieve inspector name');
	return buildAssignmentEmailOptions(inspector, assignmentDate, caseReferences);
}

/**
 * @param {{ firstName: string, lastName?: string }} inspector
 * @param {string} assignmentDate
 * @param {string[]} caseReferences
 * @returns {{ inspectorName: string, assignmentDate: string, selectedCases: string }}
 */
function buildAssignmentEmailOptions(inspector, assignmentDate, caseReferences) {
	return {
		inspectorName: formatInspectorName(inspector),
		assignmentDate,
		selectedCases: caseReferences.join(', ')
	};
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
