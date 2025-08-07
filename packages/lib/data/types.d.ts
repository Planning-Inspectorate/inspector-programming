import { AppealHASCase, AppealS78Case } from '@planning-inspectorate/data-model/src/schemas.d.ts';
import { Event } from '@microsoft/microsoft-graph-types';

export type AppealCase = AppealHASCase | AppealS78Case;
export type CalendarEvent = Event;
export interface FetchCasesResponse {
	cases: AppealCase[];
	total: number;
}

export interface CaseViewModel {
	caseId: string | null;
	caseType: string | null;
	caseProcedure: string | null;
	allocationBand: string | number | null;
	caseLevel: string | null;
	siteAddressPostcode: string | null;
	lpaName: string | null;
	lpaRegion: string | null;
	caseStatus: string | null;
	caseAge: number;
	linkedCases: number;
	finalCommentsDate: Date;
}

export interface InspectorViewModel {
	id: string;
	firstName: string;
	lastName: string;
	emailAddress: string | null;
	postcode: string | null;
}
