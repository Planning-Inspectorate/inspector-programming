import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import sinon from 'sinon';
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
				powerBiGroups: ['groupA', 'groupB', 'groupC']
			}
		}
	});

	//restore any stubs
	sinon.restore();

	app = express();
	app.use('/', createRoutes(mockService));
});

describe('users', () => {
	describe('GET /users', () => {
		test('returns 404 if no groupIds are configured', async () => {
			mockService.entraConfig.groupIds.powerBiGroups = [];

			const res = await request(app).get('/');
			assert.strictEqual(res.statusCode, 404);
			assert.strictEqual(res.text, 'No Entra groups configured');
		});

		test('returns users from all groups', async () => {
			mockService.entraConfig.groupIds.powerBiGroups = ['groupA', 'groupB', 'groupC'];

			//stub function replaces any real calls to graph api
			const stub = sinon.stub(mockService.apiService.entraClient, 'listAllGroupMembers');
			stub.withArgs('groupA').resolves([
				{
					id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
					givenName: 'test',
					surname: '1',
					mail: 'inspector-programming-test-1@planninginspectorate.gov.uk'
				}
			]);
			stub.withArgs('groupB').resolves([
				{
					id: '7a0c62e2-182a-47a8-987a-26d0faa02876',
					givenName: 'test',
					surname: '2',
					mail: 'inspector-programming-test-2@planninginspectorate.gov.uk'
				}
			]);
			stub.withArgs('groupC').resolves([
				{
					id: '37b55445-d616-49e1-9050-2efe2880fff4',
					givenName: 'test',
					surname: '3',
					mail: 'inspector-programming-test-3@planninginspectorate.gov.uk'
				}
			]);

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
			mockService.entraConfig.groupIds.powerBiGroups = ['groupA', 'another-wrong-group-id'];

			const stub = sinon.stub(mockService.apiService.entraClient, 'listAllGroupMembers');
			stub.withArgs('groupA').resolves([
				{
					id: 'd53dea42-369b-44aa-b3ca-a8537018b422',
					givenName: 'test',
					surname: '1',
					mail: 'inspector-programming-test-1@planninginspectorate.gov.uk'
				}
			]);
			stub.withArgs('another-wrong-group-id').rejects(new Error());

			const res = await request(app).get('/');
			assert.strictEqual(res.statusCode, 500);
			assert.strictEqual(res.text, 'A server error occurred');
		});
	});
});
