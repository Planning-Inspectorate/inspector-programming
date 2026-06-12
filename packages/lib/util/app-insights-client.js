import { LogsQueryClient } from '@azure/monitor-query-logs';
import { DefaultAzureCredential } from '@azure/identity';

/**
 * Client for querying Application Insights using KQL
 */
export class ApplicationInsightsClient {
	/**
	 * @type {LogsQueryClient}
	 */
	#client;

	/**
	 * @type {string}
	 */
	#workspaceId;

	/**
	 * @param {string} workspaceId - Application Insights workspace ID
	 * @param {import('pino').Logger} logger
	 * @param {LogsQueryClient} [logsQueryClient] - Optional LogsQueryClient for testing
	 */
	constructor(workspaceId, logger, logsQueryClient) {
		this.#workspaceId = workspaceId;
		this.logger = logger;
		if (logsQueryClient) {
			// Use provided client (for testing)
			this.#client = logsQueryClient;
		} else {
			// Use DefaultAzureCredential which works with Managed Identity in Azure Functions
			const credential = new DefaultAzureCredential();
			this.#client = new LogsQueryClient(credential);
		}
	}

	/**
	 * Execute a KQL query against Application Insights
	 * @param {string} query - KQL query string
	 * @param {import('@azure/monitor-query-logs').QueryTimeInterval} timeSpan - KQL query time
	 * @param {import('@azure/functions').InvocationContext} [context] - Azure Function context for logging
	 * @returns {Promise<any[]>} - Query results as array of objects
	 */
	async queryLogs(query, timeSpan, context) {
		try {
			const response = await this.#client.queryWorkspace(this.#workspaceId, query, timeSpan);

			if (response.status === 'Partial') {
				this.logger.warn('Application Insights query returned partial results');
				if (context) {
					context.log('Warning: Application Insights query returned partial results');
				}
			}

			if (response.status === 'Failed') {
				throw new Error(`KQL query failed: ${response.error?.message || 'Unknown error'}`);
			}

			// Extract the actual data from the response
			if (!response.tables || response.tables.length === 0) {
				return [];
			}

			const table = response.tables[0];
			const columns = table.columnDescriptors;
			const rows = table.rows;

			// Convert rows array format to object format
			return rows.map((row) => {
				const rowObject = {};
				columns.forEach((column, index) => {
					rowObject[column.name] = row[index];
				});
				return rowObject;
			});
		} catch (error) {
			this.logger.error({ error, query }, 'Failed to query Application Insights');
			throw error;
		}
	}
}
