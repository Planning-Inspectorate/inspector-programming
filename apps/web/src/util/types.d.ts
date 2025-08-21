// types used across the application

/**
 * Core page view model
 */
export interface PageViewModel {
	pageHeading: string;
	containerClasses?: string;
	title: string;
}

/**
 * Pagination values for the govukPagination component
 */
export interface Pagination {
	previous: LinkValue | null;
	next: LinkValue | null;
	items: PaginationItem[];
}

export type PaginationItem =
	| { ellipsis: boolean }
	| {
			number: number;
			href: string;
			current: boolean;
	  };

export interface ErrorSummary {
	href: string;
	text: string;
}

export interface LinkValue {
	href: string;
}

export interface RadioOption {
	text: string;
	value: string;
}

export interface TextValue {
	text: string;
}
