import { AppealHASCase, AppealS78Case } from '@planning-inspectorate/data-model/src/schemas.d.ts';
import { Event } from '@microsoft/microsoft-graph-types';
import { AppealCaseSpecialism } from '@pins/inspector-programming-database/src/client';
import { Inspector } from '@pins/inspector-programming-database/src/client';
import { Decimal } from '@pins/inspector-programming-database/src/client/runtime/library';

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
	linkedCaseReferences: string[];
	caseReceivedDate: Date | null;
	finalCommentsDate: Date | string;
	specialisms: AppealCaseSpecialism[] | null;
	specialismList: string | null;
	leadCaseReference: string | null;
}

export interface Filters {
	minimumAge?: string;
	maximumAge?: string;
}

export interface FilterQuery {
	case?: FilterCaseQuery;

	limit?: number;
	page?: number;
	sort?: string | 'age' | 'distance' | 'hybrid';
	inspectorId?: string;
}

export interface InspectorViewModel extends Inspector {
	specialisms: Specialism[];
	specialismsList: string;
}

export interface Specialism {
	name: string;
	proficiency: string;
	validFrom: Date | string;
}

export interface Coordinates {
	lat: Decimal | number | null;
	lng: Decimal | number | null;
}
