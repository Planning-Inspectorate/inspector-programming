import { test, beforeEach, describe, mock } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import { createRoutes } from './controller.js';
import { mockLogger } from '@pins/inspector-programming-lib/testing/mock-logger.js';
import { TestServer } from '@pins/inspector-programming-lib/testing/test-server.js';

/** @type {import('#service').WebService} */
let mockService;
/** @type {import('express').Express} */
let app;
/** @type {import("./types").NamedTestDates} */
let dates;

beforeEach(() => {
	//set up service
	mockService = {
		logger: mockLogger(),
		apiService: {
			entraClient: {
				listAllGroupMembers: mock.fn(),
				listAllUserCalendarEvents: mock.fn()
			}
		},
		entraConfig: {
			groupIds: {
				inspectorGroups: 'groupA,groupB,groupC'
			}
		}
	};

	dates = {
		oneDayAgo: new Date(),
		twoDaysAgo: new Date(),
		threeDaysAgo: new Date(),
		fourDaysAgo: new Date(),
		oneDayAhead: new Date(),
		twoDaysAhead: new Date(),
		threeDaysAhead: new Date()
	};

	dates.oneDayAgo.setDate(new Date().getDate() - 1);
	dates.twoDaysAgo.setDate(new Date().getDate() - 2);
	dates.threeDaysAgo.setDate(new Date().getDate() - 3);
	dates.fourDaysAgo.setDate(new Date().getDate() - 4);
	dates.oneDayAhead.setDate(new Date().getDate() + 1);
	dates.twoDaysAhead.setDate(new Date().getDate() + 2);
	dates.threeDaysAhead.setDate(new Date().getDate() + 3);

	app = express();
	app.use('/', createRoutes(mockService));
});

/**
 * @param {import('node:test').TestContext} ctx
 * @returns {Promise<TestServer>}
 */
const newServer = async (ctx) => {
	const server = new TestServer(app);
	await server.start();
	ctx.after(async () => await server.stop());
	return server;
};

