import { CachedEntraClient } from './cached-entra-client';
import { Event } from '@microsoft/microsoft-graph-types';

export interface GroupMember {
	id: string;
	displayName: string;
	givenName: string;
	surname: string;
	mail: string;
}

export interface CalendarEvents {
	value: CalendarEvent[];
}

export interface CalendarEvent {
	id: string;
	subject: string;
	start: {
		dateTime: string;
		timeZone: string;
	};
	end: {
		dateTime: string;
		timeZone: string;
	};
	isAllDay?: boolean;
	showAs?: string;
	sensitivity: string;
	singleValueExtendedProperties?: singleValueExtendedProperty[];
	location: Location;
	isCancelled?: boolean;
}

interface singleValueExtendedProperty {
	id: string;
	value: string;
}

interface Location {
	address: Address;
	displayName: string;
}

interface Address {
	city: string;
	countyOrRegion: string;
	postalCode: string;
	state: string;
	street: string;
}

interface AuthSession {
	account?: {
		accessToken?: string;
	};
}

/**
 * @see https://learn.microsoft.com/en-us/graph/api/resources/event?view=graph-rest-1.0#properties
 */
export interface CalendarEventInput {
	subject: string;
	start: {
		dateTime: string;
		timeZone: string;
	};
	end: {
		dateTime: string;
		timeZone: string;
	};
	location: {
		displayName: string;
		address: {
			street: string | null;
			postalCode: string | null;
		};
	};
	singleValueExtendedProperties?: [
		{
			id: string;
			value: string; // JSON string of caseReference, eventType
		}
	];
}

export type InitEntraClient = (session: AuthSession) => CachedEntraClient | null;
