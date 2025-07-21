import * as authSession from '../app/auth/session.service.js';

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
