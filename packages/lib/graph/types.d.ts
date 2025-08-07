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
}

interface AuthSession {
	account?: {
		accessToken?: string;
	};
}

export type InitEntraClient = (session: AuthSession) => CachedEntraClient | null;
