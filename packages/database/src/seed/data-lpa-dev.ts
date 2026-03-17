import { LPA_REGION_IDS } from './lpa-regions.js';

// Test LPAs from Manage appeals
export const LPAS_DEV = Object.freeze([
	{ lpaCode: 'Q9999', LpaRegion: { connect: { id: LPA_REGION_IDS.NORTH_1 } } },
	{ lpaCode: 'BASI', LpaRegion: { connect: { id: LPA_REGION_IDS.EAST_1 } } },
	{ lpaCode: 'WAVE', LpaRegion: { connect: { id: LPA_REGION_IDS.WEST_1 } } },
	{ lpaCode: 'BRIS', LpaRegion: { connect: { id: LPA_REGION_IDS.NORTH_2 } } },
	{ lpaCode: 'DORS', LpaRegion: { connect: { id: LPA_REGION_IDS.EAST_2 } } },
	{ lpaCode: 'WILT', LpaRegion: { connect: { id: LPA_REGION_IDS.WEST_2 } } },
	{ lpaCode: 'MAID', LpaRegion: { connect: { id: LPA_REGION_IDS.NORTH_3 } } },
	{ lpaCode: 'BARN', LpaRegion: { connect: { id: LPA_REGION_IDS.EAST_3 } } },
	{ lpaCode: 'WORT', LpaRegion: { connect: { id: LPA_REGION_IDS.WEST_3 } } },
	{ lpaCode: 'Q1111', LpaRegion: { connect: { id: LPA_REGION_IDS.NORTH_4 } } }
]);
