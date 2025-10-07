import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js';
import { DefaultAzureCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { MapCache } from '@pins/inspector-programming-lib/util/map-cache.js';
import { EntraClient } from '@pins/inspector-programming-lib/graph/entra.js';
import { CachedEntraClient } from '@pins/inspector-programming-lib/graph/cached-entra-client.js';

export class ApiService {
	#isFetchingEvents = false;
	/** @type {Promise<import('./types').CalendarEvent[]>|null} */
	#fetchingEventsPromise = null;
	#logger;

	/**
	 * @param {import('../service.js').WebService} service
	 */
	constructor(service) {
		this.service = service;
		const client = Client.initWithMiddleware({
			authProvider: new TokenCredentialAuthenticationProvider(new DefaultAzureCredential(), {
				scopes: ['https://graph.microsoft.com/.default']
			})
		});

		//make a new cache
		const apiCache = new MapCache(service.entraConfig.cacheTtl);

		const entraClient = new EntraClient(client);
		this.entraClient = new CachedEntraClient(entraClient, apiCache);

		this.#logger = service.logger.child({
			isApi: true
		});
	}

	get logger() {
		return this.#logger;
	}

	/**
	 * Is the system fetching events from user calendars?
	 * @returns {boolean}
	 */
	get isFetchingEvents() {
		return this.#isFetchingEvents;
	}

	set isFetchingEvents(isFetchingEvents) {
		this.#isFetchingEvents = isFetchingEvents;
		if (!isFetchingEvents) {
			this.#fetchingEventsPromise = null;
		}
	}

	/**
	 * If the system is fetching events, this is the promise which will resolve with the events
	 * @returns {Promise<import('./types').CalendarEvent[]>|null}
	 */
	get fetchingEventsPromise() {
		return this.#fetchingEventsPromise;
	}

	set fetchingEventsPromise(fetchingEventsPromise) {
		this.#fetchingEventsPromise = fetchingEventsPromise;
	}
}
