import crypto from 'node:crypto';
import { APPEAL_EVENT_TYPE, APPEAL_EVENT_STATUS } from '@planning-inspectorate/data-model';
import { addWeeks } from 'date-fns';

const siteVisitEventTypes = [
	APPEAL_EVENT_TYPE.SITE_VISIT_ACCESS_REQUIRED,
	APPEAL_EVENT_TYPE.SITE_VISIT_ACCOMPANIED,
	APPEAL_EVENT_TYPE.SITE_VISIT_UNACCOMPANIED
];
const otherEventTypes = [
	APPEAL_EVENT_TYPE.HEARING,
	APPEAL_EVENT_TYPE.HEARING_VIRTUAL,
	APPEAL_EVENT_TYPE.IN_HOUSE,
	APPEAL_EVENT_TYPE.INQUIRY,
	APPEAL_EVENT_TYPE.INQUIRY_VIRTUAL,
	APPEAL_EVENT_TYPE.PRE_INQUIRY,
	APPEAL_EVENT_TYPE.PRE_INQUIRY_VIRTUAL
];

const eventStatuses = Object.values(APPEAL_EVENT_STATUS);

/**
 *
 * @param {string} reference
 * @param {Date} valid
 * @returns {Prisma.AppealEventCreateNestedManyWithoutAppealCaseInput}
 */
export function generateCaseEvents(reference, valid) {
	/** @type {import('@pins/inspector-programming-database/src/client').Prisma.AppealEventCreateNestedManyWithoutAppealCaseInput} */
	const events = { connectOrCreate: [] };
	const randomPercent = crypto.randomInt(100);

	function event(id, types) {
		return {
			id,
			eventType: types[crypto.randomInt(siteVisitEventTypes.length)],
			eventStatus: eventStatuses[crypto.randomInt(eventStatuses.length)],
			eventStartDateTime: addWeeks(valid, crypto.randomInt(12))
		};
	}

	// using fixed IDs (relative to the case reference) so that they are deterministic
	// however using random values does mean that if seeding multiple times then more events will be created
	if (randomPercent > 5) {
		// most cases have a site visit
		const id = `${reference}-1`;
		events.connectOrCreate.push({
			where: { id },
			create: event(id, siteVisitEventTypes)
		});
	}

	if (randomPercent > 45) {
		// some with have another visit
		const id = `${reference}-2`;
		events.connectOrCreate.push({
			where: { id },
			create: event(id, otherEventTypes)
		});
	}

	return events;
}
