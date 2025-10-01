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
	extensions?: CalendarEventExtension[];
	location: Location;
}

interface CalendarEventExtension {
	extensionName: string;
	id: string;
	caseReference?: string;
	eventType?: string;
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

export type InitEntraClient = (session: AuthSession) => CachedEntraClient | null;
