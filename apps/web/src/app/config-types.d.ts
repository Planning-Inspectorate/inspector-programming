import { BaseConfig } from '@pins/inspector-programming-lib/app/config-types';

interface Config extends BaseConfig {
	auth: {
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
	};
	entra: {
		// group cache ttl in minutes
		cacheTtl: number;
		groupIds: {
			inspectors: string;
			teamLeads: string;
			nationalTeam: string;
		};
	};
	inspectors: [{ emailAddress: string; id: string }];
	maps: {
		key: string;
		secret: string;
	};
	entra: {
		groupIds: Array<string>;
		testGroupIds: Array<string>;
	};
}
