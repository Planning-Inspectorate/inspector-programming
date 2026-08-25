import type { CaseViewModel } from '@pins/inspector-programming-lib/data/types';
import type { Pagination } from '#util/types.d.ts';

export interface UnassignableCaseListViewModel {
	pageHeading: string;
	containerClasses: string;
	isUnassignableCasesPage: boolean;
	unassignableList: UnassignableCaseViewModel[];
	paginationLinks: Pagination;
	pagination: {
		page: number;
		limit: number;
		total: number;
	};
}

export interface UnassignableCaseViewModel extends CaseViewModel {
	unassignableReason: string;
}
