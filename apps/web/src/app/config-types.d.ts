import { BaseConfig } from '@pins/inspector-programming-lib/app/config-types';

interface Config extends BaseConfig {
	auth: {
		appDomain: string;
		authority: string;
		clientId: string;
		clientSecret: string;
		discoveryKeysEndpoint: string;
		disabled: boolean;
		groups: {
			// group ID for accessing the application
			applicationAccess: string;
		};
		redirectUri: string;
		signoutUrl: string;
		tenantId: string;
	};
	entra: {
		// group cache ttl in minutes
		cacheTtl: number;
		groupIds: {
			inspectors: string;
			teamLeads: string;
			nationalTeam: string;
			powerBiGroups: string;
		};
	};
	inspectors: [{ emailAddress: string; id: string }];
	maps: {
		key: string;
		secret: string;
	};
}
