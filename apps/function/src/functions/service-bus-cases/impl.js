import Ajv from 'ajv';
import { MESSAGE_EVENT_TYPE, loadAllSchemas } from '@planning-inspectorate/data-model';
import { fetchPostcodeCoordinates } from '@pins/inspector-programming-lib/util/fetch-coordinates.js';

/**
 * Cached Ajv instance - initialized once and reused across all messages
 * To the performance overhead of loading schemas on every message
 * @type {Ajv | null}
 */
let cachedAjv = null;

/**
 * Get or initialize the cached Ajv instance
 * @returns {Promise<Ajv>}
 */
async function getAjvInstance() {
	if (!cachedAjv) {
		cachedAjv = new Ajv({
			allErrors: true,
			strict: false,
			schemas: await loadAllSchemas()
		});
	}
	return cachedAjv;
}

/**
 * @param {import('../../service').FunctionService} service
 * @param {string} schemaName - 'appeal-has.schema.json' or 'appeal-s78.schema.json'
 * @returns {import('@azure/functions').ServiceBusTopicHandler}
 */
export function buildHandleCaseMessage(service, schemaName) {
	return async function handleCaseMessage(message, context) {
		context.log(`Received case message for schema: ${schemaName}`);

		// Get event type from message metadata
		const eventType = context?.triggerMetadata?.applicationProperties?.type;
		context.log(`Event type: ${eventType}`);

		// Get cached Ajv instance (performance optimization)
		const ajv = await getAjvInstance();
		const validateCase = ajv.getSchema(schemaName);

		// Check if schema exists
		if (!validateCase) {
			throw new Error(`Schema not found: ${schemaName}. Ensure the schema is registered in the data-model package.`);
		}

		// Validate message against schema
		if (!validateCase(message)) {
			throw new Error(`Case message failed schema validation: ${JSON.stringify(validateCase.errors)}`);
		}
		context.log(`Message validated successfully against ${schemaName}`);

		// If type is Delete, delete the case
		if (eventType === MESSAGE_EVENT_TYPE.DELETE) {
			context.log(`Processing DELETE event for case: ${message.caseReference}`);
			await deleteCase(service, message.caseReference, context);
			return;
		}

		// If inspectorId is set (case is assigned), delete the case from our database
		if (message.inspectorId) {
			context.log(`Case ${message.caseReference} has inspectorId set (${message.inspectorId}), deleting from database`);
			await deleteCase(service, message.caseReference, context);
			return;
		}

		// Otherwise upsert the case
		context.log(`Processing upsert for case: ${message.caseReference}`);
		await upsertCase(service, message, context);
	};
}

/**
 * Delete a case from the database
 * @param {import('../../service').FunctionService} service
 * @param {string} caseReference
 * @param {import('@azure/functions').InvocationContext} context
 * @returns {Promise<void>}
 */
export async function deleteCase(service, caseReference, context) {
	if (!caseReference) {
		context.log('Delete event missing caseReference');
		throw new Error('Delete event missing caseReference');
	}

	try {
		await service.dbClient.appealCase.delete({ where: { caseReference } });
		context.log(`Case with caseReference ${caseReference} has been deleted`);
	} catch (error) {
		// If case doesn't exist, that's fine - log and continue
		if (error.code === 'P2025') {
			context.log(`Case ${caseReference} not found in database, skipping delete`);
			return;
		}
		context.log(`Failed to delete case ${caseReference}: ${error.message}`);
		throw new Error(`Failed to delete case ${caseReference}: ${error.message}`);
	}
}

/**
 * Map incoming message to database format
 * @param {object} message - Appeal case message from Service Bus
 * @param {{latitude: number|null, longitude: number|null}} coords
 * @returns {object} Database input for AppealCase
 */
