// @ts-nocheck
import { describe, test, mock } from 'node:test';
import assert from 'assert';
import {
	getPreviousUrlFromSession,
	PREVIOUS_URL,
	saveUrlToSession,
	saveUrlToSessionMiddleware
} from '#util/session.ts';

describe('session', () => {
	describe('saveUrlToSessionMiddleware', () => {
		test('should call next', () => {
			const req = {
				session: {}
			};
			const next = mock.fn();
			saveUrlToSessionMiddleware(req, {}, next);
			assert.strictEqual(next.mock.callCount(), 1);
		});
	});
	describe('saveUrlToSession', () => {
		test('should error if no session', () => {
			assert.throws(
				() => {
					saveUrlToSession({}, 'url');
				},
				{ message: 'request session required' }
			);
		});
		test('should add the URl to a new list', () => {
			const req = {
				session: {}
			};
			saveUrlToSession(req, 'url');
			assert.deepStrictEqual(req.session[PREVIOUS_URL], ['url']);
		});
		test('should add the URl an existing list', () => {
			const req = {
				session: {
					[PREVIOUS_URL]: ['url-2']
				}
			};
			saveUrlToSession(req, 'url');
			assert.deepStrictEqual(req.session[PREVIOUS_URL], ['url-2', 'url']);
		});
		test('should keep the list to 2', () => {
			const req = {
				session: {
					[PREVIOUS_URL]: ['url-2', 'url-3']
				}
			};
			saveUrlToSession(req, 'url');
			assert.deepStrictEqual(req.session[PREVIOUS_URL], ['url-3', 'url']);
		});
	});
	describe('getPreviousUrlFromSession', () => {
		test('should default to / if no session', () => {
			const got = getPreviousUrlFromSession({});
			assert.strictEqual(got, '/');
		});
		test('should default to / if empty array', () => {
			const got = getPreviousUrlFromSession({
				session: {
					[PREVIOUS_URL]: []
				}
			});
			assert.strictEqual(got, '/');
		});
		test('should default to / if single array item', () => {
			const got = getPreviousUrlFromSession({
				session: {
					[PREVIOUS_URL]: ['url']
				}
			});
			assert.strictEqual(got, '/');
		});
		test('should return previous if 2 items', () => {
			const got = getPreviousUrlFromSession({
				session: {
					[PREVIOUS_URL]: ['/previous-url', 'url']
				}
			});
			assert.strictEqual(got, '/previous-url');
		});
	});
});
