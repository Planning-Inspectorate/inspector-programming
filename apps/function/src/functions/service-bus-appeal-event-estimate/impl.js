import { MESSAGE_EVENT_TYPE } from '@planning-inspectorate/data-model';
import { withRetry } from '@planning-inspectorate/core/util';
import { getCachedAjv } from '../../util/cached-ajv.js';

const SCHEMA_NAME = 'appeal-event-estimate.schema.json';

/**
 * @typedef {import('@planning-inspectorate/data-model/src/schemas').AppealEventEstimate} AppealEventEstimateMessage
 */

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').ServiceBusTopicHandler}
 */
export function buildHandleAppealEventEstimateMessage(service) {
	return async function handleAppealEventEstimateMessage(message, context) {
		const caseReference = message?.caseReference;
		// prefix all log messages with the case reference
		const log = (...args) => context.log(`[${caseReference}]`, ...args);
		log('Received appeal event estimate message');

		//// Get event type from message metadata
		const eventType = context?.triggerMetadata?.applicationProperties?.type;
		log(`Event type: ${eventType}`);

		// Get cached Ajv instance and validate schema
		const ajv = await getCachedAjv();
		const validateEstimate = ajv.getSchema(SCHEMA_NAME);

		// Check if schema exists
		if (!validateEstimate) {
			// ensure messages are logged in function traces not just exceptions
			log('schema not found', SCHEMA_NAME);
			throw new Error(`Schema not found: ${SCHEMA_NAME}. Ensure the schema is registered in the data-model package.`);
		}

		// Validate message against schema
		if (!validateEstimate(message)) {
			// ensure messages are logged in function traces not just exceptions
			log('message failed schema validation', JSON.stringify(validateEstimate.errors));
			throw new Error(
				`Appeal event estimate message failed schema validation: ${JSON.stringify(validateEstimate.errors)}`
			);
		}
		log(`Message validated successfully against ${SCHEMA_NAME}`);

		// If type is Delete, delete the case estimate, otherwise upsert the estimate
		if (eventType === MESSAGE_EVENT_TYPE.DELETE) {
			await deleteAppealEventEstimate(service, message, log);
			return;
		}

		await upsertAppealEventEstimate(service, message, log);
	};
}

/**
 * Map an incoming message to the database format
 * @param {AppealEventEstimateMessage} message
 * @returns {import('@pins/inspector-programming-database/src/client/client.js').Prisma.AppealEventEstimateUncheckedCreateInput}
 */
export function mapToDatabase(message) {
	return {
		id: message.id,
		caseReference: message.caseReference,
		preparationTime: message.preparationTime ?? null,
		sittingTime: message.sittingTime ?? null,
		reportingTime: message.reportingTime ?? null
	};
}

/**
 * Delete an estimate from the database
 * @param {import('../../service').FunctionService} service
 * @param {AppealEventEstimateMessage} message
 * @param {import('@azure/functions').InvocationContext['log']} log
 * @returns {Promise<void>}
 */
export async function deleteAppealEventEstimate(service, message, log) {
	try {
		const { count } = await withRetry(
			async () => service.dbClient.appealEventEstimate.deleteMany({ where: { id: message.id } }),
			service.databaseRetryOptions
		);
		// Log whether the estimate was deleted or not found
		log(count > 0 ? `Deleted event estimate ${message.id}` : `Event estimate ${message.id} not found, skipping delete`);
	} catch (error) {
		log(`Failed to delete event estimate ${message.id}:`, error);
		throw new Error(
			`Failed to delete event estimate ${message.id} for case ${message.caseReference}: ${error.message}`,
			{ cause: error }
		);
	}
}

/**
 * Upsert an estimate in the database, ignoring estimates for cases not in the database
 * @param {import('../../service').FunctionService} service
 * @param {AppealEventEstimateMessage} message
 * @param {import('@azure/functions').InvocationContext['log']} log
 * @returns {Promise<void>}
 */
export async function upsertAppealEventEstimate(service, message, log) {
	const { caseReference } = message;
	const data = mapToDatabase(message);

	try {
		await withRetry(
			async () =>
				service.dbClient.$transaction(async (tx) => {
					const existingCase = await tx.appealCase.findUnique({
						where: { caseReference },
						select: { caseReference: true }
					});
					if (!existingCase) {
						log(`Case ${caseReference} not found in database, ignoring event estimate`);
						return;
					}

					// a case has only one estimate, so match on caseReference
					await tx.appealEventEstimate.upsert({
						where: { caseReference },
						create: data,
						update: data
					});
					log(`Upserted event estimate ${message.id}`);
				}, service.databaseTransactionOptions),
			service.databaseRetryOptions
		);
	} catch (error) {
		log(`Failed to upsert event estimate ${message.id}:`, error);
		throw new Error(`Failed to upsert event estimate for case ${caseReference}: ${error.message}`, { cause: error });
	}
}
