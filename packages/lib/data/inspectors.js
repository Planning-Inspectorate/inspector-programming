/**
 * @returns {import("./types").Inspector[]}
 */
export function getInspectorList() {
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
		id: '1',
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
		grade: '2',
		fte: 1,
		inspectorManager: false,
		chartingOfficerId: '0',
		specialisms: [],
		preclusions: []
	};

	let inspector3 = {
		id: '3',
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
	return sortInspectorList(inspectorList);
}

/**
 * @param{import("./types").Inspector[]} inspectorList
 */
export function sortInspectorList(inspectorList) {
	return inspectorList.toSorted((a, b) => {
		if (a.lastName !== b.lastName) {
			return a.lastName < b.lastName ? -1 : 1;
		}
		return a.firstName < b.firstName ? -1 : 1;
	});
}
