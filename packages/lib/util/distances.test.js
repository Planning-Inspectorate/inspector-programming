import { describe, test } from 'node:test';
import assert from 'assert';
import { Decimal } from '@prisma/client/runtime/library.js';
import { distanceBetween } from './distances.js';

describe('distances.js', () => {
	describe('distanceBetween', () => {
		test('should calculate distance between London and Paris correctly', () => {
			const london = { lat: 51.5074, lng: -0.1278 };
			const paris = { lat: 48.8566, lng: 2.3522 };
			const distance = distanceBetween(london, paris);
			// Distance should be approximately 343 km
			assert.ok(distance !== null);
			assert.strictEqual(Math.floor(distance), 343);
		});
		test('any null coordinates should return null distance', () => {
			const pointA = { lat: null, lng: -0.1278 };
			const pointB = { lat: 48.8566, lng: 2.3522 };
			const distance = distanceBetween(pointA, pointB);
			assert.strictEqual(distance, null);
		});
		test('should handle Decimal values correctly', () => {
			const london = { lat: new Decimal(51.5074), lng: new Decimal(-0.1278) };
			const paris = { lat: new Decimal(48.8566), lng: new Decimal(2.3522) };
			const distance = distanceBetween(london, paris);
			// Distance should be approximately 343 km
			assert.ok(distance !== null);
			assert.strictEqual(Math.floor(distance), 343);
		});
	});
});
