import { describe, test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import Ajv from 'ajv';
import { MESSAGE_EVENT_TYPE } from '@planning-inspectorate/data-model';
import { buildHandleInspectorMessage, mapToDatabase, deleteInspector, upsertInspector } from './impl.js';
import { loadAllSchemas } from '@planning-inspectorate/data-model';

/**
 * @param {string} [type]
 * @returns {{ log: ReturnType<typeof mock.fn>, triggerMetadata: { applicationProperties: { type: string } } }}
 */
function makeContext(type = MESSAGE_EVENT_TYPE.CREATE) {
	return {
		log: mock.fn(),
		triggerMetadata: { applicationProperties: { type } }
	};
}

/**
 * @param {{ upsertThrow?: boolean, deleteThrow?: boolean, postcodeResponse?: any, addressesError?: boolean, specialismUpsertThrow?: boolean, specialismDeleteThrow?: boolean }} [options]
 * @returns {{ dbClient: { inspector: { delete: Function, upsert: Function }, inspectorSpecialism: { upsert: Function, deleteMany: Function } }, osApiClient: { addressesForPostcode: Function } }}
 */
function makeService(options = {}) {
	const {
		upsertThrow = false,
		deleteThrow = false,
		postcodeResponse = null,
		addressesError = false,
		specialismUpsertThrow = false,
		specialismDeleteThrow = false
	} = options;
	const inspectorDeleteFn = mock.fn(async () => {
		if (deleteThrow) throw new Error('db delete failed');
	});
	const inspectorUpsertFn = mock.fn(async () => {
		if (upsertThrow) throw new Error('db upsert failed');
		return { id: 'insp-uuid-1' };
	});
	const specialismUpsertFn = mock.fn(async () => {
		if (specialismUpsertThrow) throw new Error('specialism upsert failed');
	});
	const specialismDeleteManyFn = mock.fn(async () => {
		if (specialismDeleteThrow) throw new Error('specialism deleteMany failed');
		return { count: 0 };
	});
	const inspectorObj = { delete: inspectorDeleteFn, upsert: inspectorUpsertFn };
	const specialismObj = { upsert: specialismUpsertFn, deleteMany: specialismDeleteManyFn };
	return {
		dbClient: {
			inspector: inspectorObj,
			inspectorSpecialism: specialismObj,
			$transaction: async (cb) => cb({ inspector: inspectorObj, inspectorSpecialism: specialismObj })
		},
		osApiClient: {
			addressesForPostcode: mock.fn(async () => {
				if (addressesError) throw new Error('addresses error');
				return postcodeResponse;
			})
		}
	};
}

/**
 * @typedef {Partial<import('@planning-inspectorate/data-model/src/schemas').PINSInspector>} PINSInspectorOverrides
 */

/**
 * Builds a schema-valid `PINSInspector` test message.
 *
 * @param {PINSInspectorOverrides} [fields]
 * @returns {import('@planning-inspectorate/data-model/src/schemas').PINSInspector} Fully populated inspector message.
 */
function makeValidMessage(fields = {}) {
	return {
		entraId: 'entra-123',
		firstName: 'Jane',
		lastName: 'Doe',
		grade: 'A',
		email: 'jane.doe@example.com',
		sapId: 'sap-001',
		fte: 1,
		unit: 'Unit A',
		service: 'Service X',
		group: 'Group Y',
		inspectorManager: 'Manager Name',
		address: {
			postcode: 'AB12CD',
			addressLine1: '1 High Street',
			addressLine2: 'Office 2',
			townCity: 'Testville',
			county: 'Testshire'
		},
		specialisms: [
			{ name: 'Planning', proficiency: 'ADVANCED', validFrom: '2024-01-01T00:00:00.000Z' },
			{ name: 'Housing', proficiency: null, validFrom: null },
			{ name: '', proficiency: 'IGNORE', validFrom: null }
		],
		...fields
	};
}

describe('map To Database', () => {
	test('maps basic fields and coordinates', () => {
		const message = makeValidMessage();
		const coords = { latitude: 51.5, longitude: -0.12 };
		const data = mapToDatabase(message, coords);
		assert.strictEqual(data.firstName, 'Jane');
		assert.strictEqual(data.postcode, 'AB12CD');
		assert.strictEqual(data.latitude, 51.5);
		assert.strictEqual(data.longitude, -0.12);
	});

	test('does not include Specialisms relation now', () => {
		const message = makeValidMessage();
		const data = mapToDatabase(message, { latitude: null, longitude: null });
		assert.ok(!('Specialisms' in data));
	});

	test('sets postcode null when address missing', () => {
		const msg = makeValidMessage({ address: undefined });
		const data = mapToDatabase(msg, { latitude: null, longitude: null });
		assert.strictEqual(data.postcode, null);
	});
});

describe('delete Inspector', () => {
	let service;
	let context;
	beforeEach(() => {
		service = makeService();
		context = makeContext(MESSAGE_EVENT_TYPE.DELETE);
	});

	test('deletes inspector when entraId provided', async () => {
		await deleteInspector(service, 'entra-123', context);
		assert.strictEqual(service.dbClient.inspector.delete.mock.callCount(), 1);
		assert.match(context.log.mock.calls[0].arguments[0], /Inspector with entraId entra-123 has been deleted/);
	});

	test('throws error when entraId missing', async () => {
		await assert.rejects(
			() => deleteInspector(service, '', context),
			/Delete event missing stable inspector identifier/
		);
		assert.strictEqual(service.dbClient.inspector.delete.mock.callCount(), 0);
	});

	test('wraps database deletion errors', async () => {
		service = makeService({ deleteThrow: true });
		await assert.rejects(
			() => deleteInspector(service, 'entra-123', context),
			/Error deleting inspector: db delete failed/
		);
		assert.strictEqual(service.dbClient.inspector.delete.mock.callCount(), 1);
	});

	test('logs before throwing when entraId missing', async () => {
		const service2 = makeService();
		const context2 = makeContext(MESSAGE_EVENT_TYPE.DELETE);
		await assert.rejects(() => deleteInspector(service2, '', context2));
		assert.match(context2.log.mock.calls[0].arguments[0], /Delete event missing stable inspector identifier/);
	});
});

describe('upsertInspector', () => {
	let context;
	beforeEach(() => {
		context = makeContext(MESSAGE_EVENT_TYPE.CREATE);
	});

	test('upserts inspector and syncs specialisms (create + update + delete)', async () => {
		const service = makeService({ postcodeResponse: { results: [{ DPA: { LAT: 1.23, LNG: 4.56 } }] } });
		const message = makeValidMessage();
		await upsertInspector(service, message, context);
		// inspector upsert
		assert.strictEqual(service.dbClient.inspector.upsert.mock.callCount(), 1);
		// 2 specialisms with names (filtered out blank)
		assert.strictEqual(service.dbClient.inspectorSpecialism.upsert.mock.callCount(), 2);
		// deleteMany called once
		assert.strictEqual(service.dbClient.inspectorSpecialism.deleteMany.mock.callCount(), 1);
		assert.match(context.log.mock.calls.at(-2).arguments[0], /Inspector has been upserted: entra-123/);
		assert.match(context.log.mock.calls.at(-1).arguments[0], /Specialisms synced/);
	});

	test('removes old specialisms when incoming list shrinks', async () => {
		const service = makeService({ postcodeResponse: { results: [{ DPA: { LAT: 11.11, LNG: 22.22 } }] } });
		const originalMessage = makeValidMessage();
		await upsertInspector(service, originalMessage, context);
		const firstDeleteArgs = service.dbClient.inspectorSpecialism.deleteMany.mock.calls.at(-1).arguments[0];
		assert.deepStrictEqual(firstDeleteArgs.where.name, { notIn: ['Planning', 'Housing'] });
		const updatedMessage = makeValidMessage({
			specialisms: [{ name: 'Planning', proficiency: 'ADVANCED', validFrom: '2024-01-01T00:00:00.000Z' }]
		});
		await upsertInspector(service, updatedMessage, context);
		assert.strictEqual(service.dbClient.inspector.upsert.mock.callCount(), 2);
		assert.strictEqual(service.dbClient.inspectorSpecialism.upsert.mock.callCount(), 3);
		const lastDeleteArgs = service.dbClient.inspectorSpecialism.deleteMany.mock.calls.at(-1).arguments[0];
		assert.deepStrictEqual(lastDeleteArgs.where.name, { notIn: ['Planning'] });
	});

	test('removes all specialisms when incoming list empty', async () => {
		const service = makeService({ postcodeResponse: { results: [{ DPA: { LAT: 7.89, LNG: 0.12 } }] } });
		const message = makeValidMessage({ specialisms: [] });
		await upsertInspector(service, message, context);
		assert.strictEqual(service.dbClient.inspectorSpecialism.upsert.mock.callCount(), 0);
		assert.strictEqual(service.dbClient.inspectorSpecialism.deleteMany.mock.callCount(), 1);
		const deleteArgs = service.dbClient.inspectorSpecialism.deleteMany.mock.calls[0].arguments[0];
		assert.ok(deleteArgs.where.inspectorId);
	});

	test('wraps upsert errors', async () => {
		const service = makeService({ postcodeResponse: { results: [{ DPA: { LAT: 0, LNG: 0 } }] }, upsertThrow: true });
		const message = makeValidMessage();
		await assert.rejects(
			() => upsertInspector(service, message, context),
			/Failed to upsert inspector entra-123: db upsert failed/
		);
		assert.strictEqual(service.dbClient.inspector.upsert.mock.callCount(), 1);
		// specialisms should not be attempted because inspector upsert failed
		assert.strictEqual(service.dbClient.inspectorSpecialism.upsert.mock.callCount(), 0);
	});

	test('fails if specialism upsert throws', async () => {
		const service = makeService({
			postcodeResponse: { results: [{ DPA: { LAT: 3.21, LNG: 6.54 } }] },
			specialismUpsertThrow: true
		});
		await assert.rejects(
			() => upsertInspector(service, makeValidMessage(), context),
			/Failed to upsert inspector entra-123: specialism upsert failed/
		);
		assert.strictEqual(service.dbClient.inspectorSpecialism.deleteMany.mock.callCount(), 1);
	});

	test('fails if specialism deleteMany throws', async () => {
		const service = makeService({
			postcodeResponse: { results: [{ DPA: { LAT: 3.21, LNG: 6.54 } }] },
			specialismDeleteThrow: true
		});
		await assert.rejects(
			() => upsertInspector(service, makeValidMessage(), context),
			/Failed to upsert inspector entra-123: specialism deleteMany failed/
		);
	});
});

describe('buildHandleInspectorMessage', () => {
	let context;
	beforeEach(() => {
		context = makeContext(MESSAGE_EVENT_TYPE.CREATE);
	});
	afterEach(() => {});

	test('calls upsert for create events', async () => {
		const service = makeService({ postcodeResponse: { results: [{ DPA: { LAT: 9, LNG: 8 } }] } });
		const handler = buildHandleInspectorMessage(service);
		const message = makeValidMessage();
		await handler(message, context);
		assert.strictEqual(service.dbClient.inspector.upsert.mock.callCount(), 1);
		assert.strictEqual(service.dbClient.inspector.delete.mock.callCount(), 0);
	});

	test('calls delete for delete events', async () => {
		const service = makeService();
		context = makeContext(MESSAGE_EVENT_TYPE.DELETE);
		const handler = buildHandleInspectorMessage(service);
		const message = makeValidMessage();
		await handler(message, context);
		assert.strictEqual(service.dbClient.inspector.delete.mock.callCount(), 1);
		assert.strictEqual(service.dbClient.inspector.upsert.mock.callCount(), 0);
	});

	test('throws when schema validation fails', async () => {
		const service = makeService();
		const handler = buildHandleInspectorMessage(service);
		const invalidMessage = makeValidMessage({ entraId: undefined });
		await assert.rejects(() => handler(invalidMessage, context), /Inspector message failed schema validation/);
	});

	test('handles UPDATE events same as CREATE', async () => {
		const service = makeService({ postcodeResponse: { results: [{ DPA: { LAT: 5, LNG: 6 } }] } });
		const context2 = makeContext(MESSAGE_EVENT_TYPE.UPDATE);
		const handler = buildHandleInspectorMessage(service);
		await handler(makeValidMessage(), context2);
		assert.strictEqual(service.dbClient.inspector.upsert.mock.callCount(), 1);
		assert.strictEqual(service.dbClient.inspector.delete.mock.callCount(), 0);
	});
});

describe('schema validation (direct Ajv)', () => {
	test('makeValidMessage produces schema-valid inspector', async () => {
		const ajv = new Ajv({ allErrors: true, strict: false, schemas: await loadAllSchemas() });
		const validate = ajv.getSchema('pins-inspector.schema.json');
		const message = makeValidMessage();
		assert.ok(validate(message), `expected valid schema, errors: ${JSON.stringify(validate.errors)}`);
	});

	test('invalid message fails schema validation (missing sapId)', async () => {
		const ajv = new Ajv({ allErrors: true, strict: false, schemas: await loadAllSchemas() });
		const validate = ajv.getSchema('pins-inspector.schema.json');
		const invalid = makeValidMessage({ sapId: undefined });
		assert.strictEqual(validate(invalid), false, 'expected validation to fail');
		assert.ok(
			validate.errors?.some((e) => e.params?.missingProperty === 'sapId'),
			`expected sapId missingProperty error, got: ${JSON.stringify(validate.errors)}`
		);
	});
});
