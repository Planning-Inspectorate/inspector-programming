import { CachedEntraClient } from './cached-entra-client';

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
	isCancelled?: boolean;
	singleValueExtendedProperties?: singleValueExtendedProperty[];
	location: Location;
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
