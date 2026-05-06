import { APPEAL_EVENT_TYPE } from '@planning-inspectorate/data-model';

/**
 * The set of event types that represent site visits
 */
export const SITE_VISIT_EVENT_TYPES = Object.freeze([
	APPEAL_EVENT_TYPE.SITE_VISIT_UNACCOMPANIED,
	APPEAL_EVENT_TYPE.SITE_VISIT_ACCESS_REQUIRED,
	APPEAL_EVENT_TYPE.SITE_VISIT_ACCOMPANIED
]);
