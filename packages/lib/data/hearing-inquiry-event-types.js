import { APPEAL_EVENT_TYPE } from '@planning-inspectorate/data-model';

/**
 * The set of event types that represent hearings and inquiries
 */
export const HEARING_INQUIRY_EVENT_TYPES = Object.freeze([
	APPEAL_EVENT_TYPE.HEARING,
	APPEAL_EVENT_TYPE.HEARING_VIRTUAL,
	APPEAL_EVENT_TYPE.INQUIRY,
	APPEAL_EVENT_TYPE.INQUIRY_VIRTUAL
]);