describe('events', () => {
	describe('GET /events', () => {
		test('returns 404 if no users found in Entra groups', async (ctx) => {
			mockService.entraConfig.groupIds.inspectorGroups = 'groupA,groupB';
			mock.method(mockService.apiService.entraClient, 'listAllGroupMembers', () => []);

			const server = await newServer(ctx);
			const res = await server.get('/');
			assert.strictEqual(res.status, 404);
			assert.strictEqual(await res.text(), 'No users found in Entra groups');
		});
		test('returns 400 if calendarEventsDayRange config is malformed', async (ctx) => {
			mockService.entraConfig.groupIds.inspectorGroups = 'groupA,groupB';
			mockService.entraConfig.calendarEventsDayRange = 'invalidRange';
			mock.method(mockService.apiService.entraClient, 'listAllGroupMembers', async (groupId) => {
				switch (groupId) {
					case 'groupA':
						return [
							{
								id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
								displayName: 'test 1',
								givenName: 'test',
								surname: '1',
								mail: 'inspector-programming-test-1@planninginspectorate.gov.uk'
							}
						];
					case 'groupB':
						return [
							{
								id: '7a0c62e2-182a-47a8-987a-26d0faa02876',
								displayName: 'test 2',
								givenName: 'test',
								surname: '2',
								mail: 'inspector-programming-test-2@planninginspectorate.gov.uk'
							}
						];
				}
			});

			const server = await newServer(ctx);
			const res = await server.get('/');
			assert.strictEqual(res.status, 400);
			assert.strictEqual(await res.text(), 'Invalid calendar events day range configuration');
		});
		test('returns a list of events that occur in each users calendar in the given groups', async (ctx) => {
			mockService.entraConfig.groupIds.inspectorGroups = 'groupA,groupB';
			mockService.entraConfig.calendarEventsDayRange = 3;
			mock.method(mockService.apiService.entraClient, 'listAllGroupMembers', async (groupId) => {
				switch (groupId) {
					case 'groupA':
						return [
							{
								id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
								displayName: 'test 1',
								givenName: 'test',
								surname: '1',
								mail: 'inspector-programming-test-1@planninginspectorate.gov.uk'
							}
						];
					case 'groupB':
						return [
							{
								id: '7a0c62e2-182a-47a8-987a-26d0faa02876',
								displayName: 'test 2',
								givenName: 'test',
								surname: '2',
								mail: 'inspector-programming-test-2@planninginspectorate.gov.uk'
							}
						];
				}
			});

			mock.method(mockService.apiService.entraClient, 'listAllUserCalendarEvents', async (userId) => {
				switch (userId) {
					case 'd53dea42-369b-44aa-b3ca-a8537018b422':
						return [
							{
								id: 'id1',
								subject: 'Test Event 1',
								start: { dateTime: dates.twoDaysAgo.toISOString() },
								end: { dateTime: dates.oneDayAgo.toISOString() },
								isAllDay: true,
								showAs: 'oof'
							},
							{
								id: 'id2',
								subject: 'Test Event 2',
								start: { dateTime: dates.fourDaysAgo.toISOString() },
								end: { dateTime: dates.oneDayAgo.toISOString() },
								isAllDay: false,
								showAs: 'busy'
							}
						];
					case '7a0c62e2-182a-47a8-987a-26d0faa02876':
						return [
							{
								id: 'id3',
								subject: 'Test Event 3',
								start: { dateTime: dates.threeDaysAgo.toISOString() },
								end: { dateTime: dates.oneDayAgo.toISOString() },
								isAllDay: false,
								showAs: 'free'
							}
						];
				}
			});

			const server = await newServer(ctx);
			const res = await server.get('/');
			assert.strictEqual(res.status, 200);
			assert.deepStrictEqual(await res.json(), [
				{
					id: 'id1',
					userEmail: 'inspector-programming-test-1@planninginspectorate.gov.uk',
					title: 'Test Event 1',
					startDate: dates.twoDaysAgo.toISOString(),
					endDate: dates.oneDayAgo.toISOString(),
					isAllDay: true,
					isOutOfOffice: true,
					status: 'oof'
				},
				{
					id: 'id2',
					userEmail: 'inspector-programming-test-1@planninginspectorate.gov.uk',
					title: 'Test Event 2',
					startDate: dates.fourDaysAgo.toISOString(),
					endDate: dates.oneDayAgo.toISOString(),
					isAllDay: false,
					isOutOfOffice: false,
					status: 'busy'
				},
				{
					id: 'id3',
					userEmail: 'inspector-programming-test-2@planninginspectorate.gov.uk',
					title: 'Test Event 3',
					startDate: dates.threeDaysAgo.toISOString(),
					endDate: dates.oneDayAgo.toISOString(),
					isAllDay: false,
					isOutOfOffice: false,
					status: 'free'
				}
			]);
		});
	});
	test('returns events in the future if calendarEventsFromDateOffset is set', async (ctx) => {
		mockService.entraConfig.groupIds.inspectorGroups = 'groupA,groupB';
		mockService.entraConfig.calendarEventsDayRange = 3;
		mockService.entraConfig.calendarEventsFromDateOffset = 3;
		mock.method(mockService.apiService.entraClient, 'listAllGroupMembers', async (groupId) => {
			switch (groupId) {
				case 'groupA':
					return [
						{
							id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
							displayName: 'test 1',
							givenName: 'test',
							surname: '1',
							mail: 'inspector-programming-test-1@planninginspectorate.gov.uk'
						}
					];
				case 'groupB':
					return [
						{
							id: '7a0c62e2-182a-47a8-987a-26d0faa02876',
							displayName: 'test 2',
							givenName: 'test',
							surname: '2',
							mail: 'inspector-programming-test-2@planninginspectorate.gov.uk'
						}
					];
			}
		});

		mock.method(mockService.apiService.entraClient, 'listAllUserCalendarEvents', async (userId) => {
			switch (userId) {
				case 'd53dea42-369b-44aa-b3ca-a8537018b422':
					return [
						//past event
						{
							id: 'id1',
							subject: 'Test Event 1',
							start: { dateTime: dates.twoDaysAgo.toISOString() },
							end: { dateTime: dates.oneDayAgo.toISOString() },
							isAllDay: false,
							showAs: 'busy'
						},
						//future event
						{
							id: 'id2',
							subject: 'Test Event 2',
							start: { dateTime: dates.oneDayAgo.toISOString() },
							end: { dateTime: dates.twoDaysAhead.toISOString() },
							isAllDay: true,
							showAs: 'oof'
						}
					];
				case '7a0c62e2-182a-47a8-987a-26d0faa02876':
					return [
						{
							id: 'id3',
							subject: 'Test Event 3',
							start: { dateTime: dates.threeDaysAgo.toISOString() },
							end: { dateTime: dates.oneDayAgo.toISOString() },
							isAllDay: false,
							showAs: 'free'
						}
					];
			}
		});

		const server = await newServer(ctx);
		const res = await server.get('/');
		assert.strictEqual(res.status, 200);
		assert.deepStrictEqual(await res.json(), [
			{
				id: 'id1',
				userEmail: 'inspector-programming-test-1@planninginspectorate.gov.uk',
				title: 'Test Event 1',
				startDate: dates.twoDaysAgo.toISOString(),
				endDate: dates.oneDayAgo.toISOString(),
				isAllDay: false,
				isOutOfOffice: false,
				status: 'busy'
			},
			{
				id: 'id2',
				userEmail: 'inspector-programming-test-1@planninginspectorate.gov.uk',
				title: 'Test Event 2',
				startDate: dates.oneDayAgo.toISOString(),
				endDate: dates.twoDaysAhead.toISOString(),
				isAllDay: true,
				isOutOfOffice: true,
				status: 'oof'
			},
			{
				id: 'id3',
				userEmail: 'inspector-programming-test-2@planninginspectorate.gov.uk',
				title: 'Test Event 3',
				startDate: dates.threeDaysAgo.toISOString(),
				endDate: dates.oneDayAgo.toISOString(),
				isAllDay: false,
				isOutOfOffice: false,
				status: 'free'
			}
		]);
	});
});
