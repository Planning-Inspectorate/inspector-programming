const BASE_URL = 'https://api.os.uk';

export class OsApiClient {
	/** @type {string} */
	#apikey;
	/** @type {string} */
	#baseUrl;
	/** @type {number} */
	#timeout;

	/**
	 * @param {string} apikey
	 * @param {Object} [options]
	 * @param {string} [options.baseUrl] - base URL for the OS API
	 * @param {number} [options.timeout] - Timeout in milliseconds for API requests
	 */
	constructor(apikey, { timeout = 5000, baseUrl = BASE_URL } = {}) {
		this.#apikey = apikey;
		this.#baseUrl = baseUrl;
		this.#timeout = timeout;
	}

	/**
	 * @param {string} postcode
	 * @returns {Promise<import('./os-types.js').OsPlaces.Response>}
	 */
	async addressesForPostcode(postcode) {
		if (!postcode || typeof postcode !== 'string') {
			throw new Error('postcode must be a non-empty string');
		}
		return this.#fetch('/search/places/v1/postcode', {
			postcode,
			// TODO: check which parameters are actually required
			maxresults: 10,
			output_srs: 'WGS84' // including this returns LNG and LAT values
		});
	}

	/**
	 * @param {string} url
	 * @param {Object<string, string>} queryParams
	 * @returns {Promise<any>}
	 */
	async #fetch(url, queryParams = {}) {
		const params = new URLSearchParams(queryParams);
		params.set('key', this.#apikey);

		const fullUrl = this.#baseUrl + url + '?' + params.toString();

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.#timeout);
		try {
			const res = await fetch(fullUrl, {
				signal: controller.signal
			});

			if (!res.ok) {
				throw new Error(`OS API request failed with status ${res.status}`);
			}

			return await res.json();
		} finally {
			clearTimeout(timeoutId);
		}
	}
}
