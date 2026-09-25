// @ts-nocheck
import assert from 'assert';
import { describe, test } from 'node:test';
import {
	LpaBoundariesClient,
	type LpaEntity,
	type LpaEntityResponse,
	wktToGeoJsonGeometry
} from './lpa-boundaries-client.ts';

describe('lpa-boundaries-client', () => {
	describe('wktToGeoJsonGeometry', () => {
		test('should parse point, polygon and multipolygon geometries', () => {
			assert.deepStrictEqual(wktToGeoJsonGeometry('POINT (-1.5 54.8)'), {
				type: 'Point',
				coordinates: [-1.5, 54.8]
			});
			assert.deepStrictEqual(wktToGeoJsonGeometry('POLYGON ((0 0, 1 0, 1 1, 0 0))'), {
				type: 'Polygon',
				coordinates: [
					[
						[0, 0],
						[1, 0],
						[1, 1],
						[0, 0]
					]
				]
			});
			assert.deepStrictEqual(wktToGeoJsonGeometry('MULTIPOLYGON (((0 0, 1 0, 1 1, 0 0)), ((2 2, 3 2, 3 3, 2 2)))'), {
				type: 'MultiPolygon',
				coordinates: [
					[
						[
							[0, 0],
							[1, 0],
							[1, 1],
							[0, 0]
						]
					],
					[
						[
							[2, 2],
							[3, 2],
							[3, 3],
							[2, 2]
						]
					]
				]
			});
		});

		test('should return null for empty and unsupported geometries', () => {
			assert.strictEqual(wktToGeoJsonGeometry(null), null);
			assert.strictEqual(wktToGeoJsonGeometry(''), null);
			assert.strictEqual(wktToGeoJsonGeometry('LINESTRING (0 0, 1 1)'), null);
		});
	});

	describe('getLpaBoundaries', () => {
		test('should fetch all pages and convert entities with geometry to features', async () => {
			const firstPageEntities = Array.from({ length: 500 }, (_, index) =>
				createEntity(index, `POINT (${index} ${index})`)
			);
			const secondPageEntity = createEntity(500, 'POLYGON ((0 0, 1 0, 1 1, 0 0))');
			const responses: LpaEntityResponse[] = [
				{ count: 501, entities: firstPageEntities },
				{ count: 501, entities: [secondPageEntity] }
			];
			const requestedUrls: string[] = [];
			const client = new LpaBoundariesClient();
			client.fetchWithTimeout = async (url) => {
				requestedUrls.push(url);
				const response = responses.shift();
				assert.ok(response);
				return new Response(JSON.stringify(response), {
					headers: { 'Content-Type': 'application/json' }
				});
			};

			const features = await client.getLpaBoundaries();

			assert.strictEqual(features.length, 501);
			assert.deepStrictEqual(features[0], {
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: {
					entity: 0,
					name: 'LPA 0',
					reference: 'LPA-0',
					dataset: 'local-planning-authority'
				}
			});
			assert.deepStrictEqual(features[500].geometry, {
				type: 'Polygon',
				coordinates: [
					[
						[0, 0],
						[1, 0],
						[1, 1],
						[0, 0]
					]
				]
			});
			assert.strictEqual(new URL(requestedUrls[0]).searchParams.get('offset'), '0');
			assert.strictEqual(new URL(requestedUrls[1]).searchParams.get('offset'), '500');
			assert.strictEqual(new URL(requestedUrls[0]).searchParams.get('limit'), '500');
		});
	});
});

function createEntity(entity: number, geometry: string): LpaEntity {
	return {
		entity,
		name: `LPA ${entity}`,
		dataset: 'local-planning-authority',
		reference: `LPA-${entity}`,
		geometry
	};
}
