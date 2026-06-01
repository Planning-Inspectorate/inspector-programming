import { APPEAL_LINKED_CASE_STATUS, MESSAGE_EVENT_TYPE } from '@planning-inspectorate/data-model';
import { fetchPostcodeCoordinates } from '@pins/inspector-programming-lib/util/fetch-coordinates.js';
import { getCachedAjv } from '../../util/cached-ajv.js';
import { withRetry } from '@pins/inspector-programming-lib/util/database.ts';

/**
 * @param {import('../../service').FunctionService} service
 * @param {string} schemaName - 'appeal-has.schema.json' or 'appeal-s78.schema.json'
 * @returns {import('@azure/functions').ServiceBusTopicHandler}
 */
export function buildHandleCaseMessage(service, schemaName) {
	return async function handleCaseMessage(message, context) {
		const caseReference = message.caseReference;
		// prefix all log messages with the case reference
		const log = (...args) => context.log(`[${caseReference}]`, ...args);
		log(`Received case message for schema: ${schemaName}`);

		// Get event type from message metadata
		const eventType = context?.triggerMetadata?.applicationProperties?.type;
		log(`Event type: ${eventType}`);

		// Get cached Ajv instance and validate schema
		const ajv = await getCachedAjv();
		const validateCase = ajv.getSchema(schemaName);

		// Check if schema exists
		if (!validateCase) {
			// ensure messages are logged in function traces not just exceptions
			log('schema not found', schemaName);
			throw new Error(`Schema not found: ${schemaName}. Ensure the schema is registered in the data-model package.`);
		}

		// Validate message against schema
		if (!validateCase(message)) {
			// ensure messages are logged in function traces not just exceptions
			log('message failed schema validation', JSON.stringify(validateCase.errors));
			throw new Error(`Case message failed schema validation: ${JSON.stringify(validateCase.errors)}`);
		}
		log(`Message validated successfully against ${schemaName}`);

		// If type is Delete, delete the case
		if (eventType === MESSAGE_EVENT_TYPE.DELETE) {
			log(`Processing DELETE event for case: ${message.caseReference}`);
			await deleteCase(service, message.caseReference, log);
			return;
		}

		// If inspectorId is set (case is assigned), delete the case from our database
		if (message.inspectorId) {
			log(`Case ${message.caseReference} has inspectorId set (${message.inspectorId}), deleting from database`);
			await deleteCase(service, message.caseReference, log);
			return;
		}

		// If padsSapId is set (case is assigned), delete the case from our database
		if (message.padsSapId) {
			log(`Case ${message.caseReference} has padsSapId set (${message.padsSapId}), deleting from database`);
			await deleteCase(service, message.caseReference, log);
			return;
		}

		// Otherwise upsert the case
		log(`Processing upsert for case: ${message.caseReference}`);
		await upsertCase(service, message, log);
	};
}

/**
 * Delete a case from the database
 * @param {import('../../service').FunctionService} service
 * @param {string} caseReference
 * @param {import('@azure/functions').InvocationContext['log']} log
 * @returns {Promise<void>}
 */
export async function deleteCase(service, caseReference, log) {
	if (!caseReference) {
		log('Delete event missing caseReference');
		throw new Error('Delete event missing caseReference');
	}

	try {
		await withRetry(async () =>
			service.dbClient.$transaction(async (tx) => {
				/* Case deletions don't usually happen. Deleting a parent/lead should automatically unlink all child cases. */

				// Remove this case as the lead reference from all associated child cases
				const childCaseUpdate = await tx.appealCase.updateMany({
					where: { leadCaseReference: caseReference },
					data: { leadCaseReference: null, linkedCaseStatus: null }
				});
				if (childCaseUpdate.count > 0) {
					log(`Unlinked ${childCaseUpdate.count} child cases from lead case ${caseReference}`);
				}

				// Delete related AppealEvents (explicit delete for clarity, even though cascade should handle this)
				const deletedEvents = await tx.appealEvent.deleteMany({
					where: { caseReference }
				});
				if (deletedEvents.count > 0) {
					log(`Deleted ${deletedEvents.count} AppealEvents for case ${caseReference}`);
				}

				// Delete related AppealCaseSpecialisms (explicit delete for clarity, even though cascade should handle this)
				const deletedSpecialisms = await tx.appealCaseSpecialism.deleteMany({
					where: { caseReference }
				});
				if (deletedSpecialisms.count > 0) {
					log(`Deleted ${deletedSpecialisms.count} AppealCaseSpecialisms for case ${caseReference}`);
				}

				// Finally, delete the main AppealCase record
				await tx.appealCase.delete({ where: { caseReference } });
			})
		);
		log(`Case with caseReference ${caseReference} has been deleted`);
		// save in the DB that we have an update
		// this is outside the transaction, it doesn't need to be atomic with the data update
		await service.dbClient.appealCasePollStatus.upsert({
			where: { id: 1 },
			create: {
				lastPollAt: new Date(),
				casesFetched: -1 // not used
			},
			update: {
				lastPollAt: new Date()
			}
		});
		log(`Poll status has been updated`);
	} catch (error) {
		// If case doesn't exist, that's fine - log and continue
		if (error.code === 'P2025') {
			log(`Case ${caseReference} not found in database, skipping delete`);
			return;
		}
		log(`Failed to delete case ${caseReference}:`, error);
		throw new Error(`Failed to delete case ${caseReference}: ${error.message}`, { cause: error });
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
	let designatedSitesNames = null;
	if (Array.isArray(message.designatedSitesNames) && message.designatedSitesNames.length > 0) {
		designatedSitesNames = JSON.stringify(message.designatedSitesNames);
	}

	/** @type {import('@pins/inspector-programming-database/src/client/client.js').Prisma.AppealCaseCreateInput} */
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
		lpaName: message.lpaName ?? null,
		caseCreatedDate: message.caseCreatedDate ? new Date(message.caseCreatedDate) : null,
		caseValidDate: message.caseValidDate ? new Date(message.caseValidDate) : null,
		finalCommentsDueDate: message.finalCommentsDueDate ? new Date(message.finalCommentsDueDate) : null,
		linkedCaseStatus: message.linkedCaseStatus ?? null,
		appellantCostsAppliedFor: message.appellantCostsAppliedFor ?? null,
		lpaCostsAppliedFor: message.lpaCostsAppliedFor ?? null,
		isGreenBelt: message.isGreenBelt ?? null,
		designatedSitesNames,
		typeOfPlanningApplication: message.typeOfPlanningApplication ?? null,
		applicationDecision: message.applicationDecision ?? null,
		isAonbNationalLandscape: message.isAonbNationalLandscape ?? null,
		caseStartedDate: message.caseStartedDate ? new Date(message.caseStartedDate) : null
	};

	// Connect the LPA relation
	if (message.lpaCode) {
		data.Lpa = {
			connect: { lpaCode: message.lpaCode }
		};
	}

	// Connect the LeadCase relation
	if (message.linkedCaseStatus === APPEAL_LINKED_CASE_STATUS.CHILD && message.leadCaseReference) {
		// currently Manage appeals uses caseId + 6,000,000 for the case reference
		// so we reverse that here to compute the ID
		// future runs which populate the full case can change the caseId if it iss wrong,
		// as they match on case reference anyway
		const leadCaseId = parseInt(message.leadCaseReference) - 6_000_000;
		data.LeadCase = {
			connectOrCreate: {
				where: { caseReference: message.leadCaseReference },
				// messages are async and the lead case may not yet be in the database
				// so that the insert doesn't fail, we create a skeleton lead case if needed
				create: {
					caseId: leadCaseId,
					caseReference: message.leadCaseReference
				}
			}
		};
	}

	return data;
}

