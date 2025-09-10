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
				}
			};
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
			assert.deepStrictEqual(args.errorSummary, [
				{ text: 'An inspector must be selected before sorting by distance.', href: '#inspectors' }
			]);
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
