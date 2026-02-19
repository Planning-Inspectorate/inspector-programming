import { CalendarEntry } from '../../calendar/types';
import { CaseViewModel, Coordinates } from '@pins/inspector-programming-lib/data/types';
import { InspectorViewModel } from '../../inspector/types';
import { ErrorSummary, PageViewModel, Pagination, RadioOption, TextValue } from '#util/types';

export interface HomeViewModel extends PageViewModel {
	filters: Filters;
	errorSummary?: ErrorSummary[];
	successSummary?: SuccessSummary;
	appeals?: AppealsViewModel;
	calendar?: CalendarViewModel;
	inspectors?: InspectorsViewModel;
	map?: MapViewModel;
}

export interface AppealsViewModel {
	cases: CaseViewModel[];
	assignmentDate?: Date | string;
	caseListError?: string;
	assignmentDateError?: string;
	assignmentDateMin?: string;
}

export interface CalendarViewModel {
	currentStartDate: Date;
	dates: string[];
	grid: CalendarEntry[][];
	times: string[];
	weekTitle: string;

	error?: string;
}

export interface Filters {
	specialisms: RadioOption[];
	caseTypes: RadioOption[];
	pagination: Pagination;
	query: FilterQuery;

	// filter-specific errors, where keys are the filter input name
	errors?: FilterErrors;
}

export interface FilterErrors {
	minimumAge?: TextValue;
	maximumAge?: TextValue;
}

export interface FilterCaseQuery {
	caseSpecialisms?: string[];
	lpaRegion?: string[];
	caseTypes?: string[];
	minimumAge?: string;
	maximumAge?: string;
	inspectorCoordinates?: Coordinates;
}

export interface InspectorsViewModel {
	list: InspectorViewModel[];
	selected?: InspectorViewModel;

	error?: string;
}

export interface MapViewModel {
	apiKey: string;
}
