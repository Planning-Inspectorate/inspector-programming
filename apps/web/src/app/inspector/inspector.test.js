import { beforeEach, describe, it, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import {
	getInspectorById,
	fetchInspectorList,
	getSortedInspectorList,
	getInspectorList,
	notifyInspectorOfAssignedCases,
	notifyInspectorOfSelfAssignedCases,
	notifyProgrammeOfficerOfAssignedCases,
	notifyCaseOfficerOfAssignedCases,
	notifyProgrammeOfficerOfSelfAssignedCases,
	notifyAssignedCases,
	isSelfSelectedAssignment,
	getInspectorToCaseSpecialismMap,
	mapInspectorToCaseSpecialisms
} from './inspector.js';

const groupId = 'groupId';
const mockSession = {};
const mockLogger = {
	info: mock.fn(),
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
		sendAssignedCaseCaseOfficerEmail: mock.fn(),
		sendSelfAssignedCaseEmail: mock.fn(),
		sendSelfAssignedCaseProgrammeOfficerEmail: mock.fn(),
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

			await notifyInspectorOfAssignedCases(mockService, '1', '2025-01-01', ['REF-1', 'REF-2']);

			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseEmail.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendSelfAssignedCaseEmail.mock.callCount(), 0);
		});
		it('should send the self-assigned email when the inspector assigned the cases to themselves', async () => {
			const inspector = { email: 'test-email@gmail.com', firstName: 'Jeff', lastName: 'Bridges' };
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspector);

			await notifyInspectorOfSelfAssignedCases(mockService, '1', '2025-01-01', ['REF-1', 'REF-2']);

			assert.strictEqual(mockService.notifyClient.sendSelfAssignedCaseEmail.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseEmail.mock.callCount(), 0);
		});
		it('returning an inspector with either no email or firstname should throw an error', async () => {
			await assert.rejects(() => notifyInspectorOfAssignedCases(mockService, '1', '2025-01-01', ['REF-1', 'REF-2']), {
				name: 'Error',
				message: 'Could not retrieve inspector email and name'
			});
			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseEmail.mock.callCount(), 0);
		});
		it('If no Notify client can be found then should throw an error', async () => {
			const service = { ...mockService, notifyClient: undefined };
			const inspector = { email: 'test-email@gmail.com', firstName: 'Jeff', lastName: 'Bridges' };
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspector);

			await assert.rejects(() => notifyInspectorOfAssignedCases(service, '1', '2025-01-01', ['REF-1', 'REF-2']), {
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

			await notifyProgrammeOfficerOfAssignedCases(mockService, { account: mockSessionAccount }, '1', '2025-01-01', [
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
				selectedCases: 'REF001, REF002'
			});
		});

		it('should throw error when programme officer email is missing from session', async () => {
			const mockSessionAccount = {
				name: 'Test Officer'
			};

			await assert.rejects(
				() =>
					notifyProgrammeOfficerOfAssignedCases(mockService, { account: mockSessionAccount }, '1', '2025-01-01', [
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
					notifyProgrammeOfficerOfAssignedCases(mockService, { account: mockSessionAccount }, '1', '2025-01-01', [
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
					notifyProgrammeOfficerOfAssignedCases(mockService, { account: mockSessionAccount }, '1', '2025-01-01', [
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
					notifyProgrammeOfficerOfAssignedCases(mockService, { account: mockSessionAccount }, '1', '2025-01-01', [
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
					notifyProgrammeOfficerOfAssignedCases(mockService, { account: mockSessionAccount }, '1', '2025-01-01', [
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
					notifyProgrammeOfficerOfAssignedCases(service, { account: mockSessionAccount }, '1', '2025-01-01', [
						'REF001',
						'REF002'
					]),
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

			await notifyProgrammeOfficerOfAssignedCases(mockService, { account: mockSessionAccount }, '1', '2025-01-01', [
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

			await notifyProgrammeOfficerOfAssignedCases(mockService, { account: mockSessionAccount }, '1', '2025-01-01', []);

			assert.strictEqual(mockService.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 1);
		});
	});

	describe('notifyCaseOfficerOfAssignedCases', () => {
		const mockEntraClientForCaseOfficer = {
			getUserById: mock.fn()
		};

		const mockInitEntraClientForCaseOfficer = mock.fn();

		beforeEach(() => {
			mockService.inspectorClient.getInspectorDetails.mock.resetCalls();
			mockService.notifyClient.sendAssignedCaseCaseOfficerEmail.mock.resetCalls();
			mockEntraClientForCaseOfficer.getUserById.mock.resetCalls();
			mockInitEntraClientForCaseOfficer.mock.resetCalls();
			mockInitEntraClientForCaseOfficer.mock.mockImplementation(() => mockEntraClientForCaseOfficer);
		});

		it('should send allocation email to case officer resolved from Entra', async () => {
			const caseOfficerService = {
				...mockService,
				entraClient: mockInitEntraClientForCaseOfficer
			};
			const inspector = { firstName: 'Jeff', lastName: 'Bridges' };
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspector);
			mockEntraClientForCaseOfficer.getUserById.mock.mockImplementationOnce(() => ({
				id: 'officer-1',
				mail: 'officer@test.com',
				displayName: 'Test Officer'
			}));

			await notifyCaseOfficerOfAssignedCases(
				caseOfficerService,
				mockSession,
				'inspector-1',
				'2025-01-01',
				['REF001', 'REF002'],
				'officer-1'
			);

			assert.strictEqual(mockEntraClientForCaseOfficer.getUserById.mock.callCount(), 1);
			assert.strictEqual(mockEntraClientForCaseOfficer.getUserById.mock.calls[0].arguments[0], 'officer-1');
			assert.strictEqual(mockService.notifyClient.sendAssignedCaseCaseOfficerEmail.mock.callCount(), 1);
			const notifyCall = mockService.notifyClient.sendAssignedCaseCaseOfficerEmail.mock.calls[0];
			assert.strictEqual(notifyCall.arguments[0], 'officer@test.com');
			assert.deepStrictEqual(notifyCall.arguments[1], {
				caseOfficerName: 'Test Officer',
				inspectorName: 'Jeff Bridges',
				assignmentDate: '2025-01-01',
				selectedCases: 'REF001, REF002'
			});
		});

		it('should skip notification when case officer has no email in Entra', async () => {
			const caseOfficerService = {
				...mockService,
				entraClient: mockInitEntraClientForCaseOfficer
			};
			mockEntraClientForCaseOfficer.getUserById.mock.mockImplementationOnce(() => ({
				id: 'officer-1',
				mail: null,
				displayName: 'Test Officer'
			}));

			await notifyCaseOfficerOfAssignedCases(
				caseOfficerService,
				mockSession,
				'inspector-1',
				'2025-01-01',
				['REF001'],
				'officer-1'
			);

			assert.strictEqual(mockService.notifyClient.sendAssignedCaseCaseOfficerEmail.mock.callCount(), 0);
			//assert.strictEqual(mockLogger.warn.mock.callCount(), 1);
		});

		it('should throw error when caseOfficerId is not provided', async () => {
			await assert.rejects(
				() => notifyCaseOfficerOfAssignedCases(mockService, mockSession, 'inspector-1', '2025-01-01', ['REF001'], null),
				{
					name: 'Error',
					message: 'caseOfficerId is required'
				}
			);
		});

		it('should throw error when notify client not configured', async () => {
			const service = { ...mockService, notifyClient: undefined };

			await assert.rejects(
				() =>
					notifyCaseOfficerOfAssignedCases(service, mockSession, 'inspector-1', '2025-01-01', ['REF001'], 'officer-1'),
				{
					name: 'Error',
					message: 'Notify client not configured'
				}
			);
		});

		it('should throw error when Entra client cannot be initialised', async () => {
			const caseOfficerService = {
				...mockService,
				entraClient: mock.fn(() => null)
			};

			await assert.rejects(
				() =>
					notifyCaseOfficerOfAssignedCases(
						caseOfficerService,
						mockSession,
						'inspector-1',
						'2025-01-01',
						['REF001'],
						'officer-1'
					),
				{
					name: 'Error',
					message: 'Could not initialise Entra client'
				}
			);
		});

		it('should throw error when inspector details cannot be retrieved', async () => {
			const caseOfficerService = {
				...mockService,
				entraClient: mockInitEntraClientForCaseOfficer
			};
			mockEntraClientForCaseOfficer.getUserById.mock.mockImplementationOnce(() => ({
				id: 'officer-1',
				mail: 'officer@test.com',
				displayName: 'Test Officer'
			}));
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => null);

			await assert.rejects(
				() =>
					notifyCaseOfficerOfAssignedCases(
						caseOfficerService,
						mockSession,
						'inspector-1',
						'2025-01-01',
						['REF001'],
						'officer-1'
					),
				{
					name: 'Error',
					message: 'Could not retrieve inspector name'
				}
			);
		});
	});

	describe('isSelfSelectedAssignment', () => {
		it('should return true when the session account ID matches the inspector ID', () => {
			const result = isSelfSelectedAssignment({ account: { localAccountId: 'inspector-1' } }, 'inspector-1');
			assert.strictEqual(result, true);
		});

		it('should return false when the session account ID does not match the inspector ID', () => {
			const result = isSelfSelectedAssignment({ account: { localAccountId: 'officer-1' } }, 'inspector-1');
			assert.strictEqual(result, false);
		});

		it('should return false when there is no session account', () => {
			const result = isSelfSelectedAssignment({}, 'inspector-1');
			assert.strictEqual(result, false);
		});

		it('should return false when there is no inspector ID', () => {
			const result = isSelfSelectedAssignment({ account: { localAccountId: 'inspector-1' } }, '');
			assert.strictEqual(result, false);
		});
	});

	describe('notifyProgrammeOfficerOfSelfAssignedCases', () => {
		const mockEntraClientForProgrammer = {
			getUserById: mock.fn()
		};
		const mockInitEntraClientForProgrammer = mock.fn();
		const mockAssignmentClient = {
			getAssignmentByInspectorId: mock.fn()
		};

		/** @returns {*} */
		const programmerService = () => ({
			...mockService,
			entraClient: mockInitEntraClientForProgrammer,
			assignmentClient: mockAssignmentClient
		});

		beforeEach(() => {
			mockService.inspectorClient.getInspectorDetails.mock.resetCalls();
			mockService.notifyClient.sendSelfAssignedCaseProgrammeOfficerEmail.mock.resetCalls();
			mockEntraClientForProgrammer.getUserById.mock.resetCalls();
			mockAssignmentClient.getAssignmentByInspectorId.mock.resetCalls();
			mockInitEntraClientForProgrammer.mock.resetCalls();
			mockInitEntraClientForProgrammer.mock.mockImplementation(() => mockEntraClientForProgrammer);
		});

		it('should send the self-selection email to the assigned programmer', async () => {
			mockAssignmentClient.getAssignmentByInspectorId.mock.mockImplementationOnce(() => ({
				inspectorId: 'inspector-1',
				programmerId: 'programmer-1'
			}));
			mockEntraClientForProgrammer.getUserById.mock.mockImplementationOnce(() => ({
				id: 'programmer-1',
				mail: 'programmer@test.com',
				displayName: 'Test Programmer'
			}));
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => ({
				firstName: 'Jeff',
				lastName: 'Bridges'
			}));

			const sent = await notifyProgrammeOfficerOfSelfAssignedCases(
				programmerService(),
				mockSession,
				'inspector-1',
				'2025-01-01',
				['REF001', 'REF002']
			);

			assert.strictEqual(sent, true);
			assert.strictEqual(mockService.notifyClient.sendSelfAssignedCaseProgrammeOfficerEmail.mock.callCount(), 1);
			const notifyCall = mockService.notifyClient.sendSelfAssignedCaseProgrammeOfficerEmail.mock.calls[0];
			assert.strictEqual(notifyCall.arguments[0], 'programmer@test.com');
			assert.deepStrictEqual(notifyCall.arguments[1], {
				programmeOfficerName: 'Test Programmer',
				inspectorName: 'Jeff Bridges',
				assignmentDate: '2025-01-01',
				selectedCases: 'REF001, REF002'
			});
		});

		it('should skip the notification when the inspector has no assigned programmer', async () => {
			mockAssignmentClient.getAssignmentByInspectorId.mock.mockImplementationOnce(() => null);

			const sent = await notifyProgrammeOfficerOfSelfAssignedCases(
				programmerService(),
				mockSession,
				'inspector-1',
				'2025-01-01',
				['REF001']
			);

			assert.strictEqual(sent, false);
			assert.strictEqual(mockService.notifyClient.sendSelfAssignedCaseProgrammeOfficerEmail.mock.callCount(), 0);
		});

		it('should skip the notification when the programmer has no email in Entra', async () => {
			mockAssignmentClient.getAssignmentByInspectorId.mock.mockImplementationOnce(() => ({
				inspectorId: 'inspector-1',
				programmerId: 'programmer-1'
			}));
			mockEntraClientForProgrammer.getUserById.mock.mockImplementationOnce(() => ({
				id: 'programmer-1',
				mail: null,
				displayName: 'Test Programmer'
			}));

			const sent = await notifyProgrammeOfficerOfSelfAssignedCases(
				programmerService(),
				mockSession,
				'inspector-1',
				'2025-01-01',
				['REF001']
			);

			assert.strictEqual(sent, false);
			assert.strictEqual(mockService.notifyClient.sendSelfAssignedCaseProgrammeOfficerEmail.mock.callCount(), 0);
		});

		it('should throw error when notify client not configured', async () => {
			const service = { ...programmerService(), notifyClient: undefined };

			await assert.rejects(
				() => notifyProgrammeOfficerOfSelfAssignedCases(service, mockSession, 'inspector-1', '2025-01-01', ['REF001']),
				{
					name: 'Error',
					message: 'Notify client not configured'
				}
			);
		});

		it('should throw error when Entra client cannot be initialised', async () => {
			mockAssignmentClient.getAssignmentByInspectorId.mock.mockImplementationOnce(() => ({
				inspectorId: 'inspector-1',
				programmerId: 'programmer-1'
			}));
			const service = { ...programmerService(), entraClient: mock.fn(() => null) };

			await assert.rejects(
				() => notifyProgrammeOfficerOfSelfAssignedCases(service, mockSession, 'inspector-1', '2025-01-01', ['REF001']),
				{
					name: 'Error',
					message: 'Could not initialise Entra client'
				}
			);
		});

		it('should throw error when inspector details cannot be retrieved', async () => {
			mockAssignmentClient.getAssignmentByInspectorId.mock.mockImplementationOnce(() => ({
				inspectorId: 'inspector-1',
				programmerId: 'programmer-1'
			}));
			mockEntraClientForProgrammer.getUserById.mock.mockImplementationOnce(() => ({
				id: 'programmer-1',
				mail: 'programmer@test.com',
				displayName: 'Test Programmer'
			}));
			mockService.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => null);

			await assert.rejects(
				() =>
					notifyProgrammeOfficerOfSelfAssignedCases(programmerService(), mockSession, 'inspector-1', '2025-01-01', [
						'REF001'
					]),
				{
					name: 'Error',
					message: 'Could not retrieve inspector name'
				}
			);
		});
	});

	describe('notifyAssignedCases', () => {
		const inspector = { email: 'inspector@test.com', firstName: 'Jeff', lastName: 'Bridges' };
		const entraUsers = {
			'officer-1': { mail: 'officer1@test.com', displayName: 'Officer One' },
			'officer-2': { mail: 'officer2@test.com', displayName: 'Officer Two' },
			'programmer-1': { mail: 'programmer@test.com', displayName: 'Test Programmer' }
		};
		const programmeOfficerSession = { account: { username: 'po@test.com', name: 'Test PO' } };
		const selfSelectedSession = {
			account: { localAccountId: 'inspector-1', username: 'inspector@test.com', name: 'Jeff Bridges' }
		};
		const assignment = {
			inspectorId: 'inspector-1',
			assignmentDate: '2025-01-01',
			caseReferences: ['REF001', 'REF002', 'REF003'],
			caseReferencesByCaseOfficer: new Map([
				['officer-1', ['REF001', 'REF002']],
				['officer-2', ['REF003']]
			])
		};

		/** @returns {*} */
		const buildService = () => ({
			...mockService,
			logger: { info: mock.fn(), warn: mock.fn() },
			inspectorClient: { ...mockService.inspectorClient, getInspectorDetails: mock.fn(() => inspector) },
			entraClient: mock.fn(() => ({ getUserById: mock.fn((id) => entraUsers[id]) })),
			assignmentClient: { getAssignmentByInspectorId: mock.fn(() => ({ programmerId: 'programmer-1' })) },
			notifyClient: {
				sendAssignedCaseEmail: mock.fn(),
				sendSelfAssignedCaseEmail: mock.fn(),
				sendAssignedCaseProgrammeOfficerEmail: mock.fn(),
				sendSelfAssignedCaseProgrammeOfficerEmail: mock.fn(),
				sendAssignedCaseCaseOfficerEmail: mock.fn()
			}
		});
		/** @param {*} fn */
		const recipients = (fn) => fn.mock.calls.map((call) => call.arguments[0]);
		/** @param {*} logFn @param {string} message */
		const findLog = (logFn, message) => logFn.mock.calls.find((call) => call.arguments[1] === message);

		it('should send the standard emails to the inspector, programme officer and each case officer', async () => {
			const service = buildService();

			const result = await notifyAssignedCases(service, programmeOfficerSession, assignment);

			assert.deepStrictEqual(result, { inspectorNotified: true, programmeOfficerNotified: true });
			const { notifyClient } = service;
			assert.deepStrictEqual(recipients(notifyClient.sendAssignedCaseEmail), ['inspector@test.com']);
			assert.deepStrictEqual(recipients(notifyClient.sendAssignedCaseProgrammeOfficerEmail), ['po@test.com']);
			assert.deepStrictEqual(recipients(notifyClient.sendAssignedCaseCaseOfficerEmail), [
				'officer1@test.com',
				'officer2@test.com'
			]);
			assert.strictEqual(notifyClient.sendSelfAssignedCaseEmail.mock.callCount(), 0);
			assert.strictEqual(notifyClient.sendSelfAssignedCaseProgrammeOfficerEmail.mock.callCount(), 0);
			assert.strictEqual(
				notifyClient.sendAssignedCaseCaseOfficerEmail.mock.calls[1].arguments[1].selectedCases,
				'REF003'
			);
			assert.ok(findLog(service.logger.info, 'Email notification sent successfully to inspector'));
			assert.strictEqual(
				service.logger.info.mock.calls.filter(
					(call) => call.arguments[1] === 'Email notification sent successfully to case officer'
				).length,
				2
			);
		});

		it('should send the self-assigned emails when the inspector assigned the cases to themselves', async () => {
			const service = buildService();

			const result = await notifyAssignedCases(service, selfSelectedSession, assignment);

			assert.deepStrictEqual(result, { inspectorNotified: true, programmeOfficerNotified: true });
			const { notifyClient } = service;
			assert.deepStrictEqual(recipients(notifyClient.sendSelfAssignedCaseEmail), ['inspector@test.com']);
			assert.deepStrictEqual(recipients(notifyClient.sendSelfAssignedCaseProgrammeOfficerEmail), [
				'programmer@test.com'
			]);
			assert.strictEqual(notifyClient.sendAssignedCaseEmail.mock.callCount(), 0);
			assert.strictEqual(notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 0);
			assert.strictEqual(notifyClient.sendAssignedCaseCaseOfficerEmail.mock.callCount(), 2);
		});

		it('should report the programme officer as not notified when the self-selection notification is skipped', async () => {
			const service = buildService();
			service.assignmentClient.getAssignmentByInspectorId.mock.mockImplementation(() => null);

			const result = await notifyAssignedCases(service, selfSelectedSession, assignment);

			assert.deepStrictEqual(result, { inspectorNotified: true, programmeOfficerNotified: false });
		});

		it('should send the emails in parallel', async () => {
			const service = buildService();
			/** @type {() => void} */
			let resolveInspectorEmail = () => {};
			service.notifyClient.sendAssignedCaseEmail.mock.mockImplementation(
				() => new Promise((resolve) => (resolveInspectorEmail = resolve))
			);

			const pending = notifyAssignedCases(service, programmeOfficerSession, assignment);
			// let the other notifications run while the inspector email is still in flight
			await new Promise((resolve) => setImmediate(resolve));

			assert.strictEqual(service.notifyClient.sendAssignedCaseEmail.mock.callCount(), 1);
			assert.strictEqual(service.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.callCount(), 1);
			assert.strictEqual(service.notifyClient.sendAssignedCaseCaseOfficerEmail.mock.callCount(), 2);

			resolveInspectorEmail();
			assert.deepStrictEqual(await pending, { inspectorNotified: true, programmeOfficerNotified: true });
		});

		it('should log failures without preventing the other emails from being sent', async () => {
			const service = buildService();
			service.notifyClient.sendAssignedCaseEmail.mock.mockImplementation(() => {
				throw new Error('Inspector email failed');
			});
			service.notifyClient.sendAssignedCaseProgrammeOfficerEmail.mock.mockImplementation(() => {
				throw new Error('PO email failed');
			});
			service.notifyClient.sendAssignedCaseCaseOfficerEmail.mock.mockImplementation((email) => {
				if (email === 'officer1@test.com') throw new Error('Case officer email failed');
			});

			const result = await notifyAssignedCases(service, programmeOfficerSession, assignment);

			assert.deepStrictEqual(result, { inspectorNotified: false, programmeOfficerNotified: false });
			assert.strictEqual(service.notifyClient.sendAssignedCaseCaseOfficerEmail.mock.callCount(), 2);

			const inspectorWarning = findLog(
				service.logger.warn,
				'Failed to send email notification to inspector after case assignment'
			);
			assert.strictEqual(inspectorWarning.arguments[0].inspectorId, 'inspector-1');
			assert.strictEqual(inspectorWarning.arguments[0].err.message, 'Inspector email failed');

			const poWarning = findLog(
				service.logger.warn,
				'Failed to send email notification to programme officer after case assignment'
			);
			assert.strictEqual(poWarning.arguments[0].programmeOfficerEmail, 'po@test.com');
			assert.strictEqual(poWarning.arguments[0].err.message, 'PO email failed');

			const caseOfficerWarning = findLog(
				service.logger.warn,
				'Failed to send email notification to case officer after case assignment'
			);
			assert.strictEqual(caseOfficerWarning.arguments[0].caseOfficerId, 'officer-1');

			const caseOfficerSuccess = findLog(service.logger.info, 'Email notification sent successfully to case officer');
			assert.strictEqual(caseOfficerSuccess.arguments[0].caseOfficerId, 'officer-2');
		});

		it('should not send case officer emails when there are no case officers', async () => {
			const service = buildService();

			const result = await notifyAssignedCases(service, programmeOfficerSession, {
				...assignment,
				caseReferencesByCaseOfficer: undefined
			});

			assert.deepStrictEqual(result, { inspectorNotified: true, programmeOfficerNotified: true });
			assert.strictEqual(service.notifyClient.sendAssignedCaseCaseOfficerEmail.mock.callCount(), 0);
		});
	});
});
