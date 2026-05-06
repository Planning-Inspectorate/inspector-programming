import { SITE_VISIT_EVENT_TYPES } from '@pins/inspector-programming-lib/data/site-visit-event-types.js';
import { withRetry } from '@pins/inspector-programming-lib/util/database.ts';
import { getCachedAjv } from '../../util/cached-ajv.js';

const SITE_VISIT_EVENT_TYPES_SET = new Set(SITE_VISIT_EVENT_TYPES);

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').ServiceBusTopicHandler}
 */
export function buildHandleAppealEventMessage(service) {
	return async function handleAppealEventMessage(message, context) {
		context.log(`Received appeal event message`);

		const ajv = await getCachedAjv();
		const validateEvent = ajv.getSchema('appeal-event.schema.json');

		if (!validateEvent) {
			throw new Error(
				'Schema not found: appeal-event.schema.json. Ensure the schema is registered in the data-model package.'
			);
		}

		if (!validateEvent(message)) {
			throw new Error(`Appeal event message failed schema validation: ${JSON.stringify(validateEvent.errors)}`);
		}
		context.log(`Message validated successfully against appeal-event.schema.json`);

		const { caseReference, eventType } = message;

		// Ignore messages that are not site visit event types
		if (!SITE_VISIT_EVENT_TYPES_SET.has(eventType)) {
			context.log(`Ignoring non-site-visit event type: ${eventType} for case ${caseReference}`);
			return;
		}

		context.log(`Processing site visit event type: ${eventType} for case ${caseReference}`);

		// Try to find and update the case in the database
		try {
			await withRetry(async () =>
				service.dbClient.$transaction(async (tx) => {
					const existingCase = await tx.appealCase.findUnique({
						where: { caseReference }
					});

					if (!existingCase) {
						context.log(`Case ${caseReference} not found in database, ignoring event`);
						return;
					}

					// Update the eventType on the case
					await tx.appealCase.update({
						where: { caseReference },
						data: { eventType }
					});

					context.log(`Updated eventType to '${eventType}' for case ${caseReference}`);
				})
			);
		} catch (error) {
			context.log(`Failed to process appeal event for case ${caseReference}:`, error);
			throw new Error(`Failed to process appeal event for case ${caseReference}: ${error.message}`, {
				cause: error
			});
		}
	};
}