/**
 * Upsert a case in the database with coordinates and specialisms
 * @param {import('../../service').FunctionService} service
 * @param {AppealCaseMessage} message
 * @param {import('@azure/functions').InvocationContext['log']} log
 * @returns {Promise<void>}
 */
export async function upsertCase(service, message, log) {
	// Validate caseReference exists
	const caseReference = message.caseReference;
	if (!caseReference) {
		log('Upsert event missing caseReference');
		throw new Error('Upsert event missing caseReference');
	}

	const postcode = message.siteAddressPostcode || null;
	let coords = { latitude: null, longitude: null };

	// Fetch coordinates if postcode is provided
	if (postcode) {
		try {
			coords = await fetchPostcodeCoordinates(service.osApiClient, postcode);
			log(`Fetched coordinates for postcode ${postcode}: lat=${coords.latitude}, lng=${coords.longitude}`);
		} catch (error) {
			log(`Warning: Could not fetch coordinates for postcode ${postcode}:`, error);
			// Continue without coordinates - don't fail the whole operation
		}
	} else {
		log('No postcode provided, skipping coordinate lookup');
	}

	const data = mapToDatabase(message, coords);

	// Handle specialisms if present - filter out any invalid entries
	const incomingCaseSpecialisms = (message.caseSpecialisms || []).filter(Boolean);

	try {
		await withRetry(async () =>
			service.dbClient.$transaction(async (tx) => {
				//upserting the appeal case
				await tx.appealCase.upsert({
					where: { caseReference },
					create: data,
					update: data
				});
				log(`Case upserted successfully: ${caseReference}`);

				// Remove appeal case specialisms that are not present in the incoming specialisms from the database
				const { count } = await tx.appealCaseSpecialism.deleteMany({
					where: {
						caseReference,
						specialism: { notIn: incomingCaseSpecialisms }
					}
				});
				log(`Removed ${count} specialisms not present in incoming data: ${caseReference}`);

				// Upsert appeal case specialisms
				if (incomingCaseSpecialisms.length) {
					await Promise.all(
						incomingCaseSpecialisms.map((specialism) =>
							tx.appealCaseSpecialism.upsert({
								where: { caseReference_specialism: { caseReference, specialism } },
								create: {
									caseReference,
									specialism
								},
								update: {
									specialism
								}
							})
						)
					);
					log(`Upserted ${incomingCaseSpecialisms.length} specialisms for case: ${caseReference}`);
				} else {
					log(`No specialisms for case ${caseReference}`);
				}
			})
		);
		// save in the DB that we have an update
		// this is outside the transaction, it doesn't need to be atomic with the data update
		await service.dbClient.appealCasePollStatus.upsert({
			where: { id: 1 },
			create: {
				lastPollAt: new Date(),
				casesFetched: -1 // not used
			},
			update: {
				lastPollAt: new Date()
			}
		});
		log(`Poll status has been updated`);
	} catch (error) {
		log(`Failed to upsert case ${caseReference}:`, error);
		throw new Error(`Failed to upsert case ${caseReference}: ${error}`, { cause: error });
	}
}
