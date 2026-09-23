import { describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { fetchProgrammerList, getProgrammerList, formatProgrammerName } from './programmer.js';

const groupId = 'programmers-group-id';
const mockSession = {};
const mockLogger = {
	warn: mock.fn()
};

const mockEntraClient = {
	listAllGroupMembers: mock.fn()
};

const mockInitEntraClient = mock.fn();
mockInitEntraClient.mock.mockImplementation(() => mockEntraClient);

describe('programmer', () => {
	describe('fetchProgrammerList', () => {
		it('should fetch and map the programmer list from Entra', async () => {
			const groupMemberList = [
				{ id: '0', givenName: 'Paul', surname: 'Howell', mail: 'paul.howell@example.com' },
				{ id: '1', givenName: 'Lucy', surname: 'Wootton', mail: 'lucy.wootton@example.com' }
			];

			mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);

			const result = await fetchProgrammerList(mockInitEntraClient, mockSession, mockLogger, groupId);

			assert.deepEqual(result, [
				{ id: '0', firstName: 'Paul', lastName: 'Howell', emailAddress: 'paul.howell@example.com' },
				{ id: '1', firstName: 'Lucy', lastName: 'Wootton', emailAddress: 'lucy.wootton@example.com' }
			]);
		});

		it('should return an empty array if there is no Entra client', async () => {
			const initEntraClient = mock.fn(() => undefined);

			const result = await fetchProgrammerList(initEntraClient, mockSession, mockLogger, groupId);

			assert.deepEqual(result, []);
			assert.equal(mockLogger.warn.mock.callCount() > 0, true);
		});

		it('should return an empty array if no group id is configured', async () => {
			const initEntraClient = mock.fn();

			const result = await fetchProgrammerList(initEntraClient, mockSession, mockLogger, undefined);

			assert.deepEqual(result, []);
			assert.equal(initEntraClient.mock.callCount(), 0);
		});

		it('should default missing name/email fields to empty strings', async () => {
			mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => [{ id: '2' }]);

			const result = await fetchProgrammerList(mockInitEntraClient, mockSession, mockLogger, groupId);

			assert.deepEqual(result, [{ id: '2', firstName: '', lastName: '', emailAddress: '' }]);
		});
	});

	describe('getProgrammerList', () => {
		it('should fetch and sort programmers by last name then first name', async () => {
			mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => [
				{ id: '2', givenName: 'Paul', surname: 'Howell', mail: 'paul.howell@example.com' },
				{ id: '0', givenName: 'Liam', surname: 'Collins', mail: 'liam.collins@example.com' },
				{ id: '1', givenName: 'Dave', surname: 'Flower', mail: 'dave.flower@example.com' }
			]);

			const mockService = {
				entraClient: mockInitEntraClient,
				logger: mockLogger,
				entraGroupIds: { programmers: groupId }
			};

			const result = await getProgrammerList(mockService, mockSession);

			// sorted by last name: Collins, Flower, Howell
			assert.deepEqual(
				result.map((p) => p.id),
				['0', '1', '2']
			);
		});

		it('should use the id as a deterministic tie-breaker', async () => {
			mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => [
				{ id: '2', givenName: 'Alex', surname: 'Smith', mail: '' },
				{ id: '1', givenName: 'Alex', surname: 'Smith', mail: '' }
			]);

			const mockService = {
				entraClient: mockInitEntraClient,
				logger: mockLogger,
				entraGroupIds: { programmers: groupId }
			};

			const result = await getProgrammerList(mockService, mockSession);

			assert.deepEqual(
				result.map((p) => p.id),
				['1', '2']
			);
		});
	});

	describe('formatProgrammerName', () => {
		it('should format the full name', () => {
			assert.equal(formatProgrammerName({ firstName: 'Paul', lastName: 'Howell' }), 'Paul Howell');
		});

		it('should handle missing fields', () => {
			assert.equal(formatProgrammerName({ firstName: 'Paul' }), 'Paul');
			assert.equal(formatProgrammerName(undefined), '');
		});
	});
});
