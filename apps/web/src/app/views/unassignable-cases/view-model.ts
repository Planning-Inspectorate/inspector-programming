import { toCaseViewModel } from '../home/view-model.js';
import {
	ASSIGNABLE_APPEAL_STATUSES,
	PRE_VALIDATION_APPEAL_STATUSES
} from '@pins/inspector-programming-lib/data/database/appeal-status.js';
import { getPageNumber, paginateList } from '@pins/inspector-programming-lib/util/pagination.ts';
import type { CaseViewModel } from '@pins/inspector-programming-lib/data/types.js';
import type { CalendarEventTimingRuleModel } from '@pins/inspector-programming-database/src/client/models/CalendarEventTimingRule.ts';
import type { UnassignableCaseListViewModel, UnassignableCaseViewModel } from './types.d.ts';
import type { ParsedQs } from 'qs';
import { paginationValues } from '../home/pagination.js';

export function toUnassignableCaseListViewModel(
	query: ParsedQs,
	appeals: CaseViewModel[],
	timingRules: CalendarEventTimingRuleModel[]
): UnassignableCaseListViewModel {
	const pagination = {
		page: query.page ? Number(query.page) : 1,
		limit: query.limit ? Number(query.limit) : 25,
		total: 0
	};

	const totalPages = Math.max(1, Math.ceil((appeals.length || 0) / pagination.limit)) || 1;
	const processedPage = getPageNumber(pagination.page, totalPages);
	const { list, total } = paginateList(appeals, processedPage, pagination.limit);
	pagination.total = total;
	return {
		pageHeading: 'Unassignable Cases',
		containerClasses: 'pins-container-wide',
		isUnassignableCasesPage: true,
		unassignableList: list.map((appeal) => toUnassignableCaseViewModel(appeal, timingRules)),
		paginationLinks: paginationValues(query, total, pagination),
		pagination
	};
}
export function toUnassignableCaseViewModel(
	c: CaseViewModel,
	timingRules: CalendarEventTimingRuleModel[]
): UnassignableCaseViewModel {
	const viewModel = toCaseViewModel(c);
	return {
		...viewModel,
		unassignableReason: getUnassignableReason(c, timingRules)
	};
}

export const UNASSIGNABLE_REASON = {
	UNKNOWN: 'Unknown',
	NOT_VALIDATED: 'Not validated',
	NOT_ASSIGNABLE_STATUS: 'Not an assignable status',
	MISSING_ALLOCATION: 'Missing allocation level',
	NOT_SUPPORTED: 'Not yet supported',
	NOT_SUPPORTED_CASE_TYPE: 'Case type not supported',
	NOT_SUPPORTED_PROCEDURE: 'Procedure not supported',
	NOT_SUPPORTED_ALLOCATION_LEVEL: 'Allocation level not supported'
};

export function getUnassignableReason(appeal: CaseViewModel, timingRules: CalendarEventTimingRuleModel[]): string {
	let unassignableReason = UNASSIGNABLE_REASON.UNKNOWN;
	if (!appeal.caseStatus || PRE_VALIDATION_APPEAL_STATUSES.includes(appeal.caseStatus)) {
		unassignableReason = UNASSIGNABLE_REASON.NOT_VALIDATED;
	} else if (!ASSIGNABLE_APPEAL_STATUSES.includes(appeal.caseStatus)) {
		unassignableReason = UNASSIGNABLE_REASON.NOT_ASSIGNABLE_STATUS;
	} else if (!appeal.caseLevel) {
		unassignableReason = UNASSIGNABLE_REASON.MISSING_ALLOCATION;
	} else if (!timingRules.some((rule) => matchesTimingRule(appeal, rule))) {
		unassignableReason = UNASSIGNABLE_REASON.NOT_SUPPORTED;
		const noTypeSupport = !timingRules.some((rule) => appeal.caseType === rule.caseType);
		const noProcedureSupport = !timingRules.some((rule) => matchesTypeAndProcedure(appeal, rule));
		const noLevelSupport = timingRules.some((rule) => matchesTypeAndProcedure(appeal, rule));

		if (noTypeSupport) {
			unassignableReason = UNASSIGNABLE_REASON.NOT_SUPPORTED_CASE_TYPE;
		} else if (noProcedureSupport) {
			unassignableReason = UNASSIGNABLE_REASON.NOT_SUPPORTED_PROCEDURE;
		} else if (noLevelSupport) {
			unassignableReason = UNASSIGNABLE_REASON.NOT_SUPPORTED_ALLOCATION_LEVEL;
		}
	}
	return unassignableReason;
}

function matchesTimingRule(appeal: CaseViewModel, rule: CalendarEventTimingRuleModel) {
	return (
		appeal.caseType === rule.caseType &&
		appeal.caseProcedure === rule.caseProcedure &&
		appeal.caseLevel === rule.allocationLevel
	);
}

function matchesTypeAndProcedure(appeal: CaseViewModel, rule: CalendarEventTimingRuleModel) {
	return appeal.caseType === rule.caseType && appeal.caseProcedure === rule.caseProcedure;
}
