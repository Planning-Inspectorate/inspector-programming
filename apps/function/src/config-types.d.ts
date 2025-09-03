import { Prisma } from '@pins/inspector-programming-database/src/client';

interface Config {
	cbos: {
		apiUrl: string;
		timeoutMs: number;
		appealTypesCachettl: number;
		fetchCasesSchedule: string;
	};
	database: Prisma.PrismaClientOptions;
	NODE_ENV: string;
	logLevel: string;
	osApi: {
		key: string;
	};
}
