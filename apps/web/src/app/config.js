import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';

/**
 * The environment names
 *
 * @type {Readonly<{PROD: string, DEV: string, TEST: string, TRAINING: string}>}
 */
export const ENVIRONMENT_NAME = Object.freeze({
	DEV: 'dev',
	TEST: 'test',
	TRAINING: 'training',
	PROD: 'prod'
});

// cache the config
/** @type {undefined|Config} */
let config;

/**
 * @returns {Config}
 */
export function loadConfig() {
	if (config) {
		return config;
	}
	// load configuration from .env file into process.env
	dotenv.config();

	// get values from the environment
	const {
		API_CALENDAR_EVENTS_DAY_RANGE,
		API_CALENDAR_EVENTS_FROM_DATE_OFFSET,
		API_INSPECTOR_ENTRA_GROUPS,
		API_MOCK_DATA,
		APP_HOSTNAME,
		AUTH_DISABLED,
		AUTH_GROUP_APPLICATION_ACCESS,
		AZURE_CLIENT_ID,
		AZURE_CLIENT_SECRET,
		AZURE_TENANT_ID,
		CACHE_CONTROL_MAX_AGE,
		CASES_CACHE_TTL,
		INSPECTORS_CACHE_TTL,
		CBOS_API_TIMEOUT,
		CBOS_API_URL,
		CBOS_APPEAL_TYPE_CACHE_TTL,
		ENTRA_GROUP_CACHE_TTL,
		ENTRA_GROUP_ID_INSPECTORS,
		ENTRA_GROUP_ID_NATIONAL_TEAM,
		ENTRA_GROUP_ID_TEAM_LEADS,
		GIT_SHA,
		GOV_NOTIFY_API_KEY,
		GOV_NOTIFY_DISABLED,
		GOV_NOTIFY_TEMPLATE_ASSIGNED_CASE,
		GOV_NOTIFY_TEMPLATE_ASSIGNED_CASE_PROGRAMME_OFFICER,
		GOV_NOTIFY_TEMPLATE_SELF_ASSIGNED_CASE,
		GOV_NOTIFY_TEMPLATE_SELF_ASSIGNED_CASE_PROGRAMME_OFFICER,
		LOG_LEVEL,
		NODE_ENV,
		OS_API_KEY,
		PORT,
		REDIS_CONNECTION_STRING,
		SESSION_SECRET,
		SQL_CONNECTION_STRING
	} = process.env;

	const buildConfig = loadBuildConfig();

	if (!SESSION_SECRET) {
		throw new Error('SESSION_SECRET is required');
	}

	if (!API_CALENDAR_EVENTS_DAY_RANGE) {
		throw new Error('API_CALENDAR_EVENTS_DAY_RANGE is required');
	}

	let httpPort = 8090;
	if (PORT) {
		// PORT is set by App Service
		const port = parseInt(PORT);
		if (isNaN(port)) {
			throw new Error('PORT must be an integer');
		}
		httpPort = port;
	}

	const isProduction = NODE_ENV === 'production';

	const authDisabled = AUTH_DISABLED === 'true' && !isProduction;
	if (!authDisabled) {
		const props = {
			AUTH_GROUP_APPLICATION_ACCESS,
			AZURE_CLIENT_ID,
			AZURE_CLIENT_SECRET,
			AZURE_TENANT_ID
		};
		for (const [k, v] of Object.entries(props)) {
			if (v === undefined || v === '') {
				throw new Error(k + ' must be a non-empty string');
			}
		}
	}

	const protocol = APP_HOSTNAME?.startsWith('localhost') ? 'http://' : 'https://';

	config = {
		api: {
			mockData: API_MOCK_DATA === 'true'
		},
		appHostname: APP_HOSTNAME,
		auth: {
			appDomain: `${protocol}${APP_HOSTNAME}`,
			authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
			clientId: AZURE_CLIENT_ID,
			clientSecret: AZURE_CLIENT_SECRET,
			discoveryKeysEndpoint: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/discovery/v2.0/keys`,
			disabled: authDisabled,
			groups: {
				applicationAccess: AUTH_GROUP_APPLICATION_ACCESS
			},
			redirectUri: `${protocol}${APP_HOSTNAME}/auth/redirect`,
			signoutUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
			tenantId: AZURE_TENANT_ID
		},
		cacheControl: {
			maxAge: CACHE_CONTROL_MAX_AGE || '1d'
		},
		cases: {
			casesCacheTtl: parseInt(CASES_CACHE_TTL || 15)
		},
		inspectors: {
			inspectorsCacheTtl: parseInt(INSPECTORS_CACHE_TTL || 15)
		},
		cbos: {
			apiUrl: CBOS_API_URL,
			timeoutMs: parseInt(CBOS_API_TIMEOUT || 10000),
			appealTypesCachettl: CBOS_APPEAL_TYPE_CACHE_TTL || 1440
		},
		database: {
			connectionString: SQL_CONNECTION_STRING
		},
		entra: {
			// in minutes
			cacheTtl: parseInt(ENTRA_GROUP_CACHE_TTL || 15),
			calendarEventsDayRange: API_CALENDAR_EVENTS_DAY_RANGE,
			calendarEventsFromDateOffset: API_CALENDAR_EVENTS_FROM_DATE_OFFSET || 0,
			groupIds: {
				inspectors: ENTRA_GROUP_ID_INSPECTORS,
				teamLeads: ENTRA_GROUP_ID_TEAM_LEADS,
				nationalTeam: ENTRA_GROUP_ID_NATIONAL_TEAM,
				inspectorGroups: API_INSPECTOR_ENTRA_GROUPS
			}
		},
		gitSha: GIT_SHA,
		// the HTTP port to listen on
		httpPort: httpPort,
		// the log level to use
		logLevel: LOG_LEVEL || 'info',
		NODE_ENV: NODE_ENV || 'development',
		notify: {
			apiKey: GOV_NOTIFY_API_KEY,
			disabled: GOV_NOTIFY_DISABLED === 'true',
			templateIds: {
				assignedCase: GOV_NOTIFY_TEMPLATE_ASSIGNED_CASE,
				assignedCaseProgrammeOfficer: GOV_NOTIFY_TEMPLATE_ASSIGNED_CASE_PROGRAMME_OFFICER,
				selfAssignedCase: GOV_NOTIFY_TEMPLATE_SELF_ASSIGNED_CASE,
				selfAssignedCaseProgrammeOfficer: GOV_NOTIFY_TEMPLATE_SELF_ASSIGNED_CASE_PROGRAMME_OFFICER
			}
		},
		osApi: {
			key: OS_API_KEY
		},
		session: {
			redisPrefix: 'manage:',
			redis: REDIS_CONNECTION_STRING,
			secret: SESSION_SECRET
		},
		// the src directory
		srcDir: buildConfig.srcDir,
		// the static directory to serve assets from (images, css, etc..)
		staticDir: buildConfig.staticDir
	};

	return config;
}

/**
 * Config required for the build script
 * @returns {{srcDir: string, staticDir: string}}
 */
export function loadBuildConfig() {
	// get the file path for the directory this file is in
	const dirname = path.dirname(fileURLToPath(import.meta.url));
	// get the file path for the src directory
	const srcDir = path.join(dirname, '..');
	// get the file path for the .static directory
	const staticDir = path.join(srcDir, '.static');

	return {
		srcDir,
		staticDir
	};
}

/**
 * Load the environment the application is running in. The value should be
 * one of the ENVIRONMENT_NAME values defined at the top of the file, and matches
 * the environment variable in the infrastructure code.
 *
 * @returns {string}
 */
export function loadEnvironmentConfig() {
	// load configuration from .env file into process.env
	dotenv.config();

	// get values from the environment
	const { ENVIRONMENT } = process.env;

	if (!ENVIRONMENT) {
		throw new Error('ENVIRONMENT is required');
	}

	if (!Object.values(ENVIRONMENT_NAME).includes(ENVIRONMENT)) {
		throw new Error(`ENVIRONMENT must be one of: ${Object.values(ENVIRONMENT_NAME)}`);
	}

	return ENVIRONMENT;
}
