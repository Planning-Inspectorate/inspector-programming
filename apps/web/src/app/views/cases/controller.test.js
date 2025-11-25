import { beforeEach, describe, mock, test } from 'node:test';
import assert from 'assert';
import { buildPostCases } from './controller.js';
import { mockLogger } from '@pins/inspector-programming-lib/testing/mock-logger.js';

describe('controller.js', () => {
	describe('buildPostCases', () => {
		beforeEach(() => {
			mockGetCbosApiClientForSession.mock.resetCalls();
			mockCbosApiClient.patchAppeal.mock.resetCalls();
			mockCasesClient.getCaseById.mock.resetCalls();
			mockCasesClient.getLinkedCasesByParentCaseId.mock.resetCalls();
			mockCalendarClient.getAllCalendarEventTimingRules.mock.resetCalls();
			mockCbosApiClient.fetchAppealDetails.mock.resetCalls();
		});
		//mock clients
		const mockCasesClient = {
			getCaseById: mock.fn(),
			getLinkedCasesByParentCaseId: mock.fn(),
			deleteCases: mock.fn()
		};
		const mockCbosApiClient = {
			patchAppeal: mock.fn(),
			fetchAppealDetails: mock.fn()
		};
		const mockEntraClientInstance = {
			listAllUserCalendarEvents: mock.fn(),
			createCalendarEvents: mock.fn()
		};
		const mockGetCbosApiClientForSession = mock.fn();
		const mockCalendarClient = {
			getAllCalendarEventTimingRules: mock.fn(),
			getEnglandWalesBankHolidays: mock.fn()
		};
		const mockInspectorClient = {
			getInspectorDetails: mock.fn((id) => ({
				id,
				email: 'inspector@example.com',
				entraId: 'entra-' + id,
				firstName: 'Test',
				lastName: 'Inspector'
			}))
		};
		const mockNotifyClient = {
			sendAssignedCaseEmail: mock.fn()
		};
		const notifyConfig = { cbosLink: 'https://example.com/cbos' };
		const mockService = () => {
			return {
				logger: mockLogger(),
				getCbosApiClientForSession: mockGetCbosApiClientForSession,
				casesClient: mockCasesClient,
				calendarClient: mockCalendarClient,
				entraClient: mock.fn(() => mockEntraClientInstance),
				inspectorClient: mockInspectorClient,
				notifyClient: mockNotifyClient,
				notifyConfig
			};
		};

		//mock data responses
		const appeal = {
			caseId: 1,
			caseReference: '1',
			linkedCaseStatus: 'child',
			caseType: 'H',
			caseProcedure: 'W',
			caseLevel: 'B'
		};
		const mockTimingRule = {
			id: 1,
			caseType: 'H',
			caseProcedure: 'W',
			allocationLevel: 'B',
			CalendarEventTiming: { prepTime: 2, siteVisitTime: 3, reportTime: 2, costsTime: 1 }
		};
		const [event1, event2] = [
			{
				id: 'caseId',
				subject: 'test case',
				start: {
					dateTime: new Date('2025-08-08T12:00:00.000Z'),
					timeZone: 'UTC'
				},
				end: {
					dateTime: new Date('2025-08-08T14:00:00.000Z'),
					timeZone: 'UTC'
				},
				sensitivity: 'normal'
			},
			{
				id: 'caseId2',
				subject: 'test case 2',
				start: {
					dateTime: new Date('2025-08-09T11:00:00.000Z'),
					timeZone: 'UTC'
				},
				end: {
					dateTime: new Date('2025-08-09T15:00:00.000Z'),
					timeZone: 'UTC'
				},
				sensitivity: 'normal'
			}
		];
		const existingEvents = [event1, event2];

		//mock implementations
		mockCasesClient.getCaseById.mock.mockImplementation(() => appeal);
		mockGetCbosApiClientForSession.mock.mockImplementation(() => mockCbosApiClient);
		mockCalendarClient.getEnglandWalesBankHolidays.mock.mockImplementation(() => []);
		mockEntraClientInstance.listAllUserCalendarEvents.mock.mockImplementation(() => existingEvents);
		mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementation(() => [mockTimingRule]);

		test('should update one case', async () => {
			const appealsDetailsList = [{ appealId: 1, appealReference: '1' }];
			mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
			const service = mockService();
			const req = { body: { inspectorId: 'inspectorId', selectedCases: 1, assignmentDate: '2026-09-18' }, session: {} };
			const res = { redirect: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 1);
			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.calls[0].arguments[0], '/?inspectorId=inspectorId');
		});

		test('should update list of cases', async () => {
			const appealsDetailsList = [
				{ appealId: 1, appealReference: '1' },
				{ appealId: 2, appealReference: '2' },
				{ appealId: 3, appealReference: '3' }
			];
			mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
			const service = mockService();
			const req = {
				body: { inspectorId: 'inspectorId', selectedCases: [1, 2, 3], assignmentDate: '2026-09-18' },
				session: {}
			};
			const res = { redirect: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 3);
			assert.strictEqual(mockCalendarClient.getAllCalendarEventTimingRules.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.calls[0].arguments[0], '/?inspectorId=inspectorId');
		});

		test('should render 500 template when update to cbos fails on all cases', async () => {
			const appealsDetailsList = [{ appealId: 1, appealReference: '1' }];
			mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
			mockCbosApiClient.patchAppeal.mock.mockImplementationOnce(() => {
				throw new Error();
			});
			const service = mockService();
			const req = {
				body: { inspectorId: 'inspectorId', selectedCases: [1], assignmentDate: '2026-09-18' },
				session: {}
			};
			const res = { render: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.calls[0].arguments[0], 'views/errors/failed-cases.njk');
			assert.strictEqual(
				res.render.mock.calls[0].arguments[1].bodyCopy,
				'Try again later. The following cases were not assigned:'
			);
		});

		test('should render 500 template when update to cbos fails on some cases', async () => {
			const appealsDetailsList = [
				{ appealId: 1, appealReference: '1' },
				{ appealId: 2, appealReference: '2' }
			];
			mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
			mockCbosApiClient.patchAppeal.mock.mockImplementation(() => {
				throw new Error();
			});
			const service = mockService();
			const req = {
				body: { inspectorId: 'inspectorId', selectedCases: [1, 2], assignmentDate: '2026-09-18' },
				session: {}
			};
			const res = { render: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 2);
			assert.strictEqual(res.render.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.calls[0].arguments[0], 'views/errors/failed-cases.njk');
			assert.strictEqual(
				res.render.mock.calls[0].arguments[1].bodyCopy,
				'Try again later. The following cases were not assigned:'
			);
		});

		test('should render 500 template only failed case ids are returned', async () => {
			mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => {
				throw new Error();
			});
			const service = mockService();
			const req = {
				body: { inspectorId: 'inspectorId', selectedCases: [1], assignmentDate: '2026-09-18' },
				session: {}
			};
			const res = { render: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 0);
			assert.strictEqual(res.render.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.calls[0].arguments[0], 'views/errors/failed-cases.njk');
			// Fetch failure also yields the generic message
			assert.strictEqual(
				res.render.mock.calls[0].arguments[1].bodyCopy,
				'Try again later. The following cases were not assigned:'
			);
		});

		test('should not update cases if no inspector is selected', async () => {
			const service = mockService();
			const req = { body: { selectedCases: ['1', '2', '3'], assignmentDate: '2026-09-18' }, session: {} };
			const res = { redirect: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 0);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 0);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.calls[0].arguments[0], '/?inspectorId=undefined');
		});

		test('should not update cases if no assginementDate is selected', async () => {
			const service = mockService();
			const req = {
				body: { inspectorId: 'inspectorId', assignmentDate: '', selectedCases: ['1', '2', '3'] },
				session: {}
			};
			const res = { redirect: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 0);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 0);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.calls[0].arguments[0], '/?inspectorId=inspectorId');
		});

		test('should not update cases if no cases are selected', async () => {
			const service = mockService();
			const req = { body: { inspectorId: 'inspectorId', assignmentDate: '2026-09-18' }, session: {} };
			const res = { redirect: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 0);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 0);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.calls[0].arguments[0], '/?inspectorId=inspectorId');
		});

		test('should render duplicate assignment error page if inspector already assigned', async () => {
			const appealsDetailsList = [{ appealId: 1, appealReference: 'APP/2024/001', inspector: 'inspectorId' }];
			mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
			const service = mockService();
			const req = {
				body: { inspectorId: 'inspectorId', selectedCases: [1], assignmentDate: '2026-09-18' },
				session: {}
			};
			const res = { render: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(mockGetCbosApiClientForSession.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.fetchAppealDetails.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 0);
			assert.strictEqual(res.render.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.calls[0].arguments[0], 'views/errors/duplicate-assignment.njk');
			const templateData = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(templateData.bodyCopy, 'The following case has already been assigned in Manage appeals:');
			assert.deepStrictEqual(templateData.failedCases, ['APP/2024/001']);
			assert.strictEqual(templateData.inspectorId, 'inspectorId');
			assert.strictEqual(service.logger.error.mock.callCount(), 1);
			const logCall = service.logger.error.mock.calls[0];
			assert.strictEqual(logCall.arguments[1], 'Duplicate assignment attempt detected');
			assert.strictEqual(logCall.arguments[0].alreadyAssignedCasesCount, 1);
		});

		test('should render duplicate assignment error page for multiple already assigned cases', async () => {
			const appealsDetailsList = [
				{ appealId: 1, appealReference: 'APP/2024/001', inspector: 'inspectorId' },
				{ appealId: 2, appealReference: 'APP/2024/002', inspector: 'anotherId' }
			];
			mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
			const service = mockService();
			const req = {
				body: { inspectorId: 'inspectorId', selectedCases: [1, 2], assignmentDate: '2026-09-18' },
				session: {}
			};
			const res = { render: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const templateData = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(templateData.bodyCopy, 'The following cases have already been assigned in Manage appeals:');
			assert.deepStrictEqual(templateData.failedCases, ['APP/2024/001', 'APP/2024/002']);
			assert.strictEqual(service.logger.error.mock.callCount(), 1);
			const logCallMulti = service.logger.error.mock.calls[0];
			assert.strictEqual(logCallMulti.arguments[1], 'Duplicate assignment attempt detected');
			assert.strictEqual(logCallMulti.arguments[0].alreadyAssignedCasesCount, 2);
		});

		test('should auto-assign linked child cases when only parent selected', async () => {
			mockCasesClient.getCaseById.mock.mockImplementation((id) => {
				if (id === 1)
					return {
						caseId: 1,
						caseReference: 6000107,
						linkedCaseStatus: 'Parent',
						caseType: 'H',
						caseProcedure: 'W',
						caseLevel: 'B'
					};
				if ([2, 3, 4].includes(id))
					return {
						caseId: id,
						caseReference: 6000107 + id - 1,
						linkedCaseStatus: 'Child',
						caseType: 'H',
						caseProcedure: 'W',
						caseLevel: 'B'
					};
				return undefined;
			});
			mockCalendarClient.getAllCalendarEventTimingRules.mock.mockImplementation(() => [mockTimingRule]);

			const appealsDetailsList = [
				{ appealId: 1, appealReference: 6000107 },
				{ appealId: 2, appealReference: 6000108 },
				{ appealId: 3, appealReference: 6000109 },
				{ appealId: 4, appealReference: 6000110 }
			];
			mockCbosApiClient.fetchAppealDetails.mock.mockImplementationOnce(() => appealsDetailsList);
			mockCasesClient.getLinkedCasesByParentCaseId.mock.mockImplementationOnce(() => [
				{ caseId: 2 },
				{ caseId: 3 },
				{ caseId: 4 }
			]);

			const service = mockService();
			const req = {
				body: { inspectorId: 'inspectorId', selectedCases: [1], assignmentDate: '2026-09-18' },
				session: {}
			};
			const res = { redirect: mock.fn(), render: mock.fn() };
			const controller = buildPostCases(service);
			await controller(req, res);

			assert.strictEqual(mockCasesClient.getLinkedCasesByParentCaseId.mock.callCount(), 1);
			assert.strictEqual(mockCbosApiClient.patchAppeal.mock.callCount(), 4);
		});
	});
});
