import type { CaseViewModel, FilterQuery } from '@pins/inspector-programming-lib/data/types.js';
import type { Pagination, RadioOption } from '#util/types.d.ts';

export interface UnassignableCaseListViewModel {
	pageHeading: string;
	containerClasses: string;
	isUnassignableCasesPage: boolean;
	unassignableList: UnassignableCaseViewModel[];
	paginationLinks: Pagination;
	perPageLinks: PerPageLink[];
	pagination: {
		page: number;
		limit: number;
		total: number;
	};
	filters: {
		caseStatuses: RadioOption[];
		lpaRegions: RadioOption[];
		query: FilterQuery;
		buildUrlWithoutFilter: (keyType: string, valueToRemove?: string) => string;
		clearFiltersUrl: string;
	};
}

export interface PerPageLink {
	limit: number;
	href: string;
	current: boolean;
}

export interface UnassignableCaseViewModel extends CaseViewModel {
	unassignableReason: string;
}
