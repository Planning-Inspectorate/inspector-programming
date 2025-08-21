import { describe, test, mock } from 'node:test';
import assert from 'assert';
import { caseToViewModel } from './view-model.js';

function buildCasesClient(returnValueFn) {
	return {
		caseToViewModel: mock.fn(returnValueFn)
	};
}

describe('case/view-model caseToViewModel', () => {
	test('returns underlying client output when case is falsy', () => {
		const casesClient = buildCasesClient(() => null);
		const result = caseToViewModel(casesClient, null);
		assert.strictEqual(result, null);
		assert.strictEqual(casesClient.caseToViewModel.mock.calls.length, 1);
		assert.strictEqual(casesClient.caseToViewModel.mock.calls[0].arguments[0], null);
	});

	test('enriches base view model without specialisms or events', () => {
		const baseCase = {
			caseReference: '69002163',
			caseAge: 10,
			caseStatus: 'in_progress',
			allocationBand: 2,
			caseProcedure: 'written',
			caseType: 'W',
			siteAddressLine1: '10 Downing St'
		};

		const baseViewModel = {
			caseId: baseCase.caseReference,
			siteAddress: 'SHOULD_BE_OVERRIDDEN',
			caseStatus: baseCase.caseStatus,
			allocationBand: baseCase.allocationBand,
			caseProcedure: baseCase.caseProcedure,
			caseType: baseCase.caseType,
			caseAge: baseCase.caseAge
		};

		const casesClient = buildCasesClient(() => baseViewModel);
		const result = caseToViewModel(casesClient, baseCase);

		assert.strictEqual(casesClient.caseToViewModel.mock.calls.length, 1);
		assert.strictEqual(casesClient.caseToViewModel.mock.calls[0].arguments[0], baseCase);

		assert.strictEqual(result.caseId, '69002163');
		assert.strictEqual(result.siteAddress, '10 Downing St');
		assert.strictEqual(result.specialismList, 'None');
		assert.strictEqual(result.caseSpecialisms, 'None');
		assert.strictEqual(result.appealStartDate, '');
		assert.strictEqual(result.eventType, 'No events');
		assert.strictEqual(result.caseAgeColor, '00703c');
	});

	test('enriches with specialisms and events (formats date, sets color)', (ctx) => {
		ctx.mock.timers.enable({
			apis: ['Date'],
			now: new Date('2025-01-01T12:00:00Z')
		});
		const baseCase = {
			caseReference: '6900214',
			caseAge: 25,
			caseStatus: 'ready',
			allocationBand: 1,
			caseProcedure: 'hearing',
			caseType: 'H',
			siteAddressLine1: '221B Baker Street',
			Specialisms: [
				{ id: 's1', specialism: 'Spec 1' },
				{ id: 's2', specialism: 'Spec 2' }
			],
			Events: [
				{ id: 'e1', eventType: 'Hearing', eventStartDateTime: '2025-03-15T10:00:00Z' },
				{ id: 'e2', eventType: 'Site Visit', eventStartDateTime: '2025-04-01T09:00:00Z' }
			]
		};

		const baseViewModel = {
			caseId: baseCase.caseReference,
			siteAddress: 'ORIGINAL',
			caseStatus: baseCase.caseStatus,
			allocationBand: baseCase.allocationBand,
			caseProcedure: baseCase.caseProcedure,
			caseType: baseCase.caseType,
			caseAge: baseCase.caseAge
		};

		const casesClient = buildCasesClient(() => baseViewModel);
		const result = caseToViewModel(casesClient, baseCase);

		assert.strictEqual(result.caseId, '6900214');
		assert.strictEqual(result.siteAddress, '221B Baker Street');
		assert.strictEqual(result.specialismList, 'Spec 1, Spec 2');
		assert.strictEqual(result.caseSpecialisms, 'Spec 1, Spec 2');
		assert.strictEqual(result.appealStartDate, '15/03/2025');
		assert.strictEqual(result.eventType, 'Hearing');
		assert.strictEqual(result.caseAgeColor, 'f47738');
	});
});
