import { describe, mock, test } from 'node:test';
import assert from 'assert';

import { buildViewCase } from './controller.js';
import { toInspectorViewModel } from '../home/view-model.js';
import { PREVIOUS_URL } from '#util/session.ts';

describe('buildViewCase', () => {
	const caseData = {
		caseReference: '6900107',
		caseStatus: 'lpa_questionnaire',
		caseType: 'W',
		caseProcedure: 'written',
		allocationLevel: 'G',
		allocationBand: 1,
		siteAddressLine1: '123 Example Street',
		caseStartedDate: new Date('2024-12-12T00:00:00.000Z'),
		isGreenBelt: false,
		designatedSitesNames: JSON.stringify([]),
		typeOfPlanningApplication: 'householder-application',
		applicationDecision: 'refused',
		isAonbNationalLandscape: false
	};
	const inspectorData = {
		id: 'c938e712-bebf-4010-b618-1218ce991145',
		firstName: 'User Four',
		lastName: 'Inspector (Test)',
		postcode: 'PO1 5LL',
		latitude: 50.803867,
		longitude: -1.072358,
		grade: 'B3',
		email: 'inspector-programming-test-4@planninginspectorate.gov.uk',
		Specialisms: [
			{
				id: '2a0d1bbb-1c07-4ec5-88e2-aca343ec6375',
				inspectorId: 'b62bce27-eb35-40e5-9164-1ad47786abcb',
				name: 'Hearings trained',
				proficiency: 'Trained',
				validFrom: '2024-03-11T00:00:00.000Z'
			},
			{
				id: '214346b2-7e4c-4ca2-92b4-c742d81a1fb0',
				inspectorId: 'b62bce27-eb35-40e5-9164-1ad47786abcb',
				name: 'Appeal against conditions',
				proficiency: 'Trained',
				validFrom: '2025-06-09T23:00:00.000Z'
			}
		]
	};
	test('renders case view with correct view model', async () => {
		const caseViewModel = { caseId: '6900107', siteAddress: '123 Main St', caseAge: 10 };

		const service = {
			db: {
				appealCase: {
					findUnique: mock.fn(async ({ where }) => (where.caseReference === caseData.caseReference ? caseData : null))
				}
			},
			osMapsApiKey: 'test-api-key',
			notifyConfig: {
				cbosLink: 'https://test-cbos-url.com'
			},
			casesClient: {
				caseToViewModel: mock.fn(() => caseViewModel)
			},
			inspectorClient: {
				getInspectorDetails: mock.fn(async (entraId) => (entraId === inspectorData.id ? inspectorData : null))
			}
		};

		const req = {
			query: { inspectorId: inspectorData.id },
			params: { caseId: caseData.caseReference },
			session: {
				persistence: {
					lastRequest: {
						queryParams: 'inspectorId=test-id&sort=age'
					}
				}
			}
		};

		let renderedView;
		let renderedModel;
		const res = {
			render: (view, model) => {
				renderedView = view;
				renderedModel = model;
			}
		};

		const handler = buildViewCase(service);
		await handler(req, res);

		assert.strictEqual(renderedView, 'views/case/view.njk');
		assert.strictEqual(renderedModel.pageHeading, 'Case details');
		assert.strictEqual(renderedModel.map.apiKey, 'test-api-key');
		assert.deepStrictEqual(renderedModel.inspectorPin, toInspectorViewModel(inspectorData));
		assert.strictEqual(renderedModel.backUrl, '/?inspectorId=test-id&sort=age');
		// enriched case view model merges stub then overrides siteAddress + adds derived fields
		assert.deepStrictEqual(renderedModel.caseData, {
			caseId: '6900107',
			siteAddress: '123 Example Street',
			caseAge: 10,
			specialismList: 'None',
			caseStartedDate: '12/12/2024',
			caseSpecialisms: 'None',
			eventType: 'No site visit event set',
			caseAgeColor: '00703c',
			linkedCases: 'None',
			caseStatus: 'LPA QUESTIONNAIRE',
			caseProcedure: 'WRITTEN',
			isGreenBelt: 'No',
			designatedSitesNames: 'None',
			typeOfPlanningApplication: 'HOUSEHOLDER APPLICATION',
			applicationDecision: 'refused',
			isAonbNationalLandscape: 'No'
		});

		assert.strictEqual(service.db.appealCase.findUnique.mock.calls.length, 1);
		assert.strictEqual(service.casesClient.caseToViewModel.mock.calls.length, 1);
		assert.strictEqual(service.inspectorClient.getInspectorDetails.mock.calls.length, 1);
		assert.deepStrictEqual(service.casesClient.caseToViewModel.mock.calls[0].arguments[0], caseData);
	});

	test('should render linked cases in the case view', async () => {
		const caseWithChildCases = {
			...caseData,
			ChildCases: [{ caseReference: '6000008' }, { caseReference: '6000009' }]
		};
		const caseViewModel = { caseId: '6900107', caseAge: 10 };

		const service = {
			db: {
				appealCase: {
					findUnique: mock.fn(async ({ where }) =>
						where.caseReference === caseWithChildCases.caseReference ? caseWithChildCases : null
					)
				}
			},
			osMapsApiKey: 'test-api-key',
			notifyConfig: {
				cbosLink: 'https://test-cbos-url.com'
			},
			casesClient: {
				caseToViewModel: mock.fn(() => caseViewModel)
			},
			inspectorClient: {
				getInspectorDetails: mock.fn(async (entraId) => (entraId === inspectorData.id ? inspectorData : null))
			}
		};

		const req = {
			query: { inspectorId: inspectorData.id },
			params: { caseId: caseData.caseReference },
			session: { persistence: {} }
		};

		let renderedView;
		let renderedModel;
		const res = {
			render: (view, model) => {
				renderedView = view;
				renderedModel = model;
			}
		};

		const handler = buildViewCase(service);
		await handler(req, res);

		assert.strictEqual(renderedView, 'views/case/view.njk');
		assert.strictEqual(renderedModel.caseData.linkedCases, '6000008, 6000009');
		assert.strictEqual(renderedModel.backUrl, '/');
	});

	test('handles missing inspectorId and caseId gracefully', async () => {
		const service = {
			db: {
				appealCase: {
					findUnique: mock.fn(async () => null)
				}
			},
			osMapsApiKey: 'test-api-key',
			notifyConfig: {
				cbosLink: 'https://test-cbos-url.com'
			},
			casesClient: {
				caseToViewModel: mock.fn(() => null)
			},
			inspectorClient: {
				getInspectorDetails: mock.fn(async () => null)
			}
		};

		const req = { query: {}, params: {}, session: { persistence: {} } };

		let renderedView;
		let renderedModel;
		const res = {
			render: (view, model) => {
				renderedView = view;
				renderedModel = model;
			}
		};

		const handler = buildViewCase(service);
		await handler(req, res);

		assert.strictEqual(renderedView, 'views/case/view.njk');
		assert.strictEqual(renderedModel.inspectorPin, toInspectorViewModel(null));
		assert.strictEqual(renderedModel.caseData, null);

		assert.strictEqual(service.db.appealCase.findUnique.mock.calls.length, 1);
		assert.strictEqual(service.inspectorClient.getInspectorDetails.mock.calls.length, 1);
		assert.strictEqual(service.casesClient.caseToViewModel.mock.calls.length, 1);
		assert.strictEqual(service.casesClient.caseToViewModel.mock.calls[0].arguments[0], null);
	});

	test('should read previous URL from session', async () => {
		const caseViewModel = { caseId: '6900107', siteAddress: '123 Main St', caseAge: 10 };
		const previousUrl = '/some-previous-url';

		const service = {
			db: {
				appealCase: {
					findUnique: mock.fn(async ({ where }) => (where.caseReference === caseData.caseReference ? caseData : null))
				}
			},
			osMapsApiKey: 'test-api-key',
			notifyConfig: {
				cbosLink: 'https://test-cbos-url.com'
			},
			casesClient: {
				caseToViewModel: mock.fn(() => caseViewModel)
			},
			inspectorClient: {
				getInspectorDetails: mock.fn(async (entraId) => (entraId === inspectorData.id ? inspectorData : null))
			}
		};

		const req = {
			query: { inspectorId: inspectorData.id },
			params: { caseId: caseData.caseReference },
			session: {
				[PREVIOUS_URL]: [previousUrl, '/this-url'],
				persistence: {
					lastRequest: {
						queryParams: 'inspectorId=test-id&sort=age'
					}
				}
			}
		};

		const res = {
			render: mock.fn()
		};

		const handler = buildViewCase(service);
		await handler(req, res);

		assert.strictEqual(res.render.mock.calls[0].arguments[1].backUrl, previousUrl);
	});
});
