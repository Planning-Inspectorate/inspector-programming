import { describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { assignmentsAccessGuard, createRoutes } from './index.js';

describe('assignments routes', () => {
	it('should register assignment endpoints under the assignments path', () => {
		const router = createRoutes({});
		const routes = router.stack
			.filter((layer) => layer.route)
			.map((layer) => ({
				path: layer.route.path,
				methods: Object.keys(layer.route.methods)
			}));

		assert.deepEqual(routes, [
			{ path: '/', methods: ['get'] },
			{ path: '/assign', methods: ['post'] },
			{ path: '/remove', methods: ['post'] }
		]);
	});
});

describe('assignmentsAccessGuard', () => {
	const entraGroupIds = { teamLeads: 'team-leads-group-id', nationalTeam: 'national-team-group-id' };

	function mockRes() {
		const res = { status: mock.fn(() => res), render: mock.fn() };
		return res;
	}

	/**
	 * @param {object} [session]
	 */
	function runGuard(session) {
		const service = { entraGroupIds, logger: { warn: mock.fn() } };
		const req = { session, originalUrl: '/assignments' };
		const res = mockRes();
		const next = mock.fn();

		assignmentsAccessGuard(service)(req, res, next);

		return { service, res, next };
	}

	/**
	 * @param {string[]} groups
	 */
	const sessionWithGroups = (groups) => ({ account: { idTokenClaims: { groups } } });

	it('should allow team leads through', () => {
		const { res, next } = runGuard(sessionWithGroups([entraGroupIds.teamLeads]));

		assert.equal(next.mock.callCount(), 1);
		assert.equal(res.status.mock.callCount(), 0);
		assert.equal(res.render.mock.callCount(), 0);
	});

	it('should allow national team members through', () => {
		const { res, next } = runGuard(sessionWithGroups([entraGroupIds.nationalTeam]));

		assert.equal(next.mock.callCount(), 1);
		assert.equal(res.status.mock.callCount(), 0);
		assert.equal(res.render.mock.callCount(), 0);
	});

	it('should render 403 and log a warning for users who are not team leads or national team members', () => {
		const { service, res, next } = runGuard(sessionWithGroups(['inspectors-group-id']));

		assert.equal(next.mock.callCount(), 0);
		assert.equal(res.status.mock.calls[0].arguments[0], 403);
		assert.equal(res.render.mock.calls[0].arguments[0], 'views/errors/403.njk');
		assert.equal(service.logger.warn.mock.callCount(), 1);
	});

	it('should render 403 when there is no signed in account', () => {
		const { res, next } = runGuard({});

		assert.equal(next.mock.callCount(), 0);
		assert.equal(res.status.mock.calls[0].arguments[0], 403);
	});
});
