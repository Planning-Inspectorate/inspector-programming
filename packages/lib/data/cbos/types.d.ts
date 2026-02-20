export interface ManageAppealsApiOptions {
	/**
	 * Base URL for the manage appeals API
	 */
	apiUrl: string;
	/**
	 * User ID to use in the header for requests
	 */
	apiHeader?: string;
	/**
	 * Request timeout in ms
	 */
	timeoutMs?: number;
	/**
	 * TTL for the cache of appeals types response, in minutes
	 */
	appealTypesCachettl?: number;
}
