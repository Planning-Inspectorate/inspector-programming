import { BaseConfig } from '@pins/inspector-programming-lib/app/config-types';

interface Config extends BaseConfig {
	api: {
		mockData: boolean;
	};
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
		calendarEventsDayRange: number;
		calendarEventsFromDateOffset: number;
		groupIds: {
			inspectors: string;
			teamLeads: string;
			nationalTeam: string;
			inspectorGroups: string;
		};
	};
	inspectors: [{ emailAddress: string; id: string }];
	osApi: {
		key: string;
	};
}
