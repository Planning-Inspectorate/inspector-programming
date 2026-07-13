import { formatDateForDisplay } from '@pins/inspector-programming-lib/util/date.js';
import { getCaseColor, toUserCaseStatus } from '../home/view-model.js';

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
	const hasLinkedCases = Array.isArray(c.ChildCases) && c.ChildCases.length > 0;
	const hasDesignatedSitesNames =
		Array.isArray(caseToViewModel.designatedSitesNames) && caseToViewModel.designatedSitesNames.length > 0;
	return {
		...caseToViewModel,
		siteAddress: c.siteAddressLine1,
		specialismList: hasSpecialisms ? c.Specialisms.map((s) => s.specialism).join(', ') : 'None',
		caseStartedDate: formatDateForDisplay(c.caseStartedDate, { format: 'dd/MM/yyyy' }),
		caseSpecialisms: hasSpecialisms ? c.Specialisms.map((s) => s.specialism).join(', ') : 'None',
		eventType: c.eventType ? formatTag(c.eventType) : 'No site visit event set',
		caseAgeColor: getCaseColor(caseToViewModel.caseAge),
		linkedCases: hasLinkedCases ? c.ChildCases.map((c) => c.caseReference).join(', ') : 'None',
		caseStatus: formatTag(toUserCaseStatus(c.caseStatus, c.caseProcedure)),
		caseProcedure: c.caseProcedure?.toUpperCase(),
		isGreenBelt: c.isGreenBelt ? 'Yes' : 'No',
		designatedSitesNames: hasDesignatedSitesNames ? caseToViewModel.designatedSitesNames.join(', ') : 'None',
		typeOfPlanningApplication: c.typeOfPlanningApplication
			? c.typeOfPlanningApplication.replace(/[_-]/g, ' ').toUpperCase()
			: '',
		applicationDecision: c.applicationDecision,
		isAonbNationalLandscape: c.isAonbNationalLandscape ? 'Yes' : 'No',
		finalCommentsDate: formatDateForDisplay(caseToViewModel.finalCommentsDate, { format: 'dd/MM/yyyy' })
	};
}

function formatTag(value) {
	return String(value).replace(/_/g, ' ').toUpperCase();
}
