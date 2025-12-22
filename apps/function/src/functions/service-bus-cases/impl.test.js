import { describe, test, mock } from 'node:test';
import assert from 'node:assert';
import { MESSAGE_EVENT_TYPE } from '@planning-inspectorate/data-model';
import { buildHandleCaseMessage, mapToDatabase, deleteCase, upsertCase } from './impl.js';

// BASE TEST DATA - Single source of truth

const BASE_MESSAGE = {
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
	affectedListedBuildingNumbers: []
};

const NULL_COORDS = { latitude: null, longitude: null };
const VALID_COORDS = { latitude: 51.5, longitude: -0.12 };
const VALID_POSTCODE_RESPONSE = { results: [{ DPA: { LAT: 51.5, LNG: -0.12 } }] };

const msg = (overrides = {}) => ({ ...BASE_MESSAGE, ...overrides });

const ctx = (type = MESSAGE_EVENT_TYPE.CREATE) => ({
	log: mock.fn(),
	triggerMetadata: { applicationProperties: { type } }
});

const svc = (options = {}) => {
	const { upsertThrow, deleteThrow, deleteNotFound, postcodeResponse } = options;

	const mocks = {
		delete: mock.fn(async () => {
			if (deleteNotFound) {
				const err = new Error('Not found');
				err.code = 'P2025';
				throw err;
			}
			if (deleteThrow) throw new Error('db delete failed');
		}),
		upsert: mock.fn(async () => {
			if (upsertThrow) throw new Error('db upsert failed');
			return { caseReference: 'APP/123' };
		}),
		updateMany: mock.fn(async () => ({ count: 0 })),
		deleteMany: mock.fn(async () => ({ count: 0 })),
		findMany: mock.fn(async () => []),
		create: mock.fn(async () => ({})),
		upsertSpecialism: mock.fn(async () => ({})),
		transaction: mock.fn(async (cb) =>
			cb({
				appealCase: {
					delete: mocks.delete,
					upsert: mocks.upsert,
					updateMany: mocks.updateMany
				},
				appealEvent: {
					deleteMany: mocks.deleteMany
				},
				appealCaseSpecialism: {
					deleteMany: mocks.deleteMany,
					create: mocks.create,
					findMany: mocks.findMany,
					upsert: mocks.upsertSpecialism
				}
			})
		)
	};

	return {
		dbClient: {
			appealCase: { delete: mocks.delete, upsert: mocks.upsert },
			appealCaseSpecialism: { deleteMany: mocks.deleteMany, create: mocks.create },
			$transaction: mocks.transaction
		},
		osApiClient: { addressesForPostcode: mock.fn(async () => postcodeResponse) },
		mocks
	};
};

const assertCalls = (mockFn, expected, name) => {
	assert.strictEqual(
		mockFn.mock.callCount(),
		expected,
		`${name}: expected ${expected} calls, got ${mockFn.mock.callCount()}`
	);
};

describe('mapToDatabase', () => {
	test('maps fields and coordinates correctly', () => {
		const result = mapToDatabase(msg(), VALID_COORDS);
		assert.strictEqual(result.caseReference, 'APP/W1234/D/25/1234567');
		assert.strictEqual(result.caseId, 12345);
		assert.strictEqual(result.siteAddressLatitude, 51.5);
		assert.strictEqual(result.siteAddressLongitude, -0.12);
	});

	test('handles null coordinates', () => {
		const result = mapToDatabase(msg(), NULL_COORDS);
		assert.strictEqual(result.siteAddressLatitude, null);
		assert.strictEqual(result.siteAddressLongitude, null);
	});

	test('converts date strings to Date objects', () => {
		const result = mapToDatabase(msg(), NULL_COORDS);
		assert.ok(result.caseCreatedDate instanceof Date);
		assert.strictEqual(result.caseCreatedDate.toISOString(), '2025-01-01T00:00:00.000Z');
	});

	test('handles missing optional fields with null', () => {
		const result = mapToDatabase(msg({ caseStatus: undefined, caseProcedure: undefined }), NULL_COORDS);
		assert.strictEqual(result.caseStatus, null);
		assert.strictEqual(result.caseProcedure, null);
	});
});

describe('deleteCase', () => {
	test('calls database delete with correct caseReference', async () => {
		const service = svc();
		await deleteCase(service, 'APP/123', ctx(MESSAGE_EVENT_TYPE.DELETE));
		assertCalls(service.mocks.transaction, 1, 'transaction');
		assertCalls(service.mocks.delete, 1, 'delete');
		assert.deepStrictEqual(service.mocks.delete.mock.calls[0].arguments[0], { where: { caseReference: 'APP/123' } });
	});

	test('throws when caseReference empty', async () => {
		await assert.rejects(() => deleteCase(svc(), '', ctx()), { message: 'Delete event missing caseReference' });
	});

	test('throws when caseReference null', async () => {
		await assert.rejects(() => deleteCase(svc(), null, ctx()), { message: 'Delete event missing caseReference' });
	});

	test('handles P2025 not found gracefully', async () => {
		const service = svc({ deleteNotFound: true });
		await deleteCase(service, 'APP/123', ctx());
		assertCalls(service.mocks.delete, 1, 'delete');
	});

	test('wraps database errors', async () => {
		await assert.rejects(() => deleteCase(svc({ deleteThrow: true }), 'APP/123', ctx()), {
			message: 'Failed to delete case APP/123: db delete failed'
		});
	});
});

