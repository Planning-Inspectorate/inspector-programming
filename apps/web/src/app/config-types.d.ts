import { BaseConfig } from '@pins/inspector-programming-lib/app/config-types';
import { NotifyConfig } from '@pins/inspector-programming-lib/emails/types';

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
	cases: {
		casesCacheTtl: number;
	};
	inspectors: {
		inspectorsCacheTtl: number;
	};
	cbos: {
		apiUrl: string;
		timeoutMs: number;
		appealTypesCachettl: number;
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
	notify: NotifyConfig;
	osApi: {
		key: string;
	};
}
