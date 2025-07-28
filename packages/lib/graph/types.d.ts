import { CachedEntraClient } from './cached-entra-client';

export interface GroupMember {
	id: string;
	displayName: string;
	givenName: string;
	surname: string;
	mail: string;
}

export interface CalendarEvent {}

interface AuthSession {
	account?: {
		accessToken?: string;
	};
}

export type InitEntraClient = (session: AuthSession) => CachedEntraClient | null;
