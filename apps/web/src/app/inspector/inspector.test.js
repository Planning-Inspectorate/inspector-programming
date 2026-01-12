import { beforeEach, describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import {
	getInspectorById,
	fetchInspectorList,
	getSortedInspectorList,
	getInspectorList,
	notifyInspectorOfAssignedCases,
	notifyProgrammeOfficerOfAssignedCases,
	getInspectorToCaseSpecialismMap,
	mapInspectorToCaseSpecialisms
} from './inspector.js';

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

const mockService = {
	entraClient: mockInitEntraClient,
	inspectorClient: {
		getAllInspectors: mock.fn(),
		getInspectorDetails: mock.fn(),
		getInspectorCaseSpecialism: mock.fn()
	},
	logger: mockLogger,
	entraGroupIds: {
		teamLeads: '0',
		nationalTeam: '1',
		inspectors: '2'
	},
	notifyConfig: {
		cbosLink: 'test link'
	},
	notifyClient: {
		sendAssignedCaseEmail: mock.fn(),
		sendSelfAssignedCaseEmail: mock.fn(),
		sendAssignedCaseProgrammeOfficerEmail: mock.fn()
	}
};

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
		const inspectorList = await fetchInspectorList(mockInitEntraClient, mockSession, mockLogger, groupId);
		assert.deepStrictEqual(inspectorList, expectedInspectorList);
	});

	it('should return empty inspector list if client is undefined', async () => {
		mockInitEntraClient.mock.mockImplementationOnce(() => undefined);
		const inspectorList = await fetchInspectorList(mockInitEntraClient, mockSession, mockLogger, groupId);
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

	it('should return full sorted inspector list when user is team lead', async () => {
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

		const mockSessionWithAccount = {
			account: {
				idTokenClaims: {
					groups: ['0']
				}
			}
		};
		mockService.inspectorClient.getAllInspectors.mock.mockImplementationOnce(() => expectedInspectorList);
		mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);
		const inspectorList = await getInspectorList(mockService, mockSessionWithAccount);
		assert.deepStrictEqual(inspectorList, expectedInspectorList);
	});

	it('should return full sorted inspector list when user is national team', async () => {
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

		const mockSessionWithAccount = {
			account: {
				idTokenClaims: {
					groups: ['1']
				}
			}
		};

		mockService.inspectorClient.getAllInspectors.mock.mockImplementationOnce(() => expectedInspectorList);
		mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);
		const inspectorList = await getInspectorList(mockService, mockSessionWithAccount);
		assert.deepStrictEqual(inspectorList, expectedInspectorList);
	});

	it('should return inspector list containing only the current user when user is inspector', async () => {
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
			}
		];

		const mockSessionWithAccount = {
			account: {
				idTokenClaims: {
					groups: ['2']
				},
				localAccountId: '1'
			}
		};

		mockService.inspectorClient.getAllInspectors.mock.mockImplementationOnce(() => expectedInspectorList);
		mockEntraClient.listAllGroupMembers.mock.mockImplementationOnce(() => groupMemberList);
		const inspectorList = await getInspectorList(mockService, mockSessionWithAccount);
		assert.deepStrictEqual(inspectorList, expectedInspectorList);
	});
	describe('notifyInspectorOfAssignedCases', () => {
		beforeEach(() => {
			mockService.inspectorClient.getInspectorDetails.mock.resetCalls();
			mockService.notifyClient.sendAssignedCaseEmail.mock.resetCalls();
			mockService.notifyClient.sendSelfAssignedCaseEmail.mock.resetCalls();
		});
		it('should successfully call notifyClient after fetching inspector info', async () => {
			const inspector = { email: 'test-email@gmail.com', firstName: 'Jeff', lastName: 'Bridges' };
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspector);

			const sessionAccount = { username: 'officer@test.com' };
			await notifyInspectorOfAssignedCases(mockService, sessionAccount, '1', '2025-01-01', [1, 2]);

			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseEmail.mock.callCount(), 1);
		});
		it('returning an inspector with either no email or firstname should throw an error', async () => {
			const sessionAccount = { username: 'officer@test.com' };
			await assert.rejects(
				() => notifyInspectorOfAssignedCases(mockService, sessionAccount, '1', '2025-01-01', [1, 2]),
				{
					name: 'Error',
					message: 'Could not retrieve inspector email and name'
				}
			);
			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseEmail.mock.callCount(), 0);
		});
		it('If no Notify client can be found then should throw an error', async () => {
			const service = { ...mockService, notifyClient: undefined };
			const inspector = { email: 'test-email@gmail.com', firstName: 'Jeff', lastName: 'Bridges' };
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspector);

			const sessionAccount = { username: 'officer@test.com' };
			await assert.rejects(() => notifyInspectorOfAssignedCases(service, sessionAccount, '1', '2025-01-01', [1, 2]), {
				name: 'Error',
				message: 'Notify client not configured'
			});
			assert.strictEqual(service.inspectorClient.getInspectorDetails.mock.callCount(), 1);
		});
	});

	describe('specialism mapping', () => {
		beforeEach(() => {
			mockService.inspectorClient.getInspectorCaseSpecialism.mock.resetCalls();
		});
		it('getInspectorToCaseSpecialismMap should build normalized lookup from rows', async () => {
			const rows = [
				{ inspectorSpecialismNormalized: 'heritage', caseSpecialism: 'Heritage Assets' },
				{ inspectorSpecialismNormalized: 'major-infra', caseSpecialism: 'Major Infrastructure' }
			];
			mockService.inspectorClient.getInspectorCaseSpecialism.mock.mockImplementationOnce(() => rows);

			const result = await getInspectorToCaseSpecialismMap(mockService);
			assert.deepStrictEqual(result, {
				heritage: 'Heritage Assets',
				'major-infra': 'Major Infrastructure'
			});
			assert.strictEqual(mockService.inspectorClient.getInspectorCaseSpecialism.mock.callCount(), 1);
		});

		it('mapInspectorToCaseSpecialisms should map and dedupe case specialisms with normalization', async () => {
			const rows = [
				{ inspectorSpecialismNormalized: 'heritage', caseSpecialism: 'Heritage Assets' },
				{ inspectorSpecialismNormalized: 'major-infra', caseSpecialism: 'Major Infrastructure' },
				{ inspectorSpecialismNormalized: 'city-centre', caseSpecialism: 'Urban Development' }
			];
			mockService.inspectorClient.getInspectorCaseSpecialism.mock.mockImplementationOnce(() => rows);
			const input = ['Heritage', 'MAJOR-INFRA', 'heritage', 'city-centre', 'City-Centre'];
			const result = await mapInspectorToCaseSpecialisms(mockService, input);
			assert.deepStrictEqual(result, ['Heritage Assets', 'Major Infrastructure', 'Urban Development']);
		});

		it('mapInspectorToCaseSpecialisms should return [] for non-array input', async () => {
			mockService.inspectorClient.getInspectorCaseSpecialism.mock.mockImplementationOnce(() => []);
			const result = await mapInspectorToCaseSpecialisms(mockService, null);
			assert.deepStrictEqual(result, []);
		});

		it('mapInspectorToCaseSpecialisms should ignore non-string entries and missing mappings', async () => {
			const rows = [{ inspectorSpecialismNormalized: 'heritage', caseSpecialism: 'Heritage Assets' }];
			mockService.inspectorClient.getInspectorCaseSpecialism.mock.mockImplementationOnce(() => rows);

			const input = ['Heritage', 123, undefined, 'Unknown'];
			const result = await mapInspectorToCaseSpecialisms(mockService, input);
			assert.deepStrictEqual(result, ['Heritage Assets']);
		});
	});

	describe('notifyProgrammeOfficerOfAssignedCases', () => {
		beforeEach(() => {
			mockService.inspectorClient.getInspectorDetails.mock.resetCalls();
			mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.resetCalls();
		});

		it('should successfully call notifyClient with correct arguments after fetching inspector info', async () => {
			const inspector = { firstName: 'Jeff', lastName: 'Bridges' };
			const mockSessionAccount = {
				username: 'officer@test.com',
				name: 'Test Officer'
			};
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspector);

			await notifyProgrammeOfficerOfAssignedCases(mockService, mockSessionAccount, '1', '2025-01-01', [
				'REF001',
				'REF002'
			]);

			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 1);
			const notifyCall = mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.calls[0];
			assert.strictEqual(notifyCall.arguments[0], 'officer@test.com');
			assert.deepStrictEqual(notifyCall.arguments[1], {
				programmeOfficerName: 'Test Officer',
				inspectorName: 'Jeff Bridges',
				assignmentDate: '2025-01-01',
				selectedCases: 'REF001, REF002',
				cbosLink: 'test link'
			});
		});

		it('should throw error when programme officer email is missing from session', async () => {
			const mockSessionAccount = {
				name: 'Test Officer'
			};

			await assert.rejects(
				() =>
					notifyProgrammeOfficerOfAssignedCases(mockService, mockSessionAccount, '1', '2025-01-01', [
						'REF001',
						'REF002'
					]),
				{
					name: 'Error',
					message: 'Could not retrieve programme officer email from session'
				}
			);
			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 0);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 0);
		});

		it('should throw error when programme officer name is missing from session', async () => {
			const mockSessionAccount = {
				username: 'officer@test.com'
			};

			await assert.rejects(
				() =>
					notifyProgrammeOfficerOfAssignedCases(mockService, mockSessionAccount, '1', '2025-01-01', [
						'REF001',
						'REF002'
					]),
				{
					name: 'Error',
					message: 'Could not retrieve programme officer name from session'
				}
			);
			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 0);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 0);
		});

		it('should throw error when session account is missing', async () => {
			const mockSessionAccount = undefined;

			await assert.rejects(
				() =>
					notifyProgrammeOfficerOfAssignedCases(mockService, mockSessionAccount, '1', '2025-01-01', [
						'REF001',
						'REF002'
					]),
				{
					name: 'Error',
					message: 'Could not retrieve programme officer email from session'
				}
			);
			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 0);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 0);
		});

		it('should throw error when inspector details cannot be retrieved', async () => {
			const mockSessionAccount = {
				username: 'officer@test.com',
				name: 'Test Officer'
			};
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => null);

			await assert.rejects(
				() =>
					notifyProgrammeOfficerOfAssignedCases(mockService, mockSessionAccount, '1', '2025-01-01', [
						'REF001',
						'REF002'
					]),
				{
					name: 'Error',
					message: 'Could not retrieve inspector name'
				}
			);
			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 0);
		});

		it('should throw error when inspector firstName is missing', async () => {
			const inspector = { lastName: 'Bridges' };
			const mockSessionAccount = {
				username: 'officer@test.com',
				name: 'Test Officer'
			};
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspector);

			await assert.rejects(
				() =>
					notifyProgrammeOfficerOfAssignedCases(mockService, mockSessionAccount, '1', '2025-01-01', [
						'REF001',
						'REF002'
					]),
				{
					name: 'Error',
					message: 'Could not retrieve inspector name'
				}
			);
			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 0);
		});

		it('should throw error when notify client not configured', async () => {
			const service = { ...mockService, notifyClient: undefined };
			const mockSessionAccount = {
				username: 'officer@test.com',
				name: 'Test Officer'
			};

			await assert.rejects(
				() =>
					notifyProgrammeOfficerOfAssignedCases(service, mockSessionAccount, '1', '2025-01-01', ['REF001', 'REF002']),
				{
					name: 'Error',
					message: 'Notify client not configured'
				}
			);
			assert.strictEqual(service.inspectorClient.getInspectorDetails.mock.callCount(), 0);
		});

		it('should handle inspector with no lastName gracefully', async () => {
			const inspector = { firstName: 'Jeff' };
			const mockSessionAccount = {
				username: 'officer@test.com',
				name: 'Test Officer'
			};
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspector);

			await notifyProgrammeOfficerOfAssignedCases(mockService, mockSessionAccount, '1', '2025-01-01', [
				'REF001',
				'REF002'
			]);

			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 1);
			const notifyCall = mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.calls[0];
			assert.strictEqual(notifyCall.arguments[1].inspectorName, 'Jeff');
		});

		it('should work with empty case list', async () => {
			const inspector = { firstName: 'Jeff', lastName: 'Bridges' };
			const mockSessionAccount = {
				username: 'officer@test.com',
				name: 'Test Officer'
			};
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspector);

			await notifyProgrammeOfficerOfAssignedCases(mockService, mockSessionAccount, '1', '2025-01-01', []);

			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 1);
		});
	});
});
