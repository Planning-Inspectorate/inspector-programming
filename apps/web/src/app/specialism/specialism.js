import { APPEAL_CASE_TYPE } from '@planning-inspectorate/data-model';

const APPEAL_TYPE = Object.freeze({
	HOUSEHOLDER: 'Householder',
	S78: 'Planning appeal',
	ENFORCEMENT_NOTICE: 'Enforcement notice appeal',
	ENFORCEMENT_LISTED_BUILDING: 'Enforcement listed building and conservation area appeal',
	DISCONTINUANCE_NOTICE: 'Discontinuance notice appeal',
	ADVERTISEMENT: 'Advertisement appeal',
	COMMUNITY_INFRASTRUCTURE_LEVY: 'Community infrastructure levy',
	PLANNING_OBLIGATION: 'Planning obligation appeal',
	AFFORDABLE_HOUSING_OBLIGATION: 'Affordable housing obligation appeal',
	CALL_IN_APPLICATION: 'Call-in application',
	LAWFUL_DEVELOPMENT_CERTIFICATE: 'Lawful development certificate appeal',
	PLANNED_LISTED_BUILDING: 'Planning listed building and conservation area appeal',
	CAS_PLANNING: 'CAS planning',
	CAS_ADVERTISEMENT: 'CAS advert'
});

const APPEAL_TYPE_CHANGE_APPEALS = Object.freeze({
	HOUSEHOLDER: 'Householder',
	S78: 'Planning',
	ENFORCEMENT_NOTICE: 'Enforcement notice',
	ENFORCEMENT_LISTED_BUILDING: 'Enforcement listed building and conservation area',
	DISCONTINUANCE_NOTICE: 'Discontinuance notice',
	ADVERTISEMENT: 'Advertisement',
	COMMUNITY_INFRASTRUCTURE_LEVY: 'Community infrastructure levy',
	PLANNING_OBLIGATION: 'Planning obligation',
	AFFORDABLE_HOUSING_OBLIGATION: 'Affordable housing obligation',
	CALL_IN_APPLICATION: 'Call-in application',
	LAWFUL_DEVELOPMENT_CERTIFICATE: 'Lawful development certificate',
	PLANNED_LISTED_BUILDING: 'Planning listed building and conservation area',
	CAS_PLANNING: 'Commercial planning (CAS)',
	CAS_ADVERTISEMENT: 'Commercial advertisement (CAS)'
});

export const appealTypes = [
	{
		key: APPEAL_CASE_TYPE.D,
		type: APPEAL_TYPE.HOUSEHOLDER,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.HOUSEHOLDER,
		processCode: 'HAS',
		enabled: true
	},
	{
		key: APPEAL_CASE_TYPE.C,
		type: APPEAL_TYPE.ENFORCEMENT_NOTICE,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.ENFORCEMENT_NOTICE,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.F,
		type: APPEAL_TYPE.ENFORCEMENT_LISTED_BUILDING,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.ENFORCEMENT_LISTED_BUILDING,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.G,
		type: APPEAL_TYPE.DISCONTINUANCE_NOTICE,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.DISCONTINUANCE_NOTICE,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.H,
		type: APPEAL_TYPE.ADVERTISEMENT,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.ADVERTISEMENT,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.L,
		type: APPEAL_TYPE.COMMUNITY_INFRASTRUCTURE_LEVY,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.COMMUNITY_INFRASTRUCTURE_LEVY,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.Q,
		type: APPEAL_TYPE.PLANNING_OBLIGATION,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.PLANNING_OBLIGATION,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.S,
		type: APPEAL_TYPE.AFFORDABLE_HOUSING_OBLIGATION,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.AFFORDABLE_HOUSING_OBLIGATION,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.V,
		type: APPEAL_TYPE.CALL_IN_APPLICATION,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.CALL_IN_APPLICATION,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.W,
		type: APPEAL_TYPE.S78,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.S78,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.X,
		type: APPEAL_TYPE.LAWFUL_DEVELOPMENT_CERTIFICATE,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.LAWFUL_DEVELOPMENT_CERTIFICATE,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.Y,
		type: APPEAL_TYPE.PLANNED_LISTED_BUILDING,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.PLANNED_LISTED_BUILDING,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.ZA,
		type: APPEAL_TYPE.CAS_ADVERTISEMENT,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.CAS_ADVERTISEMENT,
		enabled: false
	},
	{
		key: APPEAL_CASE_TYPE.ZP,
		type: APPEAL_TYPE.CAS_PLANNING,
		changeAppealType: APPEAL_TYPE_CHANGE_APPEALS.CAS_PLANNING,
		enabled: false
	}
];

/** @type {import('#util/types.js').RadioOption[]} */
export const caseTypes = Object.values(appealTypes)
	.map((v) => ({
		value: v.key,
		text: v.changeAppealType
	}))
	.sort((a, b) => a.text.localeCompare(b.text));

/** @type {import('#util/types.js').RadioOption[]} */
export const allocationLevels = Object.values(APPEAL_CASE_TYPE).map((v) => ({ value: v, text: v }));

/** @type {import('#util/types.js').RadioOption[]} */
export const specialisms = [
	{
		value: 'General allocation',
		text: 'General allocation'
	},
	{
		value: 'Schedule 1',
		text: 'Schedule 1'
	},
	{
		value: 'Schedule 2',
		text: 'Schedule 2'
	},
	{
		value: 'Enforcement',
		text: 'Enforcement'
	},
	{
		value: 'Housing orders',
		text: 'Housing orders'
	},
	{
		value: 'Rights of way',
		text: 'Rights of way'
	},
	{
		value: 'Shopping',
		text: 'Shopping'
	},
	{
		value: 'Gypsy',
		text: 'Gypsy'
	},
	{
		value: 'Housing',
		text: 'Housing'
	},
	{
		value: 'Access',
		text: 'Access'
	},
	{
		value: 'Advertisements',
		text: 'Advertisements'
	},
	{
		value: 'Appearance design',
		text: 'Appearance design'
	},
	{
		value: 'High hedges',
		text: 'High hedges'
	},
	{
		value: 'Historic heritage',
		text: 'Historic heritage'
	},
	{
		value: 'Listed building and enforcement',
		text: 'Listed building and enforcement'
	},
	{
		value: 'Natural heritage',
		text: 'Natural heritage'
	},
	{
		value: 'Renewable energy/wind farms',
		text: 'Renewable energy/wind farms'
	},
	{
		value: 'Roads and traffics',
		text: 'Roads and traffics'
	},
	{
		value: 'Transport',
		text: 'Transport'
	},
	{
		value: 'Tree preservation order',
		text: 'Tree preservation order'
	},
	{
		value: 'Waste',
		text: 'Waste'
	},
	{
		value: 'Water',
		text: 'Water'
	}
];
