import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { checkAccountGroupAccess, getAccountId } from './account.js';

describe('account', () => {
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
