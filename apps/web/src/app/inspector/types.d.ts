import { Inspector } from '@pins/inspector-programming-database/src/client';

export interface InspectorViewModel extends Inspector {
	specialisms: Specialism[];
	specialismsList: string;
}

export interface Specialism {
	name: string;
	proficiency: string;
	validFrom: Date | string;
}
