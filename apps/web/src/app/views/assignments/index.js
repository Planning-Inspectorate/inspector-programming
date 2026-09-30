import { Router as createRouter } from 'express';
import { asyncHandler } from '@planning-inspectorate/core';
import { buildPostAssignAssignment, buildPostRemoveAssignment, buildViewAssignments } from './controller.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter({ mergeParams: true });

	router.get('/', asyncHandler(buildViewAssignments(service)));
	router.post('/assign', asyncHandler(buildPostAssignAssignment(service)));
	router.post('/remove', asyncHandler(buildPostRemoveAssignment(service)));

	return router;
}
