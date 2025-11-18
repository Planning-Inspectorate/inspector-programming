/**
 * @param {import('../os/os-api-client.js').OsApiClient} osApiClient
 * @param {string} postcode
 * @returns {Promise<{ latitude: number|null, longitude: number|null }>}
 */
export async function fetchPostcodeCoordinates(osApiClient, postcode) {
	if (!postcode || typeof postcode !== 'string') {
		throw new Error('postcode must be a non-empty string');
	}

	let latitude = null;
	let longitude = null;
	try {
		const res = await osApiClient.addressesForPostcode(postcode);
		const data = res?.results?.[0];
		if (data) {
			if ('DPA' in data) {
				latitude = data.DPA.LAT;
				longitude = data.DPA.LNG;
			} else if ('LPI' in data) {
				latitude = data.LPI.LAT;
				longitude = data.LPI.LNG;
			}
		}
	} catch (error) {
		throw new Error(`Failed to fetch coordinates for postcode ${postcode}: ${error.message}`);
	}

	if (typeof latitude !== 'number' || typeof longitude !== 'number') {
		throw new Error(`Could not extract coordinates for postcode: ${postcode}`);
	}
	return { latitude, longitude };
}
