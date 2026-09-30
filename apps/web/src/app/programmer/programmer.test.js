import { describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { getAssignmentPersonByEntraUserId, getProgrammerList } from './programmer.js';

const groupId = 'programmers-group-id';
const mockLogger = {
	warn: mock.fn()
};

function createMockService(groupMembers, user = null) {
	const entraClient = {
		listAllGroupMembers: mock.fn(() => groupMembers),
		getUserById: mock.fn(() => user)
	};

	return {
		entraClient: mock.fn(() => entraClient),
		logger: mockLogger,
		entraGroupIds: {
			inspectors: groupId,
			teamLeads: 'team-leads-group-id',
			nationalTeam: 'national-team-group-id'
		}
	};
}

describe('programmer', () => {
	describe('getProgrammerList', () => {
		it('should fetch and sort programmers by display name', async () => {
			const mockService = createMockService([
				{ id: '2', displayName: 'Paul Howell', mail: 'paul.howell@example.com' },
				{ id: '0', displayName: 'Liam Collins', mail: 'liam.collins@example.com' },
				{ id: '1', displayName: 'Dave Flower', mail: 'dave.flower@example.com' }
			]);

			const result = await getProgrammerList(mockService, {
				account: { idTokenClaims: { groups: [groupId, 'team-leads-group-id'] } }
			});

			assert.deepEqual(
				result.map((p) => p.id),
				['1', '0', '2']
			);
			assert.equal(result[0].name, 'Dave Flower');
			assert.deepEqual(Object.keys(result[0]), ['id', 'name', 'email']);
		});

		it('should use the id as a deterministic tie-breaker', async () => {
			const mockService = createMockService([
				{ id: '2', displayName: 'Alex Smith', mail: '' },
				{ id: '1', displayName: 'Alex Smith', mail: '' }
			]);

			const result = await getProgrammerList(mockService, {
				account: { idTokenClaims: { groups: [groupId, 'national-team-group-id'] } }
			});

			assert.deepEqual(
				result.map((p) => p.id),
				['1', '2']
			);
		});

		it('should only fetch members of the team leads and national team groups', async () => {
			const mockService = createMockService([{ id: '1', displayName: 'Paul Howell', mail: 'paul@example.com' }]);

			await getProgrammerList(mockService, {
				account: { idTokenClaims: { groups: ['team-leads-group-id'] } }
			});

			const client = mockService.entraClient.mock.calls[0].result;
			assert.deepEqual(
				client.listAllGroupMembers.mock.calls.map((call) => call.arguments[0]),
				['team-leads-group-id', 'national-team-group-id']
			);
		});

		it('should return no programmers when the user is only in the inspectors group', async () => {
			const mockService = createMockService([{ id: '1', displayName: 'Paul Howell', mail: 'paul@example.com' }]);

			const result = await getProgrammerList(mockService, {
				account: { idTokenClaims: { groups: [groupId] }, localAccountId: '1' }
			});

			assert.deepEqual(result, []);
			assert.equal(mockService.entraClient.mock.callCount(), 0);
		});

		it('should log and skip a group that fails, continuing with the rest', async () => {
			const mockService = createMockService([]);
			const client = {
				listAllGroupMembers: mock.fn(async (id) => {
					if (id === 'team-leads-group-id') throw new Error('Request_ResourceNotFound');
					return [{ id: `${id}-user`, displayName: `A ${id}`, mail: '' }];
				})
			};
			mockService.entraClient = mock.fn(() => client);
			const warnCount = mockLogger.warn.mock.callCount();

			const result = await getProgrammerList(mockService, {
				account: { idTokenClaims: { groups: [groupId, 'national-team-group-id'] } }
			});

			assert.deepEqual(
				result.map((p) => p.id),
				['national-team-group-id-user']
			);
			assert.equal(mockLogger.warn.mock.callCount(), warnCount + 1);
		});

		it('should return no programmers when user is not in an authorized group', async () => {
			const mockService = createMockService([]);

			const result = await getProgrammerList(mockService, { account: { idTokenClaims: { groups: [] } } });

			assert.deepEqual(result, []);
		});

		it('should return the full list to a team lead who is not in the inspectors group', async () => {
			const mockService = createMockService([{ id: '1', displayName: 'Paul Howell', mail: 'paul@example.com' }]);

			const result = await getProgrammerList(mockService, {
				account: { idTokenClaims: { groups: ['team-leads-group-id'] } }
			});

			assert.deepEqual(
				result.map((programmer) => programmer.id),
				['1']
			);
		});
	});

	describe('getAssignmentPersonByEntraUserId', () => {
		it('should fetch and map a programmer by ID', async () => {
			const mockService = createMockService([], {
				id: 'prog-1',
				displayName: 'Paul Howell',
				mail: 'paul.howell@example.com'
			});

			const result = await getAssignmentPersonByEntraUserId(
				mockService,
				{ account: { idTokenClaims: { groups: ['team-leads-group-id'] } } },
				'prog-1'
			);

			assert.deepEqual(result, {
				id: 'prog-1',
				name: 'Paul Howell',
				email: 'paul.howell@example.com'
			});
			const client = mockService.entraClient.mock.calls[0].result;
			assert.equal(client.getUserById.mock.calls[0].arguments[0], 'prog-1');
		});

		it('should not fetch a programmer for a user without access', async () => {
			const mockService = createMockService([]);

			const result = await getAssignmentPersonByEntraUserId(
				mockService,
				{ account: { idTokenClaims: { groups: [] } } },
				'prog-1'
			);

			assert.equal(result, null);
			assert.equal(mockService.entraClient.mock.callCount(), 0);
		});
	});
});
