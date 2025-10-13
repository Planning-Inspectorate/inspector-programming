import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';
import { getCaseColor } from '../home/view-model.js';

/**
 * @param c
 * @param {CachedCasesClient} caseClient
 * @returns {CaseViewModel}
 */
export function caseToViewModel(caseClient, c) {
	if (!c) {
		return caseClient.caseToViewModel(c);
	}
	const caseToViewModel = caseClient.caseToViewModel(c);
	const hasSpecialisms = Array.isArray(c.Specialisms) && c.Specialisms.length > 0;
	const hasEvents = Array.isArray(c.Events) && c.Events.length > 0;
	return {
		...caseToViewModel,
		siteAddress: c.siteAddressLine1,
		specialismList: hasSpecialisms ? c.Specialisms.map((s) => s.specialism).join(', ') : 'None',
		appealStartDate: hasEvents ? formatDateForDisplay(c.Events[0].eventStartDateTime, { format: 'dd/MM/yyyy' }) : '',
		caseSpecialisms: hasSpecialisms ? c.Specialisms.map((s) => s.specialism).join(', ') : 'None',
		eventType: hasEvents ? c.Events[0].eventType : 'No events',
		caseAgeColor: getCaseColor(caseToViewModel.caseAge)
	};
}
