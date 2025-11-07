import { describe, mock, test } from 'node:test';
import { buildPostHome, buildViewHome } from './controller.js';
import assert from 'assert';
import { mockLogger } from '@pins/inspector-programming-lib/testing/mock-logger.js';
import { format, toZonedTime } from 'date-fns-tz';

describe('controller.js', () => {
	describe('buildViewHome', () => {
		const entraClient = {
			listAllGroupMembers: mock.fn(() => [])
		};
		const mockService = () => {
			return {
				logger: mockLogger(),
				entraClient() {
					return entraClient;
				},
				entraGroupIds: {
					inspectors: 'inspectors-group-id',
					teamLeads: 'team-leads-group-id',
					nationalTeam: 'national-team-group-id'
				},
				casesClient: {
					getAllCases: mock.fn(() => []),
					getCases: mock.fn(() => ({ cases: [], total: 0 }))
				},
				inspectorClient: {
					getInspectorDetails: mock.fn(),
					getAllInspectors: mock.fn()
				},
				osMapsApiKey: 'test-api-key',
				getSimplifiedEvents: mock.fn(async () => [])
			};
		};
		const setupInspectorTest = (service, inspectorData) => {
			entraClient.listAllGroupMembers.mock.mockImplementationOnce(() => [
				{ id: inspectorData.id, name: inspectorData.name }
			]);
			service.inspectorClient.getAllInspectors.mock.mockImplementationOnce(() => [{ id: inspectorData.id }]);
			service.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspectorData);
		};

		test('should get all cases', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, caseAge: i * 5 })),
				total: 10
			}));
			const req = { url: '/', query: {}, session: {} };
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(service.casesClient.getCases.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.appeals?.cases?.length, 10);
		});
		test('should fetch inspector data', async () => {
			const service = mockService();
			entraClient.listAllGroupMembers.mock.mockImplementationOnce(() => [
				{ id: 'inspector-id', name: 'Test Inspector' }
			]);
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, caseAge: i * 5 })),
				total: 10
			}));
			const inspectorData = {
				id: 'inspector-id',
				name: 'Test Inspector',
				entraId: 'entra-id',
				grade: 'B2',
				postcode: 'BS1 6PN',
				longitude: -2.5828931,
				latitude: 51.4508591,
				Specialisms: []
			};
			service.inspectorClient.getInspectorDetails.mock.mockImplementationOnce(() => inspectorData);
			const req = {
				url: '/?inspectorId=inspector-id',
				query: { inspectorId: 'inspector-id' },
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(service.casesClient.getCases.mock.callCount(), 1);
			assert.deepStrictEqual(service.casesClient.getCases.mock.calls[0].arguments[0], {
				inspectorCoordinates: { lat: 51.4508591, lng: -2.5828931 }
			});
			assert.strictEqual(service.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.appeals?.cases?.length, 10);
			// just check a few fields match
			assert.strictEqual(args.inspectors.selected.id, inspectorData.id);
			assert.strictEqual(args.inspectors.selected.name, inspectorData.name);
		});
		test('should return an error if trying to sort by distance without an inspector selected', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, caseAge: i * 5 })),
				total: 10
			}));
			const req = {
				url: '/?sort=distance',
				query: { sort: 'distance' },
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};

			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(service.casesClient.getCases.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.errorSummary.length, 1);
			assert.strictEqual(args.appeals?.cases?.length, 10);
			assert.deepStrictEqual(args.errorSummary, [{ text: 'Select an inspector', href: '#inspectors' }]);
			//ensure cases sorted by age by default
			assert.deepStrictEqual(
				args.appeals.cases.map((c) => c.id),
				[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
			);
		});
		test('should not filter cases by inspector coordinates if inspector details is missing', async () => {
			const service = mockService();
			entraClient.listAllGroupMembers.mock.mockImplementationOnce(() => [
				{ id: 'inspector-id', name: 'Test Inspector' }
			]);
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, caseAge: i * 5 })),
				total: 10
			}));
			const req = {
				url: '/?inspectorId=inspector-id',
				query: { inspectorId: 'inspector-id' },
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(service.casesClient.getCases.mock.callCount(), 1);
			assert.deepStrictEqual(service.casesClient.getCases.mock.calls[0].arguments[0], {});
			assert.strictEqual(service.inspectorClient.getInspectorDetails.mock.callCount(), 1);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.appeals?.cases?.length, 10);
		});

		test('should mark cases as selected based on session data', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [
					{ caseId: 101, id: 1 },
					{ caseId: 102, id: 2 },
					{ caseId: 103, id: 3 }
				],
				total: 3
			}));
			const req = {
				url: '/',
				query: {},
				session: {
					persistence: {
						caseListData: {
							selectedCases: ['101', '103']
						}
					}
				}
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.appeals?.cases?.length, 3);
			assert.strictEqual(args.appeals.cases[0].selected, true);
			assert.strictEqual(args.appeals.cases[1].selected, undefined);
			assert.strictEqual(args.appeals.cases[2].selected, true);
		});

		test('should show error when on inspector tab without inspector selected', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			const req = {
				url: '/?currentTab=inspector',
				query: { currentTab: 'inspector' },
				session: {}
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.errorSummary.length, 1);
			assert.deepStrictEqual(args.errorSummary, [{ text: 'Select an inspector', href: '#inspectors' }]);
		});

		test('should show error when on calendar tab without inspector selected', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			const req = {
				url: '/?currentTab=calendar',
				query: { currentTab: 'calendar' },
				session: {}
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.errorSummary.length, 1);
			assert.deepStrictEqual(args.errorSummary, [{ text: 'Select an inspector', href: '#inspectors' }]);
		});

		test('should show error when selectInspectorError in session', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			const req = {
				url: '/',
				query: {},
				session: {
					persistence: {
						errors: {
							selectInspectorError: true
						}
					}
				}
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.errorSummary.length, 1);
			assert.deepStrictEqual(args.errorSummary, [{ text: 'Select an inspector', href: '#inspectors' }]);
		});

		test('should add assigned cases error to error summary', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			const req = {
				url: '/',
				query: {},
				session: {
					persistence: {
						errors: {
							assignedCasesError: 'Failed to assign cases'
						}
					}
				}
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.strictEqual(args.errorSummary.length, 1);
			assert.deepStrictEqual(args.errorSummary, [{ text: 'Failed to assign cases', href: '' }]);
		});

		test('should add assignment date error to error summary', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			const req = {
				url: '/',
				query: {},
				session: {
					persistence: {
						errors: {
							selectAssignmentDateError: 'Please select a valid assignment date'
						}
					}
				}
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			const assignmentDateErrors = args.errorSummary.filter((e) => e.href === '#assignment-date');
			assert.strictEqual(assignmentDateErrors.length, 1);
			assert.strictEqual(assignmentDateErrors[0].text, 'Please select a valid assignment date');
		});

		test('should add case list error to error summary', async () => {
			const service = mockService();
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			const req = {
				url: '/',
				query: {},
				session: {
					persistence: {
						errors: {
							caseListError: 'You must select at least one case'
						}
					}
				}
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			const caseListErrors = args.errorSummary.filter((e) => e.href === '#caseListError');
			assert.strictEqual(caseListErrors.length, 1);
			assert.strictEqual(caseListErrors[0].text, 'You must select at least one case');
		});

		test('should attempt to fetch calendar events when inspector is selected', async () => {
			const service = mockService();
			const inspectorData = {
				id: 'inspector-id',
				name: 'Test Inspector',
				latitude: 51.4508591,
				longitude: -2.5828931
			};
			setupInspectorTest(service, inspectorData);
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			const req = {
				url: '/?inspectorId=inspector-id',
				query: { inspectorId: 'inspector-id' },
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.ok(args.calendar);
		});

		test('should fetch calendar events with custom calendar start date', async () => {
			const service = mockService();
			const inspectorData = {
				id: 'inspector-id',
				name: 'Test Inspector',
				entraId: 'entra-123',
				latitude: 51.4508591,
				longitude: -2.5828931
			};
			setupInspectorTest(service, inspectorData);
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			const req = {
				url: '/?inspectorId=inspector-id&calendarStartDate=Mon Jan 01 2024 00:00:00',
				query: {
					inspectorId: 'inspector-id',
					calendarStartDate: 'Mon Jan 01 2024 00:00:00'
				},
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.ok(args.calendar);
		});

		test('should fetch calendar events on calendar tab', async () => {
			const service = mockService();
			const inspectorData = {
				id: 'inspector-id',
				name: 'Test Inspector',
				entraId: 'entra-123',
				latitude: 51.4508591,
				longitude: -2.5828931
			};
			setupInspectorTest(service, inspectorData);
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			const req = {
				url: '/?inspectorId=inspector-id&currentTab=calendar',
				query: {
					inspectorId: 'inspector-id',
					currentTab: 'calendar'
				},
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.ok(args.calendar);
		});

		test('should handle calendar error and add to error summary when on calendar tab', async () => {
			const service = mockService();
			const inspectorData = {
				id: 'inspector-id',
				name: 'Test Inspector',
				entraId: 'entra-123',
				latitude: 51.4508591,
				longitude: -2.5828931
			};
			setupInspectorTest(service, inspectorData);
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			service.getSimplifiedEvents.mock.mockImplementationOnce(async () => {
				throw new Error('Calendar fetch failed');
			});
			const req = {
				url: '/?inspectorId=inspector-id&currentTab=calendar',
				query: {
					inspectorId: 'inspector-id',
					currentTab: 'calendar'
				},
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.ok(args.calendar);
			assert.strictEqual(service.getSimplifiedEvents.mock.callCount(), 1);
			const calendarErrors = args.errorSummary.filter((e) => e.href === '#calendarError');
			assert.strictEqual(calendarErrors.length, 1);
			assert.strictEqual(calendarErrors[0].text, 'Contact Inspector to ensure this calendar is shared with you');
			assert.strictEqual(service.logger.error.mock.callCount(), 1);
		});

		test('should handle calendar error but not add to error summary when not on calendar tab', async () => {
			const service = mockService();
			const inspectorData = {
				id: 'inspector-id',
				name: 'Test Inspector',
				entraId: 'entra-123',
				latitude: 51.4508591,
				longitude: -2.5828931
			};
			setupInspectorTest(service, inspectorData);
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			service.getSimplifiedEvents.mock.mockImplementationOnce(async () => {
				throw new Error('Calendar fetch failed');
			});
			const req = {
				url: '/?inspectorId=inspector-id',
				query: {
					inspectorId: 'inspector-id'
				},
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.ok(args.calendar);
			assert.strictEqual(service.getSimplifiedEvents.mock.callCount(), 1);
			const calendarErrors = args.errorSummary.filter((e) => e.href === '#calendarError');
			assert.strictEqual(calendarErrors.length, 0);
			assert.strictEqual(service.logger.error.mock.callCount(), 1);
		});

		test('should set calendar error message when getSimplifiedEvents fails', async () => {
			const service = mockService();
			const inspectorData = {
				id: 'inspector-id',
				name: 'Test Inspector',
				entraId: 'entra-123',
				latitude: 51.4508591,
				longitude: -2.5828931
			};
			setupInspectorTest(service, inspectorData);
			service.casesClient.getCases.mock.mockImplementationOnce(() => ({
				cases: [],
				total: 0
			}));
			service.getSimplifiedEvents.mock.mockImplementationOnce(async () => {
				throw new Error('Calendar fetch failed');
			});
			const req = {
				url: '/?inspectorId=inspector-id',
				query: {
					inspectorId: 'inspector-id'
				},
				session: { account: { idTokenClaims: { groups: ['inspectors-group-id'] }, localAccountId: 'inspector-id' } }
			};
			const res = { render: mock.fn() };
			const controller = buildViewHome(service);
			await controller(req, res);
			assert.strictEqual(res.render.mock.callCount(), 1);
			const args = res.render.mock.calls[0].arguments[1];
			assert.ok(args.calendar);
			assert.strictEqual(service.getSimplifiedEvents.mock.callCount(), 1);
			assert.strictEqual(args.calendar.error, 'Contact Inspector to ensure this calendar is shared with you');
		});
	});

	describe('buildPostHome', () => {
		const mockService = () => {
			return {
				logger: mockLogger()
			};
		};
		test('should calculate last weeks start date if calendarAction is prevWeek', async () => {
			const service = mockService();
			const req = {
				body: {
					inspectorId: 'inspectorId',
					calendarAction: 'prevWeek',
					currentStartDate: '2025-08-04T12:00:00Z'
				}
			};
			const res = { redirect: mock.fn() };
			const controller = buildPostHome(service);
			await controller(req, res);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			const expectedDate = new Date(2025, 6, 28, 0, 0, 0, 0);
			const expectedDateString = convertDateToDateTimeString(expectedDate);
			assert.strictEqual(
				res.redirect.mock.calls[0].arguments[0].includes(
					`/?inspectorId=inspectorId&calendarStartDate=${expectedDateString}`
				),
				true
			);
		});
		test('should calculate next weeks start date if calendarAction is nextWeek', async () => {
			const service = mockService();
			const req = {
				body: {
					inspectorId: 'inspectorId',
					calendarAction: 'nextWeek',
					currentStartDate: '2025-08-04T12:00:00Z'
				}
			};
			const res = { redirect: mock.fn() };
			const controller = buildPostHome(service);
			await controller(req, res);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			const expectedDate = new Date(2025, 7, 11, 0, 0, 0, 0);
			const expectedDateString = convertDateToDateTimeString(expectedDate);
			assert.strictEqual(
				res.redirect.mock.calls[0].arguments[0].includes(
					`/?inspectorId=inspectorId&calendarStartDate=${expectedDateString}`
				),
				true
			);
		});
		test('should calculate today weeks start date if calendarAction and newStartDate is not given', async (ctx) => {
			ctx.mock.timers.enable({
				apis: ['Date'],
				now: new Date('2023-10-04T12:00:00Z')
			});
			const service = mockService();
			const req = {
				body: {
					inspectorId: 'inspectorId'
				}
			};
			const res = { redirect: mock.fn() };
			const controller = buildPostHome(service);
			await controller(req, res);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			const expectedDate = new Date(2023, 9, 2, 0, 0, 0, 0);
			const expectedDateString = convertDateToDateTimeString(expectedDate);
			assert.strictEqual(
				res.redirect.mock.calls[0].arguments[0].includes(
					`/?inspectorId=inspectorId&calendarStartDate=${expectedDateString}`
				),
				true
			);
		});
		test('should calculate week beginning of newStartDate', async () => {
			const service = mockService();
			const req = {
				body: {
					inspectorId: 'inspectorId',
					newStartDate: '2025-08-16T12:00:00Z'
				}
			};
			const res = { redirect: mock.fn() };
			const controller = buildPostHome(service);
			await controller(req, res);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			const expectedDate = new Date(2025, 7, 11, 0, 0, 0, 0);
			const expectedDateString = convertDateToDateTimeString(expectedDate);
			assert.strictEqual(
				res.redirect.mock.calls[0].arguments[0].includes(
					`/?inspectorId=inspectorId&calendarStartDate=${expectedDateString}`
				),
				true
			);
		});

		test('should redirect to inspector page when action is view', async () => {
			const service = mockService();
			const req = {
				body: {
					action: 'view',
					inspectorId: 'test-inspector-id'
				}
			};
			const res = { redirect: mock.fn() };
			const controller = buildPostHome(service);
			await controller(req, res);
			assert.strictEqual(res.redirect.mock.callCount(), 1);
			assert.strictEqual(res.redirect.mock.calls[0].arguments[0], '/inspector/test-inspector-id');
		});
	});
});

/**
 * @param {Date} date
 */
function convertDateToDateTimeString(date) {
	const timeZone = 'Europe/London';
	const convertedDate = toZonedTime(date, timeZone);
	return format(convertedDate, 'EEE MMM dd yyyy HH:mm:ss', { timeZone });
}
