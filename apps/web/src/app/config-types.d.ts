import { BaseConfig } from '@pins/inspector-programming-lib/app/config-types';

interface Config extends BaseConfig {
	auth: {
		authority: string;
		clientId: string;
		clientSecret: string;
		disabled: boolean;
		groups: {
			// group ID for accessing the application
			applicationAccess: string;
		};
		redirectUri: string;
		signoutUrl: string;
	};
	inspectors: [{ emailAddress: string; id: string }];
	maps: {
		key: string;
		secret: string;
	};
}
