import { describe, test, mock } from 'node:test';
import assert from 'node:assert';
import { fetchPostcodeCoordinates } from './fetch-coordinates.js';

describe('fetchPostcodeCoordinates', () => {
	test('throws if postcode is not a non-empty string', async () => {
		const fn = mock.fn(async () => ({}));
		await assert.rejects(() => fetchPostcodeCoordinates({ addressesForPostcode: fn }, ''), {
			message: 'postcode must be a non-empty string'
		});

		await assert.rejects(() => fetchPostcodeCoordinates({ addressesForPostcode: fn }, null), {
			message: 'postcode must be a non-empty string'
		});
		assert.strictEqual(fn.mock.callCount(), 0, 'client should not be called for invalid postcode input');
	});

	test('returns coordinates from DPA record', async () => {
		const fn = mock.fn(async () => ({
			results: [
				{
					DPA: { LAT: 51.5007, LNG: -0.1246 }
				}
			]
		}));
		const coords = await fetchPostcodeCoordinates({ addressesForPostcode: fn }, 'SW1A 2AA');
		assert.deepStrictEqual(coords, { latitude: 51.5007, longitude: -0.1246 });
		assert.strictEqual(fn.mock.callCount(), 1);
		assert.deepStrictEqual(fn.mock.calls[0].arguments, ['SW1A 2AA']);
	});

	test('returns coordinates from LPI record when no DPA', async () => {
		const fn = mock.fn(async () => ({
			results: [
				{
					LPI: { LAT: 53.483, LNG: -2.244 }
				}
			]
		}));
		const coords = await fetchPostcodeCoordinates({ addressesForPostcode: fn }, 'M1 1AE');
		assert.deepStrictEqual(coords, { latitude: 53.483, longitude: -2.244 });
		assert.strictEqual(fn.mock.callCount(), 1);
	});

	test('prefers DPA over LPI if both present', async () => {
		const fn = mock.fn(async () => ({
			results: [
				{
					DPA: { LAT: 10, LNG: 20 },
					LPI: { LAT: 30, LNG: 40 }
				}
			]
		}));
		const coords = await fetchPostcodeCoordinates({ addressesForPostcode: fn }, 'CODE 1');
		assert.deepStrictEqual(coords, { latitude: 10, longitude: 20 });
		assert.strictEqual(fn.mock.callCount(), 1);
	});

	test('throws if no results', async () => {
		const fn = mock.fn(async () => ({ results: [] }));
		await assert.rejects(() => fetchPostcodeCoordinates({ addressesForPostcode: fn }, 'AB12 3CD'), {
			message: 'Could not extract coordinates for postcode: AB12 3CD'
		});
		assert.strictEqual(fn.mock.callCount(), 1);
	});

	test('throws if LAT/LNG are missing (undefined)', async () => {
		const fn = mock.fn(async () => ({
			results: [
				{
					DPA: { LAT: undefined, LNG: undefined }
				}
			]
		}));
		await assert.rejects(() => fetchPostcodeCoordinates({ addressesForPostcode: fn }, 'AB12 3CD'), {
			message: 'Could not extract coordinates for postcode: AB12 3CD'
		});
		assert.strictEqual(fn.mock.callCount(), 1);
	});

	test('wraps underlying client errors with helpful message', async () => {
		const fn = mock.fn(async () => {
			throw new Error('network down');
		});
		await assert.rejects(() => fetchPostcodeCoordinates({ addressesForPostcode: fn }, 'AB12 3CD'), {
			message: 'Failed to fetch coordinates for postcode AB12 3CD: network down'
		});
		assert.strictEqual(fn.mock.callCount(), 1);
	});
});
