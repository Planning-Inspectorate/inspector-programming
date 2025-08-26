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

export interface Inspector {
	id: string;
	firstName: string;
	lastName: string;
	emailAddress: string;
	address?: Address;

	grade?: string;
	fte?: number;

	inspectorManager?: boolean;
	chartingOfficerId?: string;

	specialisms?: Specialism[];
	preclusions?: Preclusion[];
}

export interface Address {
	addressLine1?: string;
	addressLine2?: string;
	townCity?: string;
	county?: string;
	postcode?: string;
}

export interface Specialism {
	name: string;
	proficiency: 'trained' | 'in-training';
	validFrom: Date | string;
}

export type Preclusion = LpaPreclusion | LocationPreclusion | OrganisationPreclusion;

export interface LpaPreclusion {
	lpaId: string;
}

export interface LocationPreclusion {
	postcode: string;
}

export interface OrganisationPreclusion {
	organisation: string;
}
