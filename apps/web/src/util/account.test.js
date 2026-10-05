import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
	buildCanManageAssignmentsMiddleware,
	canManageAssignments,
	checkAccountGroupAccess,
	getAccountId
} from './account.js';

describe('account', () => {
	describe('canManageAssignments', () => {
		const groupIds = { teamLeads: 'tl', nationalTeam: 'nt' };
		/** @param {string[]} groups */
		const session = (groups) => ({ account: { idTokenClaims: { groups } } });

		it('should return true for team leads', () => {
			assert.strictEqual(canManageAssignments(session(['tl']), groupIds), true);
		});

		it('should return true for national team members', () => {
			assert.strictEqual(canManageAssignments(session(['nt']), groupIds), true);
		});

		it('should return false for other users', () => {
			assert.strictEqual(canManageAssignments(session(['inspectors']), groupIds), false);
		});

		it('should return false when there is no account', () => {
			assert.strictEqual(canManageAssignments({}, groupIds), false);
		});
	});

	describe('buildCanManageAssignmentsMiddleware', () => {
		const groupIds = { teamLeads: 'tl', nationalTeam: 'nt' };

		it('should set res.locals.canManageAssignments and call next', (ctx) => {
			const middleware = buildCanManageAssignmentsMiddleware(groupIds);
			const req = { session: { account: { idTokenClaims: { groups: ['tl'] } } } };
			const res = { locals: {} };
			const next = ctx.mock.fn();

			middleware(req, res, next);

			assert.strictEqual(res.locals.canManageAssignments, true);
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should set res.locals.canManageAssignments to false for other users', (ctx) => {
			const middleware = buildCanManageAssignmentsMiddleware(groupIds);
			const req = { session: { account: { idTokenClaims: { groups: ['inspectors'] } } } };
			const res = { locals: {} };
			const next = ctx.mock.fn();

			middleware(req, res, next);

			assert.strictEqual(res.locals.canManageAssignments, false);
			assert.strictEqual(next.mock.callCount(), 1);
		});
	});

	it('should return account id when account is not undefined', () => {
		const mockSession = {
			account: {
				localAccountId: 'accountId'
			}
		};

		const accountId = getAccountId(mockSession);
		assert.strictEqual(accountId, 'accountId');
	});

	it('should return empty string when account is undefined', () => {
		const mockSession = {};

		const accountId = getAccountId(mockSession);
		assert.strictEqual(accountId, '');
	});

	it('should return true if account has group access', () => {
		const mockSession = {
			account: {
				idTokenClaims: {
					groups: ['0', '1', '2']
				}
			}
		};

		const hasGroupAccess = checkAccountGroupAccess(mockSession, '1');
		assert.strictEqual(hasGroupAccess, true);
	});

	it('should return false if account does not have group access', () => {
		const mockSession = {
			account: {
				idTokenClaims: {
					groups: ['0', '1', '2']
				}
			}
		};

		const hasGroupAccess = checkAccountGroupAccess(mockSession, '5');
		assert.strictEqual(hasGroupAccess, false);
	});

	it('should return false when account does not have group access because account is undefined', () => {
		const mockSession = {};

		const hasGroupAccess = checkAccountGroupAccess(mockSession, '1');
		assert.strictEqual(hasGroupAccess, false);
	});
});