export function mapToDatabase(message, coords) {
	return {
		caseReference: message.caseReference,
		caseId: message.caseId,
		caseStatus: message.caseStatus ?? null,
		caseType: message.caseType ?? null,
		caseProcedure: message.caseProcedure ?? null,
		originalDevelopmentDescription: message.originalDevelopmentDescription ?? null,
		allocationLevel: message.allocationLevel ?? null,
		allocationBand: message.allocationBand ?? null,
		siteAddressLine1: message.siteAddressLine1 ?? null,
		siteAddressLine2: message.siteAddressLine2 ?? null,
		siteAddressTown: message.siteAddressTown ?? null,
		siteAddressCounty: message.siteAddressCounty ?? null,
		siteAddressPostcode: message.siteAddressPostcode ?? null,
		siteAddressLatitude: coords.latitude,
		siteAddressLongitude: coords.longitude,
		lpaCode: message.lpaCode ?? null,
		lpaName: message.lpaName ?? null,
		caseCreatedDate: message.caseCreatedDate ? new Date(message.caseCreatedDate) : null,
		caseValidDate: message.caseValidDate ? new Date(message.caseValidDate) : null,
		finalCommentsDueDate: message.finalCommentsDueDate ? new Date(message.finalCommentsDueDate) : null,
		linkedCaseStatus: message.linkedCaseStatus ?? null,
		leadCaseReference: message.leadCaseReference ?? null,
		appellantCostsAppliedFor: message.appellantCostsAppliedFor ?? null,
		lpaCostsAppliedFor: message.lpaCostsAppliedFor ?? null
	};
}

/**
 * Upsert a case in the database with coordinates and specialisms
 * @param {import('../../service').FunctionService} service
 * @param {object} message - Appeal case message from Service Bus
 * @param {import('@azure/functions').InvocationContext} context
 * @returns {Promise<void>}
 */
export async function upsertCase(service, message, context) {
	// Validate caseReference exists
	const caseReference = message.caseReference;
	if (!caseReference) {
		context.log('Upsert event missing caseReference');
		throw new Error('Upsert event missing caseReference');
	}

	const postcode = message.siteAddressPostcode || null;
	let coords = { latitude: null, longitude: null };

	// Fetch coordinates if postcode is provided
	if (postcode) {
		try {
			coords = await fetchPostcodeCoordinates(service.osApiClient, postcode);
			context.log(`Fetched coordinates for postcode ${postcode}: lat=${coords.latitude}, lng=${coords.longitude}`);
		} catch (error) {
			context.log(`Warning: Could not fetch coordinates for postcode ${postcode}: ${error.message}`);
			// Continue without coordinates - don't fail the whole operation
		}
	} else {
		context.log('No postcode provided, skipping coordinate lookup');
	}

	const data = mapToDatabase(message, coords);

	// Handle specialisms if present - filter out any invalid entries
	const incomingSpecialisms = (message.specialisms || []).filter((s) => s?.specialism);

	try {
		await service.dbClient.$transaction(async (tx) => {
			// Prepare upsert data
			const createData = { ...data };
			const updateData = { ...data };

			// Remove caseReference from update (it's the where clause)
			delete updateData.caseReference;

			// Handle Lpa relation if lpaCode is present
			if (data.lpaCode) {
				delete createData.lpaCode;
				delete updateData.lpaCode;
				createData.Lpa = { connect: { lpaCode: data.lpaCode } };
				updateData.Lpa = { connect: { lpaCode: data.lpaCode } };
			}

			// Upsert the case
			await tx.appealCase.upsert({
				where: { caseReference },
				create: createData,
				update: updateData
			});
			context.log(`Case upserted successfully: ${caseReference}`);

			// Handle specialisms - delete all existing and recreate
			await tx.appealCaseSpecialism.deleteMany({
				where: { caseReference }
			});

			if (incomingSpecialisms.length > 0) {
				await Promise.all(
					incomingSpecialisms.map((s) =>
						tx.appealCaseSpecialism.create({
							data: {
								caseReference,
								specialism: s.specialism
							}
						})
					)
				);
				context.log(`${incomingSpecialisms.length} specialisms synced for case: ${caseReference}`);
			} else {
				context.log(`No specialisms to sync for case: ${caseReference}`);
			}
		});
	} catch (error) {
		context.log(`Failed to upsert case ${caseReference}: ${error.message}`);
		throw new Error(`Failed to upsert case ${caseReference}: ${error.message}`);
	}
}

/**
 * Reset the cached Ajv instance
 * @returns {void}
 */
export function resetAjvCache() {
	cachedAjv = null;
}
