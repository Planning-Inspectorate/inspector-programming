import dotenv from 'dotenv';

/**
 * @returns {import('./config-types').Config}
 */
export function loadConfig() {
	// load configuration from .env file into process.env
	dotenv.config();

	// get values from the environment
	const {
		CBOS_API_URL,
		CBOS_API_TIMEOUT,
		CBOS_APPEAL_TYPE_CACHE_TTL,
		CBOS_FETCH_CASES_SCHEDULE,
		NODE_ENV,
		SQL_CONNECTION_STRING,
		LOG_LEVEL,
		OS_API_KEY
	} = process.env;

	if (!SQL_CONNECTION_STRING) {
		throw new Error('SQL_CONNECTION_STRING is required');
	}

	return {
		cbos: {
			fetchCasesSchedule: CBOS_FETCH_CASES_SCHEDULE || '0 0 0 * * *', // default to daily at midnight
			apiUrl: CBOS_API_URL,
			timeoutMs: parseInt(CBOS_API_TIMEOUT || 10000),
			appealTypesCachettl: CBOS_APPEAL_TYPE_CACHE_TTL || 1440
		},
		database: {
			datasourceUrl: SQL_CONNECTION_STRING
		},
		logLevel: LOG_LEVEL || 'info',
		NODE_ENV: NODE_ENV || 'development',
		osApi: {
			key: OS_API_KEY
		}
	};
}
