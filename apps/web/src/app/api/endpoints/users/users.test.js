import { test, beforeEach, describe, mock } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { createRoutes } from './controller.js';
import { WebService } from '#service';

/** @type {WebService}} */
let mockService;
/** @type {import('express').Express} */
let app;

beforeEach(() => {
	//set up service
	mockService = new WebService({
		logLevel: 'info',
		auth: {
			disabled: true
		},
		database: {
			datasourceUrl: 'lalala'
		},
		session: {
			redisPrefix: 'manage:',
			redis: undefined,
			secret: 'testSecret'
		},
		entra: {
			groupIds: {
				inspectorGroups: 'groupA,groupB,groupC'
			}
		}
	});

	app = express();
	app.use('/', createRoutes(mockService));
});

describe('users', () => {
	describe('GET /users', () => {
		test('returns 404 if no groupIds are configured', async () => {
			mockService.entraConfig.groupIds.inspectorGroups = '';

			const res = await request(app).get('/');
			assert.strictEqual(res.statusCode, 404);
			assert.strictEqual(res.text, 'No Entra groups configured');
		});

		test('returns 400 if inspectorGroups is malformed', async () => {
			mockService.entraConfig.groupIds.inspectorGroups = 'groupA,groupB,';

			const res = await request(app).get('/');
			assert.strictEqual(res.statusCode, 400);
			assert.strictEqual(res.text, 'Invalid Entra group configuration');
		});

		test('returns users from all groups', async () => {
			mockService.entraConfig.groupIds.inspectorGroups = 'groupA,groupB,groupC';

			//mock the Entra client to return expected results for each group
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

			const res = await request(app).get('/').set('Authorization', 'Bearer fake-token');

			assert.strictEqual(res.statusCode, 200);
			assert.deepStrictEqual(res.body, [
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

		test('returns 500 if results cannot be retrieved for all groups (e.g. invalid groupId)', async () => {
			mockService.entraConfig.groupIds.inspectorGroups = 'groupA,another-wrong-group-id';

			mock.method(mockService.apiService.entraClient, 'listAllGroupMembers', async (groupId) => {
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

			const res = await request(app).get('/');
			assert.strictEqual(res.statusCode, 500);
			assert.strictEqual(res.text, 'A server error occurred');
		});
	});
});
