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
	const hasLinkedCases = Array.isArray(c.ChildCases) && c.ChildCases.length > 0;
	const hasDesignatedSitesNames = c.designatedSitesNames && JSON.parse(c.designatedSitesNames).length > 0;
	return {
		...caseToViewModel,
		siteAddress: c.siteAddressLine1,
		specialismList: hasSpecialisms ? c.Specialisms.map((s) => s.specialism).join(', ') : 'None',
		caseStartedDate: formatDateForDisplay(c.caseStartedDate, { format: 'dd/MM/yyyy' }),
		caseSpecialisms: hasSpecialisms ? c.Specialisms.map((s) => s.specialism).join(', ') : 'None',
		eventType: hasEvents ? formatTag(c.Events[0].eventType) : 'No events',
		caseAgeColor: getCaseColor(caseToViewModel.caseAge),
		linkedCases: hasLinkedCases ? c.ChildCases.map((c) => c.caseReference).join(', ') : 'None',
		caseStatus: formatTag(c.caseStatus),
		caseProcedure: c.caseProcedure?.toUpperCase(),
		isGreenBelt: c.isGreenBelt ? 'Yes' : 'No',
		designatedSitesNames: hasDesignatedSitesNames ? JSON.parse(c.designatedSitesNames).join(', ') : 'None',
		typeOfPlanningApplication: c.typeOfPlanningApplication
			? c.typeOfPlanningApplication.replace(/[_-]/g, ' ').toUpperCase()
			: '',
		applicationDecision: c.applicationDecision,
		isAonbNationalLandscape: c.isAonbNationalLandscape ? 'Yes' : 'No'
	};
}

function formatTag(value) {
	return String(value).replace(/_/g, ' ').toUpperCase();
}
