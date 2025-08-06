import { AppealHASCase, AppealS78Case } from '@planning-inspectorate/data-model/src/schemas.d.ts';
import { Event } from '@microsoft/microsoft-graph-types';

export type AppealCase = AppealHASCase | AppealS78Case;
export type CalendarEvent = Event;
export interface FetchCasesResponse {
	cases: AppealCase[];
	total: number;
}

export interface dbCase {
	caseReference: string;
	caseStatus: string | null;
	caseType: string | null;
	caseProcedure: string | null;
	allocationLevel: string | null;
	allocationBand: number | null;
	siteAddressLine1: string | null;
	siteAddressLine2?: string | null;
	siteAddressTown: string | null;
	siteAddressCounty: string | null;
	siteAddressPostcode: string | null;
	lpaCode: string | null;
	lpaName: string | null;
	lpaRegion: string | null;
	caseValidDate: Date | null;
	finalCommentsDueDate: Date | null;
	linkedCaseStatus: string | null;
	leadCaseReference: string | null;
}
