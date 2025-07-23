import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js';
import { DefaultAzureCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { MapCache } from '@pins/inspector-programming-lib/util/map-cache.js';
import { EntraClient } from '@pins/inspector-programming-lib/graph/entra.js';
import { CachedEntraClient } from '@pins/inspector-programming-lib/graph/cached-entra-client.js';

export class ApiService {
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
	}
}
