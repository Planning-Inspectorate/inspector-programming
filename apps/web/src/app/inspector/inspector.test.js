import { describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { getInspectorById, getInspectorList, getSortedInspectorList } from './inspector.js';

const groupId = 'groupId';
const mockSession = {};
const mockLogger = {
	warn: mock.fn()
};

const mockEntraClient = {
	listAllGroupMembers: mock.fn()
};

const mockInitEntraClient = mock.fn();
mockInitEntraClient.mock.mockImplementation(() => mockEntraClient);

describe('inspectors', () => {
	it('should fetch unsorted inspector list', async () => {
		const groupMemberList = [
			{
				id: '0',
				givenName: 'John',
				surname: 'Baker',
				mail: 'test@email.com'
			},
			{
				id: '1',
				givenName: 'John',
				surname: 'Adams',
				mail: 'test@email.com'
			},
			{
				id: '2',
				givenName: 'John',
				surname: 'Allen',
				mail: 'test@email.com'
			}
		];

		const expectedInspectorList = [
			{
				id: '0',
				firstName: 'John',
				lastName: 'Baker',
				emailAddress: 'test@email.com'
			},
			{
				id: '1',
				firstName: 'John',
				lastName: 'Adams',
				emailAddress: 'test@email.com'
			},
			{
				id: '2',
				firstName: 'John',
				lastName: 'Allen',
				emailAddress: 'test@email.com'
			}
		];

		mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);
		const inspectorList = await getInspectorList(mockInitEntraClient, mockSession, mockLogger, groupId);
		assert.deepStrictEqual(inspectorList, expectedInspectorList);
	});

	it('should return empty inspector list if client is undefined', async () => {
		mockInitEntraClient.mock.mockImplementationOnce(() => undefined);
		const inspectorList = await getInspectorList(mockInitEntraClient, mockSession, mockLogger, groupId);
		assert.deepStrictEqual(inspectorList, []);
	});

	it('should fetch inspector list sorted by last name', async () => {
		const groupMemberList = [
			{
				id: '0',
				givenName: 'John',
				surname: 'Baker',
				mail: 'test@email.com'
			},
			{
				id: '1',
				givenName: 'John',
				surname: 'Adams',
				mail: 'test@email.com'
			},
			{
				id: '2',
				givenName: 'John',
				surname: 'Allen',
				mail: 'test@email.com'
			}
		];

		const expectedInspectorList = [
			{
				id: '1',
				firstName: 'John',
				lastName: 'Adams',
				emailAddress: 'test@email.com'
			},
			{
				id: '2',
				firstName: 'John',
				lastName: 'Allen',
				emailAddress: 'test@email.com'
			},
			{
				id: '0',
				firstName: 'John',
				lastName: 'Baker',
				emailAddress: 'test@email.com'
			}
		];

		mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);
		const inspectorList = await getSortedInspectorList(mockInitEntraClient, mockSession, mockLogger, groupId);
		assert.deepStrictEqual(inspectorList, expectedInspectorList);
	});

	it('should fetch inspector list sorted by first name', async () => {
		const groupMemberList = [
			{
				id: '0',
				givenName: 'John',
				surname: 'Baker',
				mail: 'test@email.com'
			},
			{
				id: '1',
				givenName: 'Alice',
				surname: 'Baker',
				mail: 'test@email.com'
			},
			{
				id: '2',
				givenName: 'Jake',
				surname: 'Baker',
				mail: 'test@email.com'
			}
		];

		const expectedInspectorList = [
			{
				id: '1',
				firstName: 'Alice',
				lastName: 'Baker',
				emailAddress: 'test@email.com'
			},
			{
				id: '2',
				firstName: 'Jake',
				lastName: 'Baker',
				emailAddress: 'test@email.com'
			},
			{
				id: '0',
				firstName: 'John',
				lastName: 'Baker',
				emailAddress: 'test@email.com'
			}
		];

		mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);
		const inspectorList = await getSortedInspectorList(mockInitEntraClient, mockSession, mockLogger, groupId);
		assert.deepStrictEqual(inspectorList, expectedInspectorList);
	});

	it('should fetch inspector list sorted by last name then first name', async () => {
		const groupMemberList = [
			{
				id: '0',
				givenName: 'John',
				surname: 'Baker',
				mail: 'test@email.com'
			},
			{
				id: '1',
				givenName: 'Liam',
				surname: 'Adams',
				mail: 'test@email.com'
			},
			{
				id: '2',
				givenName: 'Jake',
				surname: 'Baker',
				mail: 'test@email.com'
			}
		];

		const expectedInspectorList = [
			{
				id: '1',
				firstName: 'Liam',
				lastName: 'Adams',
				emailAddress: 'test@email.com'
			},
			{
				id: '2',
				firstName: 'Jake',
				lastName: 'Baker',
				emailAddress: 'test@email.com'
			},
			{
				id: '0',
				firstName: 'John',
				lastName: 'Baker',
				emailAddress: 'test@email.com'
			}
		];

		mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);
		const inspectorList = await getSortedInspectorList(mockInitEntraClient, mockSession, mockLogger, groupId);
		assert.deepStrictEqual(inspectorList, expectedInspectorList);
	});

	it('should get inspector by id', async () => {
		const groupMemberList = [
			{
				id: '0',
				givenName: 'John',
				surname: 'Baker',
				mail: 'test@email.com'
			},
			{
				id: '1',
				givenName: 'Liam',
				surname: 'Adams',
				mail: 'test@email.com'
			},
			{
				id: '2',
				givenName: 'Jake',
				surname: 'Baker',
				mail: 'test@email.com'
			}
		];

		const expectedInspector = {
			id: '1',
			firstName: 'Liam',
			lastName: 'Adams',
			emailAddress: 'test@email.com'
		};

		mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);
		const inspector = await getInspectorById(mockInitEntraClient, mockSession, mockLogger, groupId, '1');
		assert.deepStrictEqual(inspector, expectedInspector);
	});

	it('should return undefined when inpector id is not in the inspector list', async () => {
		const groupMemberList = [
			{
				id: '0',
				givenName: 'John',
				surname: 'Baker',
				mail: 'test@email.com'
			},
			{
				id: '1',
				givenName: 'Liam',
				surname: 'Adams',
				mail: 'test@email.com'
			},
			{
				id: '2',
				givenName: 'Jake',
				surname: 'Baker',
				mail: 'test@email.com'
			}
		];

		mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);
		const inspector = await getInspectorById(mockInitEntraClient, mockSession, mockLogger, groupId, '5');
		assert.strictEqual(inspector, undefined);
	});
});
