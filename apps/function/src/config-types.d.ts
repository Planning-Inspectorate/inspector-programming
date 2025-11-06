import { DatabaseConfig } from '@pins/inspector-programming-lib/app/config-types';

interface Config {
	cbos: {
		apiUrl: string;
		timeoutMs: number;
		appealTypesCachettl: number;
		fetchCasesSchedule: string;
	};
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
	};
}
