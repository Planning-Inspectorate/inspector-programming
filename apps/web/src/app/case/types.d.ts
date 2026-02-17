import {
	AppealCase,
	AppealCaseSpecialism,
	AppealEvent,
	Inspector
} from '@pins/inspector-programming-database/src/client/client.ts';
import { CaseViewModel } from '@pins/inspector-programming-lib/data/types';
import { PageViewModel } from '#util/types';
import { MapViewModel } from '../views/home/types';

export interface CasePageViewModel extends PageViewModel {
	map: MapViewModel;
	caseData: CaseViewModel;
	inspectorPin?: Inspector;
}

export interface CaseWithEventsAndSpecialisms extends AppealCase {
	Events: AppealEvent[] | null;
	Specialisms: AppealCaseSpecialism[] | null;
}

export interface CaseToAssign {
	caseId: string | number;
	caseReference: string;
	isParent: boolean;

	// used for timing rules
	caseProcedure: string | null;
	caseLevel: string | null;
	caseType: string | null;

	// used for event generation
	lpaName: string | null;
	siteAddressPostcode: string | null;
}
