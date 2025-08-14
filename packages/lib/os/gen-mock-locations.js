import { OsApiClient } from './os-api-client.js';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

// a range of postcodes around the UK
const partials = [
	'EX1',
	'G13',
	'E18',
	'BS12',
	'TQ3',
	'BH15',
	'HA9',
	'B60',
	'SY10',
	'FY8',
	'M6',
	'HU7',
	'SR6',
	'BB18',
	'HD8',
	'CV37',
	'NN11',
	'CB1',
	'NR10',
	'CF38',
	'NP16',
	'AB10',
	'ML11',
	'BT9'
];

async function run() {
	const os = new OsApiClient(process.env.OS_API_KEY);

	/**
	 * @type {import('@pins/inspector-programming-database/src/client').Prisma.AppealCaseUpdateInput[]}
	 */
	const locations = [];

	// get a few addresses for each postcode
	for (const partial of partials) {
		console.log(`Fetching addresses for postcode: ${partial}`);
		const res = await os.addressesForPostcode(partial);
		for (let i = 0; i < 3; i++) {
			const location = res.results[crypto.randomInt(res.results.length)];
			const data = location.DPA || location.LPI;

			locations.push({
				siteAddressPostcode: data.POSTCODE,
				siteAddressLatitude: data.LAT,
				siteAddressLongitude: data.LNG
			});
		}
	}

	console.log('Fetched locations:', locations.length);
	await fs.writeFile('./locations.json', JSON.stringify(locations, null, 2));
}

run().catch(console.error);
