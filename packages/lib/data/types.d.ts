import { AppealHASCase, AppealS78Case } from '@planning-inspectorate/data-model/src/schemas.d.ts';
import { Event } from '@microsoft/microsoft-graph-types';
import { AppealCaseSpecialism } from '@pins/inspector-programming-database/src/client';

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
	siteAddressLongitude: number | null;
	siteAddressLatitude: number | null;
	lpaName: string | null;
	lpaRegion: string | null;
	caseStatus: string | null;
	caseAge: number;
	caseAgeColor?: string;
	linkedCases: number;
	caseReceivedDate: Date | null;
	finalCommentsDate: Date | string;
	specialisms: AppealCaseSpecialism[] | null;
	specialismList: string | null;
}

export interface Filters {
	minimumAge?: string;
	maximumAge?: string;
}
