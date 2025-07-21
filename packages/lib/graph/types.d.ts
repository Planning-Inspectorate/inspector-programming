import { CachedEntraClient } from './cached-entra-client';

export interface GroupMember {
	id: string;
	givenName: string;
	surname: string;
	mail: string;
}

interface AuthSession {
	account?: {
		accessToken?: string;
	};
}

export type InitEntraClient = (session: AuthSession) => CachedEntraClient | null;
