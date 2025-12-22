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
		OS_API_KEY,
		SERVICE_BUS_INSPECTOR_TOPIC,
		SERVICE_BUS_INSPECTOR_SUBSCRIPTION,
		SERVICE_BUS_CASE_HAS_TOPIC,
		SERVICE_BUS_CASE_HAS_SUBSCRIPTION,
		SERVICE_BUS_CASE_S78_TOPIC,
		SERVICE_BUS_CASE_S78_SUBSCRIPTION
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
			connectionString: SQL_CONNECTION_STRING
		},
		logLevel: LOG_LEVEL || 'info',
		NODE_ENV: NODE_ENV || 'development',
		osApi: {
			key: OS_API_KEY
		},
		serviceBus: {
			inspector: {
				topic: SERVICE_BUS_INSPECTOR_TOPIC || 'pins-inspector-topic-placeholder',
				subscription: SERVICE_BUS_INSPECTOR_SUBSCRIPTION || 'pins-inspector-subscription-placeholder'
			},
			caseHas: {
				topic: SERVICE_BUS_CASE_HAS_TOPIC || 'appeal-has',
				subscription: SERVICE_BUS_CASE_HAS_SUBSCRIPTION || 'appeal-has-subscription-placeholder'
			},
			caseS78: {
				topic: SERVICE_BUS_CASE_S78_TOPIC || 'appeal-s78',
				subscription: SERVICE_BUS_CASE_S78_SUBSCRIPTION || 'appeal-s78-subscription-placeholder'
			}
		}
	};
}
