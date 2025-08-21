import {
	AppealCase,
	AppealCaseSpecialism,
	AppealEvent,
	Inspector
} from 'prisma-client-2e8196588fe8a34a502e6100a3474af541587a272e46e508afe33dfc40ae1937';
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
