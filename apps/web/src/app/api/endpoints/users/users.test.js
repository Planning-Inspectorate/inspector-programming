import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import nock from 'nock';
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
		database: {
			datasourceUrl: 'lalala'
		},
		session: {
			redisPrefix: 'manage:',
			redis: undefined,
			secret: 'testSecret'
		},
		entra: {
			groupIds: ['groupA', 'groupB', 'groupC']
		}
	});

	//intercept requests to graph api
	const graphApi = nock('https://graph.microsoft.com');

	graphApi.get('/v1.0/groups/groupA/transitiveMembers').reply(200, {
		'@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#directoryObjects',
		value: [
			{
				'@odata.type': '#microsoft.graph.user',
				id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
				businessPhones: [],
				displayName: 'inspector-programming-test-1',
				givenName: null,
				jobTitle: null,
				mail: 'inspector-programming-test-1@planninginspectorate.gov.uk',
				mobilePhone: null,
				officeLocation: null,
				preferredLanguage: null,
				surname: null,
				userPrincipalName: 'inspector-programming-test-1@planninginspectorate.gov.uk'
			}
		]
	});

	graphApi.get('/v1.0/groups/groupB/transitiveMembers').reply(200, {
		'@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#directoryObjects',
		value: [
			{
				'@odata.type': '#microsoft.graph.user',
				id: '7a0c62e2-182a-47a8-987a-26d0faa02876',
				businessPhones: [],
				displayName: 'inspector-programming-test-2',
				givenName: null,
				jobTitle: null,
				mail: 'inspector-programming-test-2@planninginspectorate.gov.uk',
				mobilePhone: null,
				officeLocation: null,
				preferredLanguage: null,
				surname: null,
				userPrincipalName: 'inspector-programming-test-2@planninginspectorate.gov.uk'
			}
		]
	});

	graphApi.get('/v1.0/groups/groupC/transitiveMembers').reply(200, {
		'@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#directoryObjects',
		value: [
			{
				'@odata.type': '#microsoft.graph.user',
				id: '37b55445-d616-49e1-9050-2efe2880fff4',
				businessPhones: [],
				displayName: 'inspector-programming-test-3',
				givenName: null,
				jobTitle: null,
				mail: 'inspector-programming-test-3@planninginspectorate.gov.uk',
				mobilePhone: null,
				officeLocation: null,
				preferredLanguage: null,
				surname: null,
				userPrincipalName: 'inspector-programming-test-3@planninginspectorate.gov.uk'
			}
		]
	});

	app = express();
	app.use('/', createRoutes(mockService));
});

describe('users', () => {
	describe('GET /users', () => {
		test('returns 404 if no groupIds are configured', async () => {
			mockService.entraConfig.groupIds = [];

			const res = await request(app).get('/');
			assert.strictEqual(res.statusCode, 404);
			assert.strictEqual(res.text, 'No Entra groups configured');
		});

		test('returns users from all groups', async () => {
			mockService.entraConfig.groupIds = ['groupA', 'groupB', 'groupC'];

			const res = await request(app).get('/').set('Authorization', 'Bearer fake-token');

			assert.strictEqual(res.statusCode, 200);
			assert.deepStrictEqual(res.body, [
				{
					id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
					displayName: 'inspector-programming-test-1',
					email: 'inspector-programming-test-1@planninginspectorate.gov.uk',
					groupId: 'groupA'
				},
				{
					id: '7a0c62e2-182a-47a8-987a-26d0faa02876',
					displayName: 'inspector-programming-test-2',
					email: 'inspector-programming-test-2@planninginspectorate.gov.uk',
					groupId: 'groupB'
				},
				{
					id: '37b55445-d616-49e1-9050-2efe2880fff4',
					displayName: 'inspector-programming-test-3',
					email: 'inspector-programming-test-3@planninginspectorate.gov.uk',
					groupId: 'groupC'
				}
			]);
		});

		test('returns 500 if results cannot be retrieved for all groups (e.g. invalid groupId)', async () => {
			mockService.entraConfig.groupIds = ['groupA', 'another-wrong-group-id'];

			const res = await request(app).get('/');
			assert.strictEqual(res.statusCode, 500);
			assert.strictEqual(res.text, 'A server error occurred');
		});
	});
});
