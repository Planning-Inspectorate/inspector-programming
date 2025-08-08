import { AppealHASCase, AppealS78Case } from '@planning-inspectorate/data-model/src/schemas.d.ts';
import { Event } from '@microsoft/microsoft-graph-types';

export type AppealCase = AppealHASCase | AppealS78Case;
export type CalendarEvent = Event;
export interface FetchCasesResponse {
	cases: AppealCase[];
	total: number;
}

interface ProcessedHASCase extends AppealHASCase {
	lat: number | null;
	lng: number | null;
}

interface ProcessedS78Case extends AppealS78Case {
	lat: number | null;
	lng: number | null;
}

export type ProcessedAppealCase = ProcessedHASCase | ProcessedS78Case;

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
	lat: number | null;
	lng: number | null;
}

export interface LatLong {
	lat: number;
	lng: number;
}
