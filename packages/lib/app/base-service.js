import { initDatabaseClient } from '@pins/inspector-programming-database/src/index.js';
import { initLogger } from '../util/logger.js';
import { initRedis } from '../redis/index.js';

/**
 * This class encapsulates all the services and clients for the application
 */
export class BaseService {
	/**
	 * @type {import('./config-types.js').BaseConfig}
	 * @private
	 */
	#config;
	/**
	 * @type {import('pino').Logger}
	 */
	logger;
	/**
	 * @type {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient}
	 */
	dbClient;
	/**
	 * @type {import('../redis/redis-client.js').RedisClient|null}
	 */
	redisClient;

	/**
	 * @param {import('./config-types.js').BaseConfig} config
	 */
	constructor(config) {
		this.#config = config;
		const logger = initLogger(config);
		this.logger = logger;
		this.dbClient = initDatabaseClient(config, logger);
		this.redisClient = initRedis(config.session, logger);
	}

	get cacheControl() {
		return this.#config.cacheControl;
	}

	/**
	 * Alias of dbClient
	 *
	 * @returns {import('@pins/inspector-programming-database/src/client/client.ts').PrismaClient}
	 */
	get db() {
		return this.dbClient;
	}

	get gitSha() {
		return this.#config.gitSha;
	}

	get secureSession() {
		return this.#config.NODE_ENV === 'production';
	}

	get sessionSecret() {
		return this.#config.session.secret;
	}

	get staticDir() {
		return this.#config.staticDir;
	}
}
