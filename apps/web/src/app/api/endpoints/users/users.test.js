import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { createRoutes } from './controller.js';
import { loadConfig } from '#config';
import { WebService } from '#service';

// Manual mocking since node:test doesn't auto-mock like Jest
/** @type {WebService}} */
let mockService;
/** @type {import('express').Express} */
let app;

beforeEach(() => {
	const config = loadConfig();
	mockService = new WebService(config);

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
			mockService.entraConfig.groupIds = mockService.entraConfig.testGroupIds;

			const res = await request(app).get('/');
			console.info(res.text);
			assert.strictEqual(res.statusCode, 200);

			//ensure a user from all three groups enumerated is retrieved
			const userA = res.body.find(
				(u) => u.id === 'baf4bc6f-fe93-406c-a1ff-93b562739f11' && u.groupId === 'de84d4ca-279b-4e43-bab0-6417bfb4e06a'
			);
			assert.ok(userA);
			assert.strictEqual(userA.displayName, 'inspector-programming-test-1');

			const userB = res.body.find(
				(u) => u.id === 'd53dea42-369b-44aa-b3ca-a8537018b422' && u.groupId === 'bb3853ea-2e2d-49e0-8b9a-449a31e27bb4'
			);
			assert.ok(userB);
			assert.strictEqual(userB.displayName, 'inspector-programming-test-2');

			const userC = res.body.find(
				(u) => u.id === 'b62bce27-eb35-40e5-9164-1ad47786abcb' && u.groupId === '6f59e9c5-dd46-4bd4-ab92-f576dcc29b48'
			);
			assert.ok(userC);
			assert.strictEqual(userC.displayName, 'inspector-programming-test-4');
		});

		test('returns 500 if results cannot be retrieved for all groups (e.g. invalid groupId', async () => {
			mockService.entraConfig.groupIds = ['wrong-group-id', 'another-wrong-group-id'];

			const res = await request(app).get('/');
			assert.strictEqual(res.statusCode, 500);
			assert.strictEqual(res.text, 'A server error occurred');
		});
	});
});
