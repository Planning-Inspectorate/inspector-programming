// packages/database/src/seed/lpa-regions.js
export const LPA_REGION_NAMES = Object.freeze({
	NORTH: 'North',
	EAST: 'East',
	WEST: 'West'
});

// Use stable GUIDs (generate once and commit)
export const LPA_REGION_IDS = Object.freeze({
	NORTH_1: 'e66f1b92-9806-4e47-9917-554cb74b4871',
	NORTH_2: 'd1e4efa0-27b4-4434-a7fa-4fcbe67435de',
	NORTH_3: '902ccebd-5a19-4399-b25c-b5cd092f2f81',
	NORTH_4: '0d6f1a0a-87d2-4a48-8d9a-2b2d0b8b9d11',

	EAST_1: '1a9f4b3b-6c7a-4a79-9da3-9b9b68ecb1a1',
	EAST_2: '2b7e9c2a-5d8b-4f7a-8ea4-3c1d9fe2c2b2',
	EAST_3: '3c8fad1c-4e9c-4b6b-9fb5-4d2e0af3d3c3',
	EAST_4: '4d9abe0d-3fad-4c5c-afc6-5e3f1b04e4d4',

	WEST_1: '5ea1cf1e-2cbe-4d4d-b0d7-6f402c15f5e5',
	WEST_2: '6fb2de2f-1dcf-4e3e-c1e8-70413d26a6f6',
	WEST_3: '70c3ed30-0ee0-4f2f-d2f9-81524e37b707',
	WEST_4: '81d4fc41-ff01-4020-e30a-92635f48c818'
});

const REGION_CONNECTION = Object.freeze({
	NORTH: { connectOrCreate: { where: { name: LPA_REGION_NAMES.NORTH }, create: { name: LPA_REGION_NAMES.NORTH } } },
	EAST: { connectOrCreate: { where: { name: LPA_REGION_NAMES.EAST }, create: { name: LPA_REGION_NAMES.EAST } } },
	WEST: { connectOrCreate: { where: { name: LPA_REGION_NAMES.WEST }, create: { name: LPA_REGION_NAMES.WEST } } }
});

/**
 * @type {import('@pins/inspector-programming-database/src/client/client.ts').Prisma.LpaRegionCreateInput[]}
 */
export const LPA_REGIONS = Object.freeze([
	{ id: LPA_REGION_IDS.NORTH_1, LpaRegionName: REGION_CONNECTION.NORTH, number: 1 },
	{ id: LPA_REGION_IDS.NORTH_2, LpaRegionName: REGION_CONNECTION.NORTH, number: 2 },
	{ id: LPA_REGION_IDS.NORTH_3, LpaRegionName: REGION_CONNECTION.NORTH, number: 3 },
	{ id: LPA_REGION_IDS.NORTH_4, LpaRegionName: REGION_CONNECTION.NORTH, number: 4 },
	{ id: LPA_REGION_IDS.EAST_1, LpaRegionName: REGION_CONNECTION.EAST, number: 1 },
	{ id: LPA_REGION_IDS.EAST_2, LpaRegionName: REGION_CONNECTION.EAST, number: 2 },
	{ id: LPA_REGION_IDS.EAST_3, LpaRegionName: REGION_CONNECTION.EAST, number: 3 },
	{ id: LPA_REGION_IDS.EAST_4, LpaRegionName: REGION_CONNECTION.EAST, number: 4 },
	{ id: LPA_REGION_IDS.WEST_1, LpaRegionName: REGION_CONNECTION.WEST, number: 1 },
	{ id: LPA_REGION_IDS.WEST_2, LpaRegionName: REGION_CONNECTION.WEST, number: 2 },
	{ id: LPA_REGION_IDS.WEST_3, LpaRegionName: REGION_CONNECTION.WEST, number: 3 },
	{ id: LPA_REGION_IDS.WEST_4, LpaRegionName: REGION_CONNECTION.WEST, number: 4 }
]);
