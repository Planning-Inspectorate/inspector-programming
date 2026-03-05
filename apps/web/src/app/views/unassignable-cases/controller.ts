import { toUnassignableCaseListViewModel } from './view-model.ts';
import type { WebService } from '#service';
import type { Handler } from 'express';

export function buildViewUnassignableCases(service: WebService): Handler {
	return async (req, res) => {
		const appeals = await service.casesClient.getUnassignedCases();
		const timingRules = await service.dbClient.calendarEventTimingRule.findMany();

		const viewModel = toUnassignableCaseListViewModel(req.query, appeals, timingRules);
		res.render('views/unassignable-cases/view.njk', viewModel);
	};
}
