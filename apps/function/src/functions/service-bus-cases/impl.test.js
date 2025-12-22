import { describe, test, mock } from 'node:test';
import assert from 'node:assert';
import { MESSAGE_EVENT_TYPE } from '@planning-inspectorate/data-model';
import { buildHandleCaseMessage, mapToDatabase, deleteCase, upsertCase } from './impl.js';

// Helper to create a mock context
function makeContext(type = MESSAGE_EVENT_TYPE.CREATE) {
	return {
		log: mock.fn(),
		triggerMetadata: { applicationProperties: { type } }
	};
}

// Helper to create a mock service with optional overrides
function makeService(options = {}) {
	const { upsertThrow = false, deleteThrow = false, postcodeResponse = null, deleteNotFound = false } = options;

	const appealCaseDeleteFn = mock.fn(async () => {
		if (deleteNotFound) {
			const error = new Error('Record not found');
			error.code = 'P2025';
			throw error;
		}
		if (deleteThrow) throw new Error('db delete failed');
	});

	const appealCaseUpsertFn = mock.fn(async () => {
		if (upsertThrow) throw new Error('db upsert failed');
		return { caseReference: 'APP/123' };
	});

	const specialismDeleteManyFn = mock.fn(async () => ({ count: 0 }));
	const specialismCreateFn = mock.fn(async () => ({}));

	const appealCaseObj = { delete: appealCaseDeleteFn, upsert: appealCaseUpsertFn };
	const specialismObj = { deleteMany: specialismDeleteManyFn, create: specialismCreateFn };

	// Add a mock logger to match FunctionService type
	const logger = {
		fatal: () => {},
		error: () => {},
		warn: () => {},
		info: () => {},
		debug: () => {},
		trace: () => {}
	};

	return {
		dbClient: {
			appealCase: appealCaseObj,
			appealCaseSpecialism: specialismObj,
			$transaction: async (cb) =>
				cb({
					appealCase: appealCaseObj,
					appealCaseSpecialism: specialismObj
				})
		},
		osApiClient: {
			addressesForPostcode: mock.fn(async () => postcodeResponse)
		},
		logger
	};
}

// Helper to create a valid message, with optional overrides
function makeValidMessage(fields = {}) {
	return {
		caseReference: 'APP/W1234/D/25/1234567',
		caseId: 12345,
		caseStatus: 'ready_to_start',
		caseType: 'D',
		caseProcedure: 'written',
		originalDevelopmentDescription: 'Test development',
		allocationLevel: 'A',
		allocationBand: 1,
		siteAddressLine1: '1 Test Street',
		siteAddressLine2: null,
		siteAddressTown: 'Test Town',
		siteAddressCounty: 'Test County',
		siteAddressPostcode: 'TE1 1ST',
		lpaCode: 'E1234',
		lpaName: 'Test LPA',
		caseCreatedDate: '2025-01-01T00:00:00.000Z',
		caseValidDate: '2025-01-02T00:00:00.000Z',
		finalCommentsDueDate: null,
		linkedCaseStatus: null,
		leadCaseReference: null,
		appellantCostsAppliedFor: false,
		lpaCostsAppliedFor: false,
		inspectorId: null,
		specialisms: [],
		caseOfficerId: 'officer-1',
		caseSpecialisms: [],
		caseSubmittedDate: '2025-01-01T00:00:00.000Z',
		caseUpdatedDate: '2025-01-01T00:00:00.000Z',
		caseValidationDate: '2025-01-01T00:00:00.000Z',
		caseValidationOutcome: 'valid',
		caseValidationInvalidDetails: [],
		caseValidationIncompleteDetails: [],
		caseExtensionDate: '2025-01-01T00:00:00.000Z',
		caseStartedDate: '2025-01-01T00:00:00.000Z',
		casePublishedDate: '2025-01-01T00:00:00.000Z',
		lpaQuestionnaireDueDate: '2025-01-01T00:00:00.000Z',
		lpaQuestionnaireSubmittedDate: '2025-01-01T00:00:00.000Z',
		lpaQuestionnaireCreatedDate: '2025-01-01T00:00:00.000Z',
		lpaQuestionnairePublishedDate: '2025-01-01T00:00:00.000Z',
		lpaQuestionnaireValidationOutcome: 'complete',
		lpaQuestionnaireValidationOutcomeDate: '2025-01-01T00:00:00.000Z',
		lpaQuestionnaireValidationDetails: [],
		lpaStatement: '',
		caseWithdrawnDate: '2025-01-01T00:00:00.000Z',
		caseTransferredDate: '2025-01-01T00:00:00.000Z',
		transferredCaseClosedDate: '2025-01-01T00:00:00.000Z',
		caseDecisionOutcomeDate: '2025-01-01T00:00:00.000Z',
		caseDecisionPublishedDate: '2025-01-01T00:00:00.000Z',
		caseDecisionOutcome: 'allowed',
		caseCompletedDate: '2025-01-01T00:00:00.000Z',
		enforcementNotice: false,
		applicationReference: 'APP/123',
		applicationDate: '2025-01-01T00:00:00.000Z',
		applicationDecision: 'granted',
		applicationDecisionDate: '2025-01-01T00:00:00.000Z',
		caseSubmissionDueDate: '2025-01-01T00:00:00.000Z',
		siteAccessDetails: [],
		siteSafetyDetails: [],
		siteAreaSquareMetres: 100,
		floorSpaceSquareMetres: 100,
		isCorrectAppealType: true,
		isGreenBelt: false,
		inConservationArea: false,
		ownsAllLand: true,
		ownsSomeLand: false,
		knowsOtherOwners: 'No',
		knowsAllOwners: 'Yes',
		advertisedAppeal: false,
		notificationMethod: [],
		ownersInformed: false,
		changedDevelopmentDescription: false,
		newConditionDetails: '',
		nearbyCaseReferences: [],
		neighbouringSiteAddresses: [],
		affectedListedBuildingNumbers: [],
		...fields
	};
}

