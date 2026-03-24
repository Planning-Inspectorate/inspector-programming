// types used across the application

import 'express-session';

declare module 'express-session' {
	// extend SessionData to include custom values
	// using [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
	interface SessionData {
		[key: string]: any;
		// TODO: explicit types for session data
	}
}

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

export type PaginationItem = PaginationEllipsis | PaginationLink;

export type PaginationLink = {
	number: number;
	href: string;
	current: boolean;
};

export type PaginationEllipsis = {
	ellipsis: boolean;
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

export interface SuccessSummary {
	heading: string;
	body: string;
}
