/**
 * Load configuration for seeding the database
 *
 * @returns {{db?: string}}
 */
export function loadConfig() {
	return {
		db: process.env.QL_CONNECTION_STRING
	};
}
