import { DatabaseConfig } from '@pins/inspector-programming-lib/app/config-types';
import { ManageAppealsApiOptions } from '@pins/inspector-programming-lib/data/cbos/types';

interface Config {
	cbos: ManageAppealsApiOptions;
	database: DatabaseConfig;
	NODE_ENV: string;
	logLevel: string;
	osApi: {
		key: string;
	};
	serviceBus: {
		inspector: {
			topic: string;
			subscription: string;
		};
		caseHas: {
			topic: string;
			subscription: string;
		};
		caseS78: {
			topic: string;
			subscription: string;
		};
	};
}
