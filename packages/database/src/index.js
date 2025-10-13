import { PrismaClient } from '@pins/inspector-programming-database/src/client/client.ts';
import { PrismaMssql } from '@prisma/adapter-mssql';

/** @typedef {{connectionString?: string}} dbConfig */

/**
 * @param {{database: dbConfig, NODE_ENV: string}} config
 * @param {import('pino').Logger} logger
 * @returns {import('@pins/inspector-programming-database/src/client/client.js').PrismaClient}
 */
export function initDatabaseClient(config, logger) {
	let prismaLogger;

	if (config.NODE_ENV !== 'production') {
		prismaLogger = logger;
	}

	if (!config.database.connectionString) {
		throw new Error('database connectionString is required');
	}

	return newDatabaseClient(config.database.connectionString, prismaLogger);
}
/**
 * @param {string} connectionString
 * @param {import('pino').Logger} [logger]
 * @returns {import('@pins/inspector-programming-database/src/client/client.js').PrismaClient}
 */
export function newDatabaseClient(connectionString, logger) {
	const adapter = new PrismaMssql(connectionString);
	const prisma = new PrismaClient({
		adapter,
		log: [
			{
				emit: 'event',
				level: 'query'
			},
			{
				emit: 'event',
				level: 'error'
			},
			{
				emit: 'event',
				level: 'info'
			},
			{
				emit: 'event',
				level: 'warn'
			}
		]
	});

	if (logger) {
		/** @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.QueryEvent} e */
		const logQuery = (e) => {
			logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'query');
		};

		/** @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.LogEvent} e */
		const logError = (e) => logger.error({ e }, 'Prisma error');

		/** @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.LogEvent} e */
		const logInfo = (e) => logger.debug({ e });

		/** @param {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.LogEvent} e */
		const logWarn = (e) => logger.warn({ e });

		prisma.$on('query', logQuery);
		prisma.$on('error', logError);
		prisma.$on('info', logInfo);
		prisma.$on('warn', logWarn);
	}

	return prisma;
}