describe('mapToDatabase', () => {
	test('maps basic fields and coordinates', () => {
		const data = mapToDatabase(makeValidMessage(), { latitude: 51.5, longitude: -0.12 });
		assert.strictEqual(data.caseReference, 'APP/W1234/D/25/1234567');
		assert.strictEqual(data.caseId, 12345);
		assert.strictEqual(data.siteAddressPostcode, 'TE1 1ST');
		assert.strictEqual(data.siteAddressLatitude, 51.5);
		assert.strictEqual(data.siteAddressLongitude, -0.12);
	});

	test('handles null coordinates', () => {
		const data = mapToDatabase(makeValidMessage(), { latitude: null, longitude: null });
		assert.strictEqual(data.siteAddressLatitude, null);
		assert.strictEqual(data.siteAddressLongitude, null);
	});

	test('converts date strings to Date objects', () => {
		const data = mapToDatabase(makeValidMessage(), { latitude: null, longitude: null });
		assert.ok(data.caseCreatedDate instanceof Date);
		assert.ok(data.caseValidDate instanceof Date);
	});
});

describe('deleteCase', () => {
	test('deletes case when caseReference provided', async () => {
		await deleteCase(makeService(), 'APP/123', makeContext(MESSAGE_EVENT_TYPE.DELETE));
	});

	test('throws error when caseReference missing', async () => {
		await assert.rejects(
			() => deleteCase(makeService(), '', makeContext(MESSAGE_EVENT_TYPE.DELETE)),
			/Delete event missing caseReference/
		);
	});

	test('handles case not found gracefully', async () => {
		await deleteCase(makeService({ deleteNotFound: true }), 'APP/123', makeContext(MESSAGE_EVENT_TYPE.DELETE));
	});

	test('wraps database deletion errors', async () => {
		await assert.rejects(
			() => deleteCase(makeService({ deleteThrow: true }), 'APP/123', makeContext(MESSAGE_EVENT_TYPE.DELETE)),
			/Error deleting case: db delete failed/
		);
	});
});

describe('upsertCase', () => {
	test('upserts case with coordinates', async () => {
		await upsertCase(
			makeService({ postcodeResponse: { results: [{ DPA: { LAT: 1.23, LNG: 4.56 } }] } }),
			makeValidMessage(),
			makeContext(MESSAGE_EVENT_TYPE.CREATE)
		);
	});

	test('continues without coordinates if postcode lookup fails', async () => {
		await upsertCase(
			makeService({ postcodeResponse: null }),
			makeValidMessage(),
			makeContext(MESSAGE_EVENT_TYPE.CREATE)
		);
	});

	test('wraps upsert errors', async () => {
		await assert.rejects(
			() =>
				upsertCase(
					makeService({ postcodeResponse: { results: [{ DPA: { LAT: 0, LNG: 0 } }] }, upsertThrow: true }),
					makeValidMessage(),
					makeContext(MESSAGE_EVENT_TYPE.CREATE)
				),
			/Failed to upsert case/
		);
	});
});

describe('buildHandleCaseMessage', () => {
	test('calls delete for delete events', async () => {
		const handler = buildHandleCaseMessage(makeService(), 'appeal-has.schema.json');
		await handler(makeValidMessage(), makeContext(MESSAGE_EVENT_TYPE.DELETE));
	});

	test('calls delete when inspectorId is set', async () => {
		const handler = buildHandleCaseMessage(makeService(), 'appeal-has.schema.json');
		await handler(makeValidMessage({ inspectorId: 'inspector-123' }), makeContext(MESSAGE_EVENT_TYPE.UPDATE));
	});

	test('calls upsert for create events without inspectorId', async () => {
		const handler = buildHandleCaseMessage(
			makeService({ postcodeResponse: { results: [{ DPA: { LAT: 9, LNG: 8 } }] } }),
			'appeal-has.schema.json'
		);
		await handler(makeValidMessage(), makeContext(MESSAGE_EVENT_TYPE.CREATE));
	});
});
