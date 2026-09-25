import type { BaseConfig } from '@planning-inspectorate/core/app';
import type { NotifyConfig } from '@pins/inspector-programming-lib/emails/types';
import type { ManageAppealsApiOptions } from '@pins/inspector-programming-lib/data/cbos/types';

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
		tokenScopes?: string[];
	};
	cases: {
		casesCacheTtl: number;
	};
	feedbackUrl: string;
	inspectors: {
		inspectorsCacheTtl: number;
	};
	cbos: ManageAppealsApiOptions;
	lpaBoundaries: {
		cacheTtl: number;
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