describe('upsertCase', () => {
	test('upserts with coordinates when postcode provided', async () => {
		const service = svc({ postcodeResponse: VALID_POSTCODE_RESPONSE });
		await upsertCase(service, msg(), ctx());
		assertCalls(service.mocks.upsert, 1, 'upsert');
		assertCalls(service.mocks.transaction, 1, 'transaction');
	});

	test('continues without coordinates when lookup fails', async () => {
		const service = svc({ postcodeResponse: null });
		await upsertCase(service, msg(), ctx());
		assertCalls(service.mocks.upsert, 1, 'upsert');
	});

	test('skips coordinate lookup when no postcode', async () => {
		const service = svc();
		await upsertCase(service, msg({ siteAddressPostcode: null }), ctx());
		assertCalls(service.mocks.upsert, 1, 'upsert');
	});

	test('throws when caseReference missing', async () => {
		await assert.rejects(() => upsertCase(svc(), msg({ caseReference: null }), ctx()), {
			message: 'Upsert event missing caseReference'
		});
	});

	test('syncs specialisms when provided', async () => {
		const service = svc({ postcodeResponse: VALID_POSTCODE_RESPONSE });
		await upsertCase(
			service,
			msg({
				caseSpecialisms: [
					{ name: 'Highways', specialism: 'highways' },
					{ name: 'Heritage', specialism: 'heritage' }
				]
			}),
			ctx()
		);

		assertCalls(service.mocks.upsert, 1, 'upsert');
		assertCalls(service.mocks.deleteMany, 1, 'deleteMany');
		assertCalls(service.mocks.upsertSpecialism, 2, 'appealCaseSpecialism.upsert');
		assertCalls(service.mocks.findMany, 0, 'findMany');
		assertCalls(service.mocks.create, 0, 'create');
	});

	test('filters invalid specialisms', async () => {
		const service = svc({ postcodeResponse: VALID_POSTCODE_RESPONSE });
		await upsertCase(
			service,
			msg({
				caseSpecialisms: [{ name: 'Valid', specialism: 'valid' }, null, {}, { name: null, specialism: 'ignored' }]
			}),
			ctx()
		);
		assertCalls(service.mocks.deleteMany, 1, 'deleteMany');
		assertCalls(service.mocks.upsertSpecialism, 1, 'appealCaseSpecialism.upsert');
		assertCalls(service.mocks.create, 0, 'create');
	});

	test('wraps upsert errors', async () => {
		await assert.rejects(
			() => upsertCase(svc({ postcodeResponse: VALID_POSTCODE_RESPONSE, upsertThrow: true }), msg(), ctx()),
			/Failed to upsert case/
		);
	});
});

describe('buildHandleCaseMessage', () => {
	test('deletes for DELETE event', async () => {
		const service = svc();
		await buildHandleCaseMessage(service, 'appeal-has.schema.json')(msg(), ctx(MESSAGE_EVENT_TYPE.DELETE));
		assertCalls(service.mocks.delete, 1, 'delete');
		assertCalls(service.mocks.upsert, 0, 'upsert');
	});

	test('deletes when inspectorId set', async () => {
		const service = svc();
		await buildHandleCaseMessage(service, 'appeal-has.schema.json')(
			msg({ inspectorId: 'insp-1' }),
			ctx(MESSAGE_EVENT_TYPE.UPDATE)
		);
		assertCalls(service.mocks.delete, 1, 'delete');
		assertCalls(service.mocks.upsert, 0, 'upsert');
	});

	test('upserts for CREATE without inspectorId', async () => {
		const service = svc({ postcodeResponse: VALID_POSTCODE_RESPONSE });
		await buildHandleCaseMessage(service, 'appeal-has.schema.json')(msg(), ctx(MESSAGE_EVENT_TYPE.CREATE));
		assertCalls(service.mocks.delete, 0, 'delete');
		assertCalls(service.mocks.upsert, 1, 'upsert');
	});

	test('upserts for UPDATE without inspectorId', async () => {
		const service = svc({ postcodeResponse: VALID_POSTCODE_RESPONSE });
		await buildHandleCaseMessage(service, 'appeal-has.schema.json')(msg(), ctx(MESSAGE_EVENT_TYPE.UPDATE));
		assertCalls(service.mocks.upsert, 1, 'upsert');
	});

	test('logs are called', async () => {
		const service = svc({ postcodeResponse: VALID_POSTCODE_RESPONSE });
		const context = ctx(MESSAGE_EVENT_TYPE.CREATE);
		await buildHandleCaseMessage(service, 'appeal-has.schema.json')(msg(), context);
		assert.ok(context.log.mock.callCount() > 0, 'Expected logging');
	});
});
