import {
	AppealCase,
	AppealCaseSpecialism,
	AppealEvent,
	Inspector
} from '@pins/inspector-programming-database/src/client';
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
