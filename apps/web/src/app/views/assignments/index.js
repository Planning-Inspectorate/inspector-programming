import { Router as createRouter } from 'express';
import { asyncHandler } from '@planning-inspectorate/core';
import { canManageAssignments } from '#util/account.js';
import { buildPostAssignAssignment, buildPostRemoveAssignment, buildViewAssignments } from './controller.js';

/**
 * @param {import('#service').WebService} service
 * @returns {import('express').Router}
 */
export function createRoutes(service) {
	const router = createRouter({ mergeParams: true });

	router.use(assignmentsAccessGuard(service));
	router.get('/', asyncHandler(buildViewAssignments(service)));
	router.post('/assign', asyncHandler(buildPostAssignAssignment(service)));
	router.post('/remove', asyncHandler(buildPostRemoveAssignment(service)));

	return router;
}

/**
 * Only team leads and national team members can access the assignments pages.
 *
 * @param {import('#service').WebService} service
 * @returns {import('express').Handler}
 */
export function assignmentsAccessGuard(service) {
	return (req, res, next) => {
		if (!canManageAssignments(req.session, service.entraGroupIds)) {
			service.logger.warn({ path: req.originalUrl }, 'User not permitted to access assignments');
			return res.status(403).render('views/errors/403.njk');
		}
		next();
	};
}
