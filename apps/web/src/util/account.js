import * as authSession from '@planning-inspectorate/core/auth';

/**
 * @param {import('../app/auth/session.service.js').SessionWithAuth} session
 * @returns {string}
 */
export function getAccountId(session) {
	const account = authSession.getAccount(session);
	return account ? account.localAccountId : '';
}

/**
 * @param {import('../app/auth/session.service.js').SessionWithAuth} session
 * @param {string} groupId
 * @returns {boolean}
 */
export function checkAccountGroupAccess(session, groupId) {
	const account = authSession.getAccount(session);

	if (account?.idTokenClaims?.groups) {
		return account.idTokenClaims.groups.includes(groupId);
	}

	return false;
}

/**
 * the group IDs for the Entra groups that have access to manage assignments.
 * @typedef {object} EntraGroupIds
 * @property {string} teamLeads
 * @property {string} nationalTeam
 */

/**
 * Only team leads and national team members can manage inspector to programmer assignments.
 * @param {import('../app/auth/session.service.js').SessionWithAuth} session
 * @param {EntraGroupIds | undefined} entraGroupIds
 * @returns {boolean}
 */
export function canManageAssignments(session, entraGroupIds) {
	if (!entraGroupIds) {
		return false;
	}
	return (
		checkAccountGroupAccess(session, entraGroupIds.teamLeads) ||
		checkAccountGroupAccess(session, entraGroupIds.nationalTeam)
	);
}

/**
 * Middleware to set res.locals.canManageAssignments for use in views
 * @param  {EntraGroupIds | undefined} entraGroupIds
 * @returns {import('express').RequestHandler}
 */
export function buildCanManageAssignmentsMiddleware(entraGroupIds) {
	return (req, res, next) => {
		res.locals.canManageAssignments = canManageAssignments(req.session, entraGroupIds);
		next();
	};
}
