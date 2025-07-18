import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { sortInspectorList } from './inspectors.js';

describe('inspectors', () => {
	it('should sort inspectors list by last name', () => {
		let inspector1 = {
			id: '0',
			firstName: 'John',
			lastName: 'Baker',
			emailAddress: 'test@email.co,m',
			address: {
				addressLine1: 'address line 1',
				addressLine2: 'address line 2',
				townCity: 'town',
				county: 'county',
				postcode: 'postcode'
			},
			grade: '0',
			fte: 1,
			inspectorManager: false,
			chartingOfficerId: '0',
			specialisms: [],
			preclusions: []
		};

		let inspector2 = {
			id: '0',
			firstName: 'John',
			lastName: 'Adams',
			emailAddress: 'test@email.co,m',
			address: {
				addressLine1: 'address line 1',
				addressLine2: 'address line 2',
				townCity: 'town',
				county: 'county',
				postcode: 'postcode'
			},
			grade: '0',
			fte: 1,
			inspectorManager: false,
			chartingOfficerId: '0',
			specialisms: [],
			preclusions: []
		};

		let inspector3 = {
			id: '0',
			firstName: 'John',
			lastName: 'Allen',
			emailAddress: 'test@email.co,m',
			address: {
				addressLine1: 'address line 1',
				addressLine2: 'address line 2',
				townCity: 'town',
				county: 'county',
				postcode: 'postcode'
			},
			grade: '0',
			fte: 1,
			inspectorManager: false,
			chartingOfficerId: '0',
			specialisms: [],
			preclusions: []
		};

		let inspectorList = [inspector1, inspector2, inspector3];
		let sortedList = sortInspectorList(inspectorList);
		assert.deepStrictEqual(sortedList, [inspector2, inspector3, inspector1]);
	});

	it('should sort inspectors list by first name', () => {
		let inspector1 = {
			id: '0',
			firstName: 'John',
			lastName: 'Baker',
			emailAddress: 'test@email.co,m',
			address: {
				addressLine1: 'address line 1',
				addressLine2: 'address line 2',
				townCity: 'town',
				county: 'county',
				postcode: 'postcode'
			},
			grade: '0',
			fte: 1,
			inspectorManager: false,
			chartingOfficerId: '0',
			specialisms: [],
			preclusions: []
		};

		let inspector2 = {
			id: '0',
			firstName: 'Alice',
			lastName: 'Baker',
			emailAddress: 'test@email.co,m',
			address: {
				addressLine1: 'address line 1',
				addressLine2: 'address line 2',
				townCity: 'town',
				county: 'county',
				postcode: 'postcode'
			},
			grade: '0',
			fte: 1,
			inspectorManager: false,
			chartingOfficerId: '0',
			specialisms: [],
			preclusions: []
		};

		let inspector3 = {
			id: '0',
			firstName: 'Jake',
			lastName: 'Baker',
			emailAddress: 'test@email.co,m',
			address: {
				addressLine1: 'address line 1',
				addressLine2: 'address line 2',
				townCity: 'town',
				county: 'county',
				postcode: 'postcode'
			},
			grade: '0',
			fte: 1,
			inspectorManager: false,
			chartingOfficerId: '0',
			specialisms: [],
			preclusions: []
		};

		let inspectorList = [inspector1, inspector2, inspector3];
		let sortedList = sortInspectorList(inspectorList);
		assert.deepStrictEqual(sortedList, [inspector2, inspector3, inspector1]);
	});
});
