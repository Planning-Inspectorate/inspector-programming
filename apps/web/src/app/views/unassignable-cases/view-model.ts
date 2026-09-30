import { filtersQueryViewModel, toCaseViewModel } from '../home/view-model.js';
import {
	ASSIGNABLE_APPEAL_STATUSES,
	END_STATE_APPEAL_STATUSES,
	PRE_VALIDATION_APPEAL_STATUSES
} from '@pins/inspector-programming-lib/data/database/appeal-status.js';
import { getPageNumber, paginateList } from '@pins/inspector-programming-lib/util/pagination.ts';
import { filterCases } from '@pins/inspector-programming-lib/util/filtering.js';
import type { CaseViewModel } from '@pins/inspector-programming-lib/data/types.js';
import type { CalendarEventTimingRuleModel } from '@pins/inspector-programming-database/src/client/models/CalendarEventTimingRule.ts';
import type { PerPageLink, UnassignableCaseListViewModel, UnassignableCaseViewModel } from './types.d.ts';
import type { ParsedQs } from 'qs';
import type { RadioOption } from '#util/types.d.ts';
import { buildQueryString, paginationValues } from '../home/pagination.js';
import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';
import { LPA_REGION_NAMES } from '@pins/inspector-programming-database/src/seed/lpa-regions.js';

export function toUnassignableCaseListViewModel(
	query: ParsedQs,
	appeals: CaseViewModel[],
	timingRules: CalendarEventTimingRuleModel[]
): UnassignableCaseListViewModel {
	const pagination = {
		page: query.page ? Number(query.page) : 1,
		limit: query.limit ? Number(query.limit) : 1000,
		total: 0
	};
	const filterQuery = filtersQueryViewModel(query);
	const filteredAppeals = filterCases(appeals, filterQuery.case ?? {});

	const totalPages = Math.max(1, Math.ceil((filteredAppeals.length || 0) / pagination.limit)) || 1;
	const processedPage = getPageNumber(pagination.page, totalPages);
	const { list, total } = paginateList(filteredAppeals, processedPage, pagination.limit);
	pagination.total = total;
	return {
		pageHeading: 'Unassignable Cases',
		containerClasses: 'pins-container-wide',
		isUnassignableCasesPage: true,
		unassignableList: list.map((appeal) => toUnassignableCaseViewModel(appeal, timingRules)),
		paginationLinks: paginationValues(query, total, pagination),
		perPageLinks: perPageLinks(query, pagination.limit),
		pagination,
		filters: {
			caseStatuses: caseStatusOptions,
			lpaRegions: lpaRegionOptions,
			query: filterQuery,
			buildUrlWithoutFilter: filterQuery.buildUrlWithoutFilter,
			clearFiltersUrl: filterQuery.clearFiltersUrl
		}
	};
}

export const PER_PAGE_LIMITS = [1000, 2000];

/**
 * Build the "cases per page" links, preserving current filters and resetting to the first page
 */
export function perPageLinks(query: ParsedQs, currentLimit: number): PerPageLink[] {
	return PER_PAGE_LIMITS.map((limit) => ({
		limit,
		href: buildQueryString({ ...query, limit }, 1),
		current: limit === currentLimit
	}));
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

/**
 * LPA region filter options, matching the options offered on the unassigned case list
 */
const lpaRegionOptions: RadioOption[] = Object.values(LPA_REGION_NAMES).map((value) => ({ value, text: value }));

/**
 * Case status filter options. End state statuses are omitted, as the cases client never returns
 * cases at those statuses in the unassignable list.
 *
 * @example
 * // "lpa_questionnaire" -> { value: "lpa_questionnaire", text: "LPA questionnaire" }
 */
const caseStatusOptions: RadioOption[] = Object.values(APPEAL_CASE_STATUS)
	.filter((value) => !END_STATE_APPEAL_STATUSES.includes(value))
	.map((value) => {
		const text = value
			.replace(/_/g, ' ')
			.replace(/^\w/, (c) => c.toUpperCase())
			.replace(/^Lpa\b/, 'LPA');

		return { value, text };
	})
	.sort((a, b) => a.text.localeCompare(b.text));
