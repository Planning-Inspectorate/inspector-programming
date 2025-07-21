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
