import { loadEnvFile } from 'node:process';

/**
 * @returns {import('./config-types').Config}
 */
export function loadConfig() {
	// load configuration from .env file into process.env

	// prettier-ignore
	try {loadEnvFile()} catch {/* ignore errors*/}

	// get values from the environment
	const {
		CBOS_API_URL,
		CBOS_API_TIMEOUT,
		CBOS_APPEAL_TYPE_CACHE_TTL,
		NODE_ENV,
		SQL_CONNECTION_STRING,
		LOG_LEVEL,
		OS_API_KEY,
		SERVICE_BUS_INSPECTOR_TOPIC,
		SERVICE_BUS_INSPECTOR_SUBSCRIPTION,
		SERVICE_BUS_CASE_HAS_TOPIC,
		SERVICE_BUS_CASE_HAS_SUBSCRIPTION,
		SERVICE_BUS_CASE_S78_TOPIC,
		SERVICE_BUS_CASE_S78_SUBSCRIPTION,
		SERVICE_BUS_APPEAL_EVENT_TOPIC,
		SERVICE_BUS_APPEAL_EVENT_SUBSCRIPTION,
		SYNC_CASES_TRANSACTION_WAIT_TIME_MS,
		SYNC_CASES_TRANSACTION_TIMEOUT_MS,
		APPINSIGHTS_WORKSPACE_ID,
		GOV_NOTIFY_API_KEY,
		GOV_NOTIFY_WEEKLY_REPORT_TEMPLATE_ID,
		WEEKLY_REPORT_EMAIL_ADDRESS
	} = process.env;

	if (!SQL_CONNECTION_STRING) {
		throw new Error('SQL_CONNECTION_STRING is required');
	}

	return {
		cbos: {
			apiUrl: CBOS_API_URL,
			timeoutMs: CBOS_API_TIMEOUT && parseInt(CBOS_API_TIMEOUT),
			appealTypesCachettl: CBOS_APPEAL_TYPE_CACHE_TTL
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
			},
			appealEvent: {
				topic: SERVICE_BUS_APPEAL_EVENT_TOPIC || 'appeal-event',
				subscription: SERVICE_BUS_APPEAL_EVENT_SUBSCRIPTION || 'appeal-event-subscription-placeholder'
			}
		},
		syncCases: {
			transactionWaitTime: parseInt(SYNC_CASES_TRANSACTION_WAIT_TIME_MS || 30000), // default to 30s
			transactionTimeout: parseInt(SYNC_CASES_TRANSACTION_TIMEOUT_MS || 60000) // default to 60s
		},
		weeklyReport: {
			appInsightsWorkspaceId: APPINSIGHTS_WORKSPACE_ID,
			notifyApiKey: GOV_NOTIFY_API_KEY,
			notifyTemplateId: GOV_NOTIFY_WEEKLY_REPORT_TEMPLATE_ID,
			emailAddress: WEEKLY_REPORT_EMAIL_ADDRESS
		}
	};
}
