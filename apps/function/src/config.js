import dotenv from 'dotenv';

/**
 * @returns {import('./types').Config}
 */
export function loadConfig() {
	// load configuration from .env file into process.env
	dotenv.config();

	// get values from the environment
	const { CBOS_FETCH_CASES_SCHEDULE, NODE_ENV, SQL_CONNECTION_STRING } = process.env;

	if (!SQL_CONNECTION_STRING) {
		throw new Error('SQL_CONNECTION_STRING is required');
	}

	return {
		cbos: {
			fetchCasesSchedule: CBOS_FETCH_CASES_SCHEDULE || '0 0 0 * * *' // default to daily at midnight
		},
		database: {
			datasourceUrl: SQL_CONNECTION_STRING
		},
		NODE_ENV
	};
}
