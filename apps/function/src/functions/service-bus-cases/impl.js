import { MESSAGE_EVENT_TYPE } from '@planning-inspectorate/data-model';
import { fetchPostcodeCoordinates } from '@pins/inspector-programming-lib/util/fetch-coordinates.js';
import { getCachedAjv } from '../../util/cached-ajv.js';

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

		// Get cached Ajv instance and validate schema
		const ajv = await getCachedAjv();
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
		await service.dbClient.$transaction(async (tx) => {
			/* Case deletions don't usually happen. Deleting a parent/lead should automatically unlink all child cases. */

			// Remove this case as the lead reference from all associated child cases
			const childCaseUpdate = await tx.appealCase.updateMany({
				where: { leadCaseReference: caseReference },
				data: { leadCaseReference: null, linkedCaseStatus: null }
			});
			if (childCaseUpdate.count > 0) {
				context.log(`Unlinked ${childCaseUpdate.count} child cases from lead case ${caseReference}`);
			}

			// Delete related AppealEvents (explicit delete for clarity, even though cascade should handle this)
			const deletedEvents = await tx.appealEvent.deleteMany({
				where: { caseReference }
			});
			if (deletedEvents.count > 0) {
				context.log(`Deleted ${deletedEvents.count} AppealEvents for case ${caseReference}`);
			}

			// Delete related AppealCaseSpecialisms (explicit delete for clarity, even though cascade should handle this)
			const deletedSpecialisms = await tx.appealCaseSpecialism.deleteMany({
				where: { caseReference }
			});
			if (deletedSpecialisms.count > 0) {
				context.log(`Deleted ${deletedSpecialisms.count} AppealCaseSpecialisms for case ${caseReference}`);
			}

			// Finally, delete the main AppealCase record
			await tx.appealCase.delete({ where: { caseReference } });
			// save in the DB that we have an update
			await tx.appealCasePollStatus.upsert({
				where: { id: 1 },
				create: {
					lastPollAt: new Date(),
					casesFetched: -1 // not used
				},
				update: {
					lastPollAt: new Date()
				}
			});
		});
		context.log(`Case with caseReference ${caseReference} has been deleted`);
	} catch (error) {
		// If case doesn't exist, that's fine - log and continue
		if (error.code === 'P2025') {
			context.log(`Case ${caseReference} not found in database, skipping delete`);
			return;
		}
		context.log(`Failed to delete case ${caseReference}:`, error);
		throw new Error(`Failed to delete case ${caseReference}: ${error.message}`);
	}
}

/**
 * @typedef {import('@planning-inspectorate/data-model/src/schemas').AppealHASCase | import('@planning-inspectorate/data-model/src/schemas').AppealS78Case} AppealCaseMessage
 */

/**
 * Map incoming message to database format
 * @param {AppealCaseMessage} message
 * @param {{latitude: number|null, longitude: number|null}} coords
 * @returns {import('@pins/inspector-programming-database/src/client/client.js').Prisma.AppealCaseCreateInput}
 */
export function mapToDatabase(message, coords) {
	const data = {
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

	if (message.lpaCode) {
		data.Lpa = {
			connect: { lpaCode: message.lpaCode }
		};
	}

	return data;
}

/**
 * Upsert a case in the database with coordinates and specialisms
 * @param {import('../../service').FunctionService} service
 * @param {AppealCaseMessage} message
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
			context.log(`Warning: Could not fetch coordinates for postcode ${postcode}:`, error);
			// Continue without coordinates - don't fail the whole operation
		}
	} else {
		context.log('No postcode provided, skipping coordinate lookup');
	}

	const data = mapToDatabase(message, coords);

	// Handle specialisms if present - filter out any invalid entries
	const incomingCaseSpecialisms = (message.caseSpecialisms || []).filter((s) => s?.name);
	const incomingCaseSpecialismNames = incomingCaseSpecialisms.map((s) => s.name);

	try {
		await service.dbClient.$transaction(async (tx) => {
			//upserting the appeal case
			await tx.appealCase.upsert({
				where: { caseReference },
				create: data,
				update: data
			});
			context.log(`Case upserted successfully: ${caseReference}`);

			// Remove appeal case specialisms that are not present in the incoming specialisms from the database
			await tx.appealCaseSpecialism.deleteMany({
				where: {
					caseReference,
					specialism: { notIn: incomingCaseSpecialismNames }
				}
			});
			context.log(`Removed specialisms not present in incoming data: ${caseReference}`);

			// Upsert appeal case specialisms
			if (incomingCaseSpecialisms.length) {
				await Promise.all(
					incomingCaseSpecialisms.map((s) =>
						tx.appealCaseSpecialism.upsert({
							where: { caseReference_specialism: { caseReference, specialism: s.specialism } },
							create: {
								caseReference,
								specialism: s.specialism
							},
							update: {
								specialism: s.specialism
							}
						})
					)
				);
				context.log(`Upserted specialisms for case: ${caseReference}`);
			}
			// save in the DB that we have an update
			await tx.appealCasePollStatus.upsert({
				where: { id: 1 },
				create: {
					lastPollAt: new Date(),
					casesFetched: -1 // not used
				},
				update: {
					lastPollAt: new Date()
				}
			});
		});
	} catch (error) {
		context.log(`Failed to upsert case ${caseReference}:`, error);
		throw new Error(`Failed to upsert case ${caseReference}: ${error}`);
	}
}
