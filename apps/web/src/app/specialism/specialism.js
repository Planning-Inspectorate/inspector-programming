import { APPEAL_CASE_TYPE } from '@planning-inspectorate/data-model';

export const specialismTypes = Object.values(APPEAL_CASE_TYPE).map((v) => ({ value: v, text: v }));

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

export const caseTypes = [
	{
		value: 'Enforcement notice',
		text: 'Enforcement notice'
	},
	{
		value: 'Householder',
		text: 'Householder'
	},
	{
		value: 'Enforcement listed building and conservation area',
		text: 'Enforcement listed building and conservation area'
	},
	{
		value: 'Discontinuance notice',
		text: 'Discontinuance notice'
	},
	{
		value: 'Advertisement',
		text: 'Advertisement'
	},
	{
		value: 'Community infrastructure levy',
		text: 'Community infrastructure levy'
	},
	{
		value: 'Planning obligation',
		text: 'Planning obligation'
	},
	{
		value: 'Affordable housing obligation',
		text: 'Affordable housing obligation'
	},
	{
		value: 'Call-in application',
		text: 'Call-in application'
	},
	{
		value: 'Planning',
		text: 'Planning'
	},
	{
		value: 'Lawful development certificate',
		text: 'Lawful development certificate'
	},
	{
		value: 'Planning listed building and conservation area',
		text: 'Planning listed building and conservation area'
	},
	{
		value: 'Commercial planning (CAS)',
		text: 'Commercial planning (CAS)'
	},
	{
		value: 'Commercial advertisement (CAS)',
		text: 'Commercial advertisement (CAS)'
	}
];
