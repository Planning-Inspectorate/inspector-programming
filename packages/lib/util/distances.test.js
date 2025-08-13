import { describe, test } from 'node:test';
import assert from 'node:assert';
import { distanceBetween } from './distances.js';

describe('distances', () => {
	describe('distanceBetween', () => {
		test('distance between two fixed points in London and Reading should be around 59km', () => {
			const londonCoords = { lat: 51.507351, lng: -0.127758 };
			const readingCoords = { lat: 51.454266, lng: -0.97813 };
			const dist = distanceBetween(londonCoords, readingCoords);

			assert.strictEqual(typeof dist, 'number');
			assert.strictEqual(Math.floor(dist), 59);
		});
		test('null coordinates on either side should return null', () => {
			const invalidCoords = { lat: null, lng: null };
			const readingCoords = { lat: 51.454266, lng: -0.97813 };
			const [dist1, dist2] = [
				distanceBetween(invalidCoords, readingCoords),
				distanceBetween(readingCoords, invalidCoords)
			];

			assert.strictEqual(dist1, null);
			assert.strictEqual(dist2, null);
		});
		test('unexpected type coordinates on either side should return null', () => {
			const invalidCoords = { lat: 'lalala', lng: -0.978444 };
			const readingCoords = { lat: 51.454266, lng: -0.97813 };
			const [dist1, dist2] = [
				distanceBetween(invalidCoords, readingCoords),
				distanceBetween(readingCoords, invalidCoords)
			];

			assert.strictEqual(dist1, null);
			assert.strictEqual(dist2, null);
		});
	});
});
