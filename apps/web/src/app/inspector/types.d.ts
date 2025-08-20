import { Inspector } from '@pins/inspector-programming-database/src/client';

export interface InspectorViewModel extends Inspector {
	Specialisms: Specialism[];
}

export interface Specialism {
	name: string;
	proficiency: string;
	validFrom: Date | string;
}
