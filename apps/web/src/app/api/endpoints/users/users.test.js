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

beforeEach(() => {
	//set up service
	mockService = {
		logger: mockLogger(),
		apiService: {
			entraClient: {
				listAllGroupMembers: mock.fn()
			}
		},
		entraConfig: {
			groupIds: {
				inspectorGroups: 'groupA,groupB,groupC'
			}
		}
	};

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

describe('users', () => {
	describe('GET /users', () => {
		test('returns 404 if no groupIds are configured', async (ctx) => {
			mockService.entraConfig.groupIds.inspectorGroups = '';

			const server = await newServer(ctx);
			const res = await server.get('/');
			assert.strictEqual(res.status, 404);
			assert.strictEqual(await res.text(), 'No Entra groups configured');
		});

		test('returns 400 if inspectorGroups is malformed', async (ctx) => {
			mockService.entraConfig.groupIds.inspectorGroups = 'groupA,groupB,';

			const server = await newServer(ctx);
			const res = await server.get('/');
			assert.strictEqual(res.status, 400);
			assert.strictEqual(await res.text(), 'Invalid Entra group configuration');
		});

		test('returns users from all groups', async (ctx) => {
			mockService.entraConfig.groupIds.inspectorGroups = 'groupA,groupB,groupC';

			//mock the Entra client to return expected results for each group
			mockService.apiService.entraClient.listAllGroupMembers.mock.mockImplementation(async (groupId) => {
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
					case 'groupC':
						return [
							{
								id: '37b55445-d616-49e1-9050-2efe2880fff4',
								displayName: 'test 3',
								givenName: 'test',
								surname: '3',
								mail: 'inspector-programming-test-3@planninginspectorate.gov.uk'
							}
						];
					default:
						throw new Error(`Unexpected groupId: ${groupId}`);
				}
			});
			const server = await newServer(ctx);
			const res = await server.get('/');
			// .set('Authorization', 'Bearer fake-token')

			assert.strictEqual(res.status, 200);
			assert.deepStrictEqual(await res.json(), [
				{
					id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
					displayName: 'test 1',
					email: 'inspector-programming-test-1@planninginspectorate.gov.uk',
					groupId: 'groupA'
				},
				{
					id: '7a0c62e2-182a-47a8-987a-26d0faa02876',
					displayName: 'test 2',
					email: 'inspector-programming-test-2@planninginspectorate.gov.uk',
					groupId: 'groupB'
				},
				{
					id: '37b55445-d616-49e1-9050-2efe2880fff4',
					displayName: 'test 3',
					email: 'inspector-programming-test-3@planninginspectorate.gov.uk',
					groupId: 'groupC'
				}
			]);
		});

		test('returns 500 if results cannot be retrieved for all groups (e.g. invalid groupId)', async (ctx) => {
			mockService.entraConfig.groupIds.inspectorGroups = 'groupA,another-wrong-group-id';

			mockService.apiService.entraClient.listAllGroupMembers.mock.mockImplementation(async (groupId) => {
				if (groupId === 'groupA') {
					return {
						id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
						givenName: 'test',
						surname: '1',
						mail: 'inspector-programming-test-1@planninginspectorate.gov.uk'
					};
				}
				return new Error();
			});

			const server = await newServer(ctx);
			const res = await server.get('/');
			assert.strictEqual(res.status, 500);
			assert.strictEqual(await res.text(), 'A server error occurred');
		});
	});
});
