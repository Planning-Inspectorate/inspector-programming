import { SITE_VISIT_EVENT_TYPES } from '@pins/inspector-programming-lib/data/site-visit-event-types.js';
import { HEARING_INQUIRY_EVENT_TYPES } from '@pins/inspector-programming-lib/data/hearing-inquiry-event-types.js';
import { withRetry } from '@planning-inspectorate/core/util';
import { getCachedAjv } from '../../util/cached-ajv.js';

const SITE_VISIT_EVENT_TYPES_SET = new Set(SITE_VISIT_EVENT_TYPES);
const HEARING_INQUIRY_EVENT_TYPES_SET = new Set(HEARING_INQUIRY_EVENT_TYPES);

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

		const isSiteVisit = SITE_VISIT_EVENT_TYPES_SET.has(eventType);
		const isHearingOrInquiry = HEARING_INQUIRY_EVENT_TYPES_SET.has(eventType);

		if (!isSiteVisit && !isHearingOrInquiry) {
			context.log(`Ignoring unsupported event type: ${eventType} for case ${caseReference}`);
			return;
		}

		context.log(
			`Processing ${isSiteVisit ? 'site visit' : 'hearing/inquiry'} event type: ${eventType} for case ${caseReference}`
		);

		// Try to find and update the case in the database
		try {
			await withRetry(
				async () =>
					service.dbClient.$transaction(async (tx) => {
						const existingCase = await tx.appealCase.findUnique({
							where: { caseReference }
						});

						if (!existingCase) {
							context.log(`Case ${caseReference} not found in database, ignoring event`);
							return;
						}

						if (isSiteVisit) {
							// Update the eventType on the case
							await tx.appealCase.update({
								where: { caseReference },
								data: { eventType }
							});

							context.log(`Updated eventType to '${eventType}' for case ${caseReference}`);
							return;
						}

						const data = mapToAppealEvent(message);
						await tx.appealEvent.upsert({
							where: { eventId: message.eventId },
							create: { eventId: message.eventId, ...data },
							update: data
						});

						context.log(`Upserted ${eventType} event ${message.eventId} for case ${caseReference}`);
					}, service.databaseTransactionOptions),
				service.databaseRetryOptions
			);
		} catch (error) {
			context.log(`Failed to process appeal event for case ${caseReference}:`, error);
			throw new Error(`Failed to process appeal event for case ${caseReference}: ${error.message}`, {
				cause: error
			});
		}
	};
}

/**
 * Map an appeal event message to AppealEvent fields (excluding eventId)
 *
 * @param {import('@planning-inspectorate/data-model/src/schemas').AppealEvent} message
 */
export function mapToAppealEvent(message) {
	return {
		caseReference: message.caseReference,
		eventType: message.eventType,
		eventStartDateTime: message?.eventEndDateTime ? new Date(message.eventStartDateTime) : null,
		eventEndDateTime: message?.eventEndDateTime ? new Date(message.eventEndDateTime) : null
	};
}
