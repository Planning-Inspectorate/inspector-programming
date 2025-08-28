import { Prisma } from '@pins/inspector-programming-database/src/client';

interface Config {
	cbos: {
		apiUrl: string;
		fetchCasesSchedule: string;
	};
	database: Prisma.PrismaClientOptions;
	NODE_ENV: string;
}
