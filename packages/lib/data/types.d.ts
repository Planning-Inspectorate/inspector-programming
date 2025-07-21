import { AppealHASCase, AppealS78Case } from '@planning-inspectorate/data-model/src/schemas.d.ts';
import { Event } from '@microsoft/microsoft-graph-types';

export type AppealCase = AppealHASCase | AppealS78Case;
export type CalendarEvent = Event;

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

export interface FetchCasesResponse {
	cases: AppealCase[];
	total: number;
}
