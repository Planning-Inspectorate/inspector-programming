import { MESSAGE_EVENT_TYPE } from '@planning-inspectorate/data-model';
import { fetchPostcodeCoordinates } from '@pins/inspector-programming-lib/util/fetch-coordinates.js';
import { getCachedAjv } from '../../util/cached-ajv.js';

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').ServiceBusTopicHandler}
 */
export function buildHandleInspectorMessage(service) {
	return async function handleInspectorMessage(message, context) {
		context.log('Received inspector message');
		const eventType = context?.triggerMetadata?.applicationProperties?.type;

		const ajv = await getCachedAjv();
		const validateInspector = ajv.getSchema('pins-inspector.schema.json');

		if (!validateInspector(message)) {
			throw new Error(`Inspector message failed schema validation: ${JSON.stringify(validateInspector.errors)}`);
		}

		if (eventType === MESSAGE_EVENT_TYPE.DELETE) {
			await deleteInspector(service, message.entraId, context);
			return;
		}

		await upsertInspector(service, message, context);
	};
}

/**
 * @param {import('../../service').FunctionService} service
 * @param {string} entraId
 * @param {import('@azure/functions').InvocationContext} context
 * @returns {Promise<void>}
 */
export async function deleteInspector(service, entraId, context) {
	if (!entraId) {
		context.log('Delete event missing stable inspector identifier');
		throw new Error('Delete event missing stable inspector identifier');
	}

	try {
		await service.dbClient.inspector.delete({ where: { entraId } });
		context.log(`Inspector with entraId ${entraId} has been deleted`);
	} catch (error) {
		context.log(`Error deleting inspector: ${error.message}`);
		throw new Error(`Error deleting inspector: ${error.message}`);
	}
}

/**
 * @param {import('@planning-inspectorate/data-model/src/schemas').PINSInspector} message
 * @param {{latitude: number|null, longitude: number|null}} coords
 * @returns {import('@pins/inspector-programming-database/src/client/client.js').Prisma.InspectorCreateInput}
 */
export function mapToDatabase(message, coords) {
	return {
		firstName: message.firstName,
		lastName: message.lastName,
		grade: message.grade,
		email: message.email,
		postcode: message.address?.postcode ?? null,
		entraId: message.entraId,
		latitude: coords.latitude,
		longitude: coords.longitude
	};
}

/**
 * @param {import('../../service').FunctionService} service
 * @param {import('@planning-inspectorate/data-model/src/schemas').PINSInspector} message
 * @param {import('@azure/functions').InvocationContext} context
 * @returns {Promise<void>}
 */
export async function upsertInspector(service, message, context) {
	const entraId = message.entraId;
	const postcode = message.address?.postcode || null;

	if (!postcode) {
		context.log(`Inspector message missing postcode for entraId: ${entraId}`);
		throw new Error(`Inspector message missing postcode for entraId: ${entraId}`);
	}

	const coords = await fetchPostcodeCoordinates(service.osApiClient, postcode);

	if (coords.latitude === null || coords.longitude === null) {
		context.log(`No coordinates found for postcode: ${postcode}`);
		throw new Error(`No coordinates found for postcode: ${postcode}`);
	}

	const data = mapToDatabase(message, coords);
	const incoming = (message.specialisms || []).filter((s) => s?.name);
	const incomingNames = incoming.map((s) => s.name);

	try {
		await service.dbClient.$transaction(async (tx) => {
			// Upsert inspector
			const inspectorRecord = await tx.inspector.upsert({
				where: { entraId },
				create: data,
				update: data,
				select: { id: true }
			});
			context.log(`Inspector has been upserted: ${entraId}`);

			const inspectorId = inspectorRecord.id;

			// Remove inspector specialisms not in incoming data
			await tx.inspectorSpecialism.deleteMany({
				where: {
					inspectorId,
					name: { notIn: incomingNames }
				}
			});

			// Upsert inspector specialisms
			await Promise.all(
				incoming.map((s) =>
					tx.inspectorSpecialism.upsert({
						where: { inspectorId_name: { inspectorId, name: s.name } },
						create: {
							inspectorId,
							name: s.name,
							proficiency: s.proficiency ?? null,
							validFrom: s.validFrom ? new Date(s.validFrom) : null
						},
						update: {
							proficiency: s.proficiency ?? null,
							validFrom: s.validFrom ? new Date(s.validFrom) : null
						}
					})
				)
			);
			context.log(`Specialisms synced for inspector: ${entraId}`);
		});
	} catch (error) {
		context.log(`Failed to upsert inspector ${entraId}: ${error.message}`);
		throw new Error(`Failed to upsert inspector ${entraId}: ${error.message}`);
	}
}
