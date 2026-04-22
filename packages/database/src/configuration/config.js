import { loadEnvFile } from 'node:process';

/**
 * Load configuration for seeding the database
 *
 * @returns {{db?: string, seedMockCases: boolean}}
 */
export function loadConfig() {
	// load configuration from .env file into process.env
	// prettier-ignore
	try {loadEnvFile()} catch {/* ignore errors*/}
	return {
		db: process.env.SQL_CONNECTION_STRING,
		seedMockCases: process.env.SEED_MOCK_CASES === 'true'
	};
}
